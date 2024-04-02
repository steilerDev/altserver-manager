import {exec as execCb} from 'node:child_process';
import {promisify} from "node:util";
import {ALTSERVER_BIN, GO_IOS_BIN} from './assets.js';
const exec = promisify(execCb);

export const Shell = {
    GoIos: {
        async exec(...args: string[]) {
            return exec(`${GO_IOS_BIN} ${args.join(` `)}`)
                .then(({stdout}) => stdout);
        },
        async list() {
            const result = JSON.parse(await Shell.GoIos.exec(`list`));
            if (!result.deviceList || !Array.isArray(result.deviceList)) {
                throw new Error(`No devices in device list`);
            }

            return result.deviceList as UDIDList;
        },
        async info(udid: string) {
            return JSON.parse(await Shell.GoIos.exec(`info`, `--udid`, udid)) as DeviceInfo;
        },
        async readpair(udid: string) {
            return JSON.parse(await Shell.GoIos.exec(`readpair`, `--udid`, udid)) as PairRecord;
        },
        async getDevMode(udid: string) {
            const result = await Shell.GoIos.exec(`devmode`, `get`, `--udid`, udid);
            if (result === `Developer mode enabled: true`) {
                return true;
            }

            return false;
        },
    },
    AltServer: {
        async exec(dir: string, ...args: string[]) {
            return exec(`${ALTSERVER_BIN} ${args.join(` `)}`,
                {
                    env: {ALTSERVER_ANISETTE_SERVER: `bla`},
                    cwd: dir,
                })
                .then(({stdout}) => stdout);
        },
        async installIPA(device: any, file: string) {
            return Shell.AltServer.exec(device.confDir, `-u`, device.udid, `-a`, device.account!.username, `-p`, device.account!.password, file);
        },
    },
};

export type UDIDList = string[]

export type DeviceInfo = {
    DeviceName: string
    UniqueDeviceID: string
}

export type PairRecord = {
    HostID: string,
    SystemBUID: string,
    HostCertificate: string,
    HostPrivateKey: string,
    DeviceCertificate: string,
    EscrowBag: string,
    WiFiMACAddress: string,
    RootCertificate: string,
    RootPrivateKey: string
}