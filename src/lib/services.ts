import {spawn, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams} from 'node:child_process';
import { LogLevel, Logger, Logging} from './log.js';
import {once} from 'events';
import * as fs from 'fs';

export enum ServiceStatus {
    NOT_STARTED = `NOT_STARTED`,
    STARTING = `STARTING`,
    RUNNING = `RUNNING`,
    STOPPING = `STOPPING`,
    STOPPED = `STOPPED`,
    FAULTED = `FAULTED`,
    UNKNOWN = `UNKNOWN`
}

export enum ServiceEvents {
    STATUS_CHANGED = `status`,
}

export abstract class Service extends Logging {
    abstract bin: string
    abstract args: string[]
    abstract opts: SpawnOptionsWithoutStdio

    childProcess?: ChildProcessWithoutNullStreams;

    _status: ServiceStatus = ServiceStatus.UNKNOWN;
    get status() {
        return this._status;
    }

    set status(_status: ServiceStatus) {
        this._status = _status;
        this.emit(ServiceEvents.STATUS_CHANGED, this._status)
        Logger.debug(`Status of ${this.bin} updated to ${this._status}`);
    }

    abstract onMessage(msg: string): boolean
    abstract onError(msg: string): boolean

    async start() {
        if (this.childProcess) {
            Logger.warn(`Unable to spawn instance of ${this.bin}, already running with PID ${this.childProcess.pid}`);
            return
        }

        await this.available();

        Logger.debug(`Spawning process for ${this.bin} with arguments ${JSON.stringify(this.args)} and options ${JSON.stringify(this.opts)}...`);
        this.childProcess = spawn(this.bin, this.args, this.opts);
        this.status = ServiceStatus.STARTING;

        this.childProcess.stdout.on(`data`, async msg => {
            this.appendLog(LogLevel.INFO, String(msg))
            if (!this.onMessage(String(msg))) {
                Logger.warn(`Unknown message from ${this.bin}: ${msg}`);
            }
        });

        this.childProcess.stderr.on(`data`, msg => {
            this.appendLog(LogLevel.ERROR, String(msg))
            if (!this.onError(String(msg))) {
                Logger.warn(`Unknown error from ${this.bin}: ${msg}`);
            }
        });

        this.childProcess.on(`exit`, (code, signal) => {
            this.status = ServiceStatus.STOPPED;
            this.childProcess?.stdout.removeAllListeners()
            this.childProcess?.stderr.removeAllListeners()
            this.childProcess?.removeAllListeners()
            Logger.warn(`Process ${this.bin} exited with code ${code} caused by ${signal}`);
            this.childProcess = undefined
        });

        Logger.info(`Spawned process for ${this.bin}`);
    }

    async available(): Promise<boolean> {
        try {
            await fs.promises.stat(this.bin);
            await fs.promises.access(this.bin, fs.constants.X_OK);
            return true;
        } catch (err) {
            throw new Error(`Service ${this.bin} not available: ${(err as Error).message}`);
        }
    }

    async stop(): Promise<void> {
        this.status = ServiceStatus.STOPPING;
        if (!this.childProcess) {
            Logger.warn(`Unable to kill instance of ${this.bin}, not running`);
            return
        }

        this.appendLog(LogLevel.INFO, "AltServer manager sending SIGKILL...")
        Logger.debug(`Sending SIGKILL to ${this.bin}...`);
        this.childProcess.kill()

        await once(this.childProcess, `exit`);
    }

    async restart() {
        Logger.debug(`Restarting instance of ${this.bin}`);
        await this.stop();
        await this.start();
    }
}