import React, { useEffect, useState } from 'react';
import {Text, Box, useFocus, Newline} from 'ink';
import { Select} from '@inkjs/ui';
import { AltServerServices } from '../cli.js';
import { Service, ServiceEvents} from '../lib/services.js';
import { Tab, Tabs } from 'ink-tab';
import USBMUXDService from './services/usbmuxd.js';
import { FOCUS_ID } from '../app.js';
import { BorderStyle, FocusColor, PrimaryColor, TabColors, serviceStatusToText} from './style.js';
import { Logger } from '../lib/log.js';

let lastSelectedService: keyof AltServerServices | undefined = undefined
let lastSelectedAction: 'restart' | 'stop' | 'start' | undefined = undefined

export default function ServiceControl(altStoreServices: AltServerServices) {
    const {isFocused} = useFocus({id: FOCUS_ID.SERVICE});

    const getServiceTab = (id: keyof AltServerServices, displayName: string, service?: Service) => {
        return <Tab name={id}><Text>{displayName} ({serviceStatusToText(service?.status)})</Text></Tab>
    }
    const getUsbmuxdTabContent = getServiceTab.bind({}, "usbmuxd", "USBMUXD", altStoreServices.usbmuxd)
    const [usbmuxdTab, setUsbmuxdTab] = useState<React.JSX.Element>(getUsbmuxdTabContent())

    const [serviceComponent, setServiceComponent] = useState<React.JSX.Element>()

    const updateSelectedService = (service: keyof AltServerServices) => {
        if(service === lastSelectedService) {
            Logger.debug(`Not updating service control, ${service} already selected`)
            return
        }
        lastSelectedService = (service as keyof AltServerServices)
        Logger.debug(`Updating service control to ${service}`)
        switch(service) {
            case "usbmuxd":
                setServiceComponent(<USBMUXDService service={altStoreServices[service]}></USBMUXDService>)
                return;
        }
    }

    const updateSelectedAction = async (action: 'restart' | 'stop' | 'start') => {
        if(action === lastSelectedAction) {
            Logger.debug(`Action ${action} already selected`)
            return
        }
        lastSelectedAction = action
        if(!lastSelectedService) {
            Logger.error(`Unable to perform action ${action}, no service selected`)
            return
        }
        await (altStoreServices[lastSelectedService] as Service)[lastSelectedAction]()
    }

    useEffect(() => {
        updateSelectedService("usbmuxd")
        altStoreServices.usbmuxd.on(ServiceEvents.STATUS_CHANGED, () => {
            setUsbmuxdTab(getUsbmuxdTabContent())
        })
    }, [])

	return (
		<Box flexGrow={1} flexDirection="column" borderStyle={BorderStyle} borderColor={isFocused ? FocusColor : PrimaryColor}>
            <Text bold={true} underline={true}>Services<Newline/></Text>
            <Tabs 
                flexDirection='row'
                keyMap={{useTab: true}}
                colors={TabColors}
                showIndex={false}
                isFocused={isFocused}
                defaultValue={lastSelectedService}
                onChange={newService => {
                    updateSelectedService(newService as keyof AltServerServices)
                }}>
                {usbmuxdTab}
                <Tab name='test'>Test</Tab>
            </Tabs>
            <Box flexDirection='row'>
                {
                    isFocused && 
                        <Box flexGrow={1} borderStyle="single" borderColor='yellow'>
                            <Select
                                options={[
                                    {
                                        label: 'Start',
                                        value: 'start',
                                    },
                                    {
                                        label: 'Stop',
                                        value: 'stop',
                                        },
                                    {
                                        label: 'Restart',
                                        value: 'restart',
                                    },
                                ]}
                                onChange={async newAction => {
                                    updateSelectedAction(newAction as 'start' | 'stop' | 'restart')
                                }}
                                isDisabled={!isFocused}
                            />
                        </Box>
                }
                {
                    isFocused &&
                        <Box flexGrow={2} borderStyle={BorderStyle}>
                            <Box flexDirection='column'>
                                <Text underline={true}>Service details</Text>
                                {serviceComponent}
                            </Box>
                        </Box>
                }
            </Box>
		</Box>
	);
}
