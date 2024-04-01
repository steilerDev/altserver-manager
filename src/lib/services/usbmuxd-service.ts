import {SpawnOptionsWithoutStdio} from 'node:child_process';
import { Logger} from '../log.js';
import { Service, ServiceStatus } from '../services.js';

export type USBMUXDDevice = {
    id?: string,
    address?: string,
    serial?: string
}

export enum USBMUXDEvents {
    DEVICE_LIST_CHANGED = `devices`
}

export class USBMUXD extends Service {
    bin = `/usr/sbin/usbmuxd`;
    args = [`-f`];
    opts: SpawnOptionsWithoutStdio = {};

    label = 'usbmuxd'

    devices: USBMUXDDevice [] = [];
    clearDevices(): void {
        this.devices = []
        this.emit(USBMUXDEvents.DEVICE_LIST_CHANGED)
    }

    onMessage(_msg: string): boolean {
        return false;
    }

    onError(msg: string): boolean {
        let match = false;
        if (msg.match(/usbmuxd v([0-9]+\.?)* starting up/)) {
            this.status = ServiceStatus.STARTING;
            this.clearDevices()
            match = true;
        }

        if (msg.match(/Using libusb ([0-9]+\.?)*/)) {
            match = true;
        }

        if (msg.match(/Initialization complete/)) {
            this.status = ServiceStatus.RUNNING;
            match = true;
        }

        if (msg.match(/Caught signal .*, exiting/)) {
            this.status = ServiceStatus.STOPPING;
            match = true;
        }

        if (msg.match(/Shutdown complete/)) {
            this.status = ServiceStatus.STOPPED;
            this.clearDevices()
            match = true;
        }

        const claimingInterfaceError = msg.match(/Could not claim interface ([0-9]+) for device ([0-9-]+): LIBUSB_ERROR_BUSY/);
        if (claimingInterfaceError) {
            const [_msg, interfaceId, device] = claimingInterfaceError
            this.status = ServiceStatus.FAULTED;
            Logger.warn(`USBMUXD could not claim interface ${interfaceId} for device ${device}, make sure no other instance of usbmuxd is running and consider rebooting the machine`)
            match = true;
        }

        const connectingDevice = msg.match(/Connecting to new device on location (0x[0-9]+) as ID ([0-9]+)/);
        if (connectingDevice) {
            const [_, address, id] = connectingDevice

            if(this.devices.find((device) => device.id === id)) {
                throw new Error(`Already registered device id!`)
            }
            this.devices.push({
                id, address
            })
            this.emit(USBMUXDEvents.DEVICE_LIST_CHANGED)
            match = true;
        }

        const connectedDevice = msg.match(/Connected to v([0-9]+\.?)* device ([0-9]+) on location (0x[0-9]+) with serial number (([A-Z][0-9]-)+)/);
        if (connectedDevice) {
            const [_, __, id, address, serial] = connectedDevice
            console.log(JSON.stringify(connectedDevice))
            const newDeviceIndex = this.devices.indexOf(this.devices.find((device) => device.id === id) ?? {})

            if(newDeviceIndex === -1) {
                this.devices.push({
                    address,
                    id,
                    serial
                })
            } else {
                this.devices[newDeviceIndex]!.address = address
                this.devices[newDeviceIndex]!.id = id
                this.devices[newDeviceIndex]!.serial = serial
            }

            this.emit(USBMUXDEvents.DEVICE_LIST_CHANGED)
            match = true;
        }

        const removedDevice = msg.match(/Removed device ([0-9]+) on location (0x[0-9]+)/);
        if (removedDevice) {
            const [_, id, _location] = removedDevice
            const removedDeviceIndex = this.devices.indexOf(this.devices.find((device) => device.id === id) ?? {})
            this.devices.splice(removedDeviceIndex, 1)

            this.emit(USBMUXDEvents.DEVICE_LIST_CHANGED)
            match = true;
        }

        return match;
    }
}