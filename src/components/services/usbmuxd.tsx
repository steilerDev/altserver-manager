import React, { useEffect, useState } from 'react';
import {Box, Newline, Text} from 'ink';
import { UnorderedList } from '@inkjs/ui';
import { Logger } from '../../lib/log.js';
import { USBMUXD, USBMUXDEvents } from '../../lib/services/usbmuxd-service.js';

type Props = {
	readonly service: USBMUXD;
};

export default function USBMUXDService({service}: Props) {
    const [deviceList, setDeviceList] = useState<React.JSX.Element[]>([])

    useEffect(() => {
        service.on(USBMUXDEvents.DEVICE_LIST_CHANGED, () => {
            Logger.info(`Device list changed`)
            setDeviceList(service.devices.map((device) => (
                <UnorderedList.Item key={device.id}>
                    <Text>ID: {device.id}: {device.serial && `${device.serial}`}{device.address && `@${device.address}`}</Text>
                </UnorderedList.Item>
            )
            ))
        })
    }, [])

    return (
        <Box flexGrow={1} flexDirection="column" minHeight={2}>
            <Box flexDirection='column'>
                <Newline/>
                {deviceList.length === 0 ? <Text>No devices connected...</Text> : <Text>Connected devices:</Text>}
                {deviceList.length > 0 &&
                <UnorderedList>
                    {deviceList}
                </UnorderedList>}
            </Box>
            <Newline/>
        </Box>
    );
}