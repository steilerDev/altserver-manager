import {EventEmitter} from 'events'

type Log = LogLine[]

export enum LogLevel {
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

export type LogLine = {
    logLevel: LogLevel,
    timestamp: Date,
    message: string[]
}

export enum LogServiceEvent {
    LOG_LINE = `log-line`
}

export abstract class Logging extends EventEmitter {
    log: Log = []

    abstract label: string

    appendLog(logLevel: LogLevel, _message: string) {
        this.log.unshift({
            timestamp: new Date(),
            logLevel,
            message: _message.split(/\r\n|\r|\n/).filter((line) => line.length > 0)
        })
        this.emit(LogServiceEvent.LOG_LINE)
    }

    getLogLines(logLevel: LogLevel, numberOfLines: number, offset: number = 0) {
        return this.log
            .filter((entry) => entry.logLevel <= logLevel)
            .slice(offset, offset + numberOfLines)
    }
}

export class AppLogger extends Logging {

    label = 'AltServer Manager'

    formatError(err?: Error) {
        return err 
            ? ` (caused by ${err.message})`
            : ``
    }
    error(msg: string, err?: Error) {
        this.appendLog(LogLevel.ERROR, msg + this.formatError(err))
    }

    warn(msg: string, err?: Error) {
        this.appendLog(LogLevel.WARN, msg + this.formatError(err))
    }
    info(msg: string, err?: Error) {
        this.appendLog(LogLevel.INFO, msg + this.formatError(err))
    }

    debug(msg: string, err?: Error) {
        this.appendLog(LogLevel.DEBUG, msg + this.formatError(err))
    }
};

export const Logger = new AppLogger()