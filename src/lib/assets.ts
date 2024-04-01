import fs from 'fs';
import * as stream from 'stream';
import axios from 'axios';
import {promisify} from 'util';
import {Logger} from './log.js';
const finished = promisify(stream.finished);

export const GO_IOS_BIN = `/opt/ios`;
export const ALTSERVER_BIN = `/opt/AltServer`;
const ALTSTORE_IPA = `/opt/AltStore.ipa`;

export class Assets {
    static async assetExecutable(path: string): Promise<boolean> {
        await fs.promises.stat(path);
        await fs.promises.access(path, fs.constants.X_OK);
        return true;
    }

    static async assetAvailable(path: string): Promise<boolean> {
        try {
            await fs.promises.stat(path);
            return true;
        } catch {
            return false;
        }
    }

    static async downloadAsset(fileUrl: string, outputLocationPath: string): Promise<any> {
        const writer = fs.createWriteStream(outputLocationPath);
        return axios.get(fileUrl, {
            url: fileUrl,
            responseType: `stream`,
        }).then(response => {
            response.data.pipe(writer);
            return finished(writer); // This is a Promise
        });
    }

    static async altStoreIPA(): Promise<boolean> {
        Logger.debug(`Checking if AltStore is available at ${ALTSTORE_IPA}`);
        while (!await Assets.assetAvailable(ALTSTORE_IPA)) {
            Logger.warn(`AltStore IPA not found - downloading latest...`);
            const altStoreUrl = await axios.get(`https://cdn.altstore.io/file/altstore/apps.json`)
                .then(({data}) => (data.apps as any[])
                    .find(app => app.bundleIdentifier === `com.rileytestut.AltStore`)
                    .versions[0]
                    .download_url);

            if (!altStoreUrl) {
                throw new Error(`Unable to get URL to latest AltStore IPA`);
            }

            await Assets.downloadAsset(altStoreUrl, ALTSTORE_IPA);
            Logger.warn(`AltStore IPA downloaded`);
        }

        return true;
    }

    /**
     * Initializing all assets for the manager
     * @returns True
     */
    static async init() {
        Logger.info(`Initializing sidestore-manager assets...`);
        return (await Promise.all([
            Assets.altStoreIPA(),
        ])).every(Boolean);
    }
}