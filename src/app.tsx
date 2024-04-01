import React, { useEffect, useState } from 'react';
import {Box, Key, Spacer, Text, useFocusManager, useInput} from 'ink';
import BigText from 'ink-big-text';
import { Alert, UnorderedList } from '@inkjs/ui';
import Log from './components/log.js';
import { AltServerServices } from './cli.js';
import ServiceControl from './components/service-control.js';
import { BorderStyle, FocusColor, PrimaryColor } from './components/style.js';

export const FOCUS_ID = {
	ACTION_MENU: "ACTION_MENU",
	LOG: "LOG",
	SERVICE: "SERVICE"
}

export default function App({services}: {services: AltServerServices}) {
	const [getLastKey, setLastKey] = useState<Key>()
	const [getLastInput, setLastInput] = useState<string>()

	const {disableFocus, focus} = useFocusManager();

	useEffect(() => {
		disableFocus();
	}, []);

	useInput((input, key) => {
		setLastKey(key)
		setLastInput(input)
		if(input === 'l') {
			focus(FOCUS_ID.LOG)
		}
		if(input === 's') {
			focus(FOCUS_ID.SERVICE)
		}
		//console.log(`Detected ${input} and ${JSON.stringify(key)}`)
	});

	return (
		<Box flexDirection='column' borderStyle={BorderStyle} borderColor={PrimaryColor}>
			<BigText text='AltServer manager' align='center' font='shade' colors={[FocusColor, PrimaryColor]}/>
			<Box alignItems='center'>
				<Spacer/>
				<Text color={PrimaryColor}>made with &lt;3 by steilerDev</Text> 
				<Spacer/>
			</Box>

			{
				getLastKey?.escape &&
				<Alert variant="info">
					To detach the application, use CTRL-p CTRL-q.
					To get help, press 'h'
				</Alert>
			}
			{
				getLastInput === "h" &&
				<Box flexDirection='column' borderStyle={BorderStyle} borderColor={FocusColor}>
					<BigText text='Help' font='chrome' colors={[PrimaryColor, PrimaryColor]}/>
					<UnorderedList>
						<UnorderedList.Item>
							<Text>To exit the application, while keeping the container and its services unning, enter the control sequence 'CTRL-p CTRL-q'</Text>
						</UnorderedList.Item>
						<UnorderedList.Item>
							<Text>To terminate AltServer-Manager and all serices, hit CTRL-C</Text>
						</UnorderedList.Item>
						<UnorderedList.Item>
							<Text>To access details on the running services, press the 's' key</Text>
						</UnorderedList.Item>
						<UnorderedList.Item>
							<Text>To inspect logs, press the 'l' key</Text>
							<UnorderedList>
								<UnorderedList.Item>
									<Text>Press 'ctrl-l' to change the log level</Text>
								</UnorderedList.Item>
							</UnorderedList>
						</UnorderedList.Item>
					</UnorderedList>
				</Box>
			}
			<Box>
				<ServiceControl usbmuxd={services.usbmuxd} appLogger={services.appLogger}/>
			</Box>
			<Log usbmuxd={services.usbmuxd} appLogger={services.appLogger}/>
		</Box>
	);
}
