import React, { useEffect, useState } from 'react';
import {Box, Newline, Spacer, Text, useFocus, useInput} from 'ink';
import { Select} from '@inkjs/ui';
import { LogLevel, LogServiceEvent,  Logging } from '../lib/log.js';
import { AltServerServices } from '../cli.js';
import { Tab, Tabs } from 'ink-tab';
import { FOCUS_ID } from '../app.js';
import { BorderStyle, FocusColor, PrimaryColor, TabColors, logLevelToColor, logLevelToString, textToLogLevel} from './style.js';

let logLevel: LogLevel | undefined;
let offset: number = 0;
let service: keyof AltServerServices | undefined;

export default function Log(altStoreServices: AltServerServices) {
	const [logLines, setLogLines] = useState<React.JSX.Element[]>([]);
    const [logLevelVisible, setLogLevelVisible] = useState<boolean>(false);
    const [currentLogSource, setCurrentLogSource] = useState<string>('');
    const {isFocused} = useFocus({id: FOCUS_ID.LOG});

	useInput((input, key) => {
        if(isFocused) {
            if(key.upArrow) {
                refreshLogLines({_offset: offset++})
                return
            }
            if(key.downArrow && offset > 0) {
                refreshLogLines({_offset: offset++})
                return
            }
            if(key.ctrl && input === 'l') {
                setLogLevelVisible(true)
            }
        }
	});

    useEffect(() => {
        refreshLogLines({
            _service: "appLogger",
            _logLevel: LogLevel.DEBUG,
            _offset: 0
        })
    }, [])

    // if current selection is undefined, only refresh log content, non of the other settings
    const refreshLogLines = ((currentSelection?: {_service?: keyof AltServerServices, _logLevel?: LogLevel, _offset?: number}) => {
        if(currentSelection) {
            let refreshNeeded = false
            if(currentSelection._service !== undefined && currentSelection._service !== service) {
                refreshNeeded = true
                if(service && altStoreServices[service]) {
                    altStoreServices[service].removeAllListeners(LogServiceEvent.LOG_LINE)
                }
                altStoreServices[currentSelection._service].on(LogServiceEvent.LOG_LINE, refreshLogLines)
                service = currentSelection._service
            }

            if(currentSelection._logLevel !== undefined && currentSelection._logLevel !== logLevel) {
                refreshNeeded = true
                logLevel = currentSelection?._logLevel
            }

            if(currentSelection._offset !== undefined && currentSelection._offset !== offset) {
                refreshNeeded = true
                offset = currentSelection?._offset
            }
            
            if(!refreshNeeded) {
                return
            }
        }

        if(!service) {
            return
        }

        setCurrentLogSource((altStoreServices[service]).label)

        setLogLines(
            (altStoreServices[service] as Logging)
                .getLogLines(logLevel ?? LogLevel.DEBUG, 10, offset)
                .toReversed() // reverse the log lines to show the latest logs on the bottom
                .map((line, lineIndex) => {
                    const createLogLine = (msg: string, logLineIndex: string) => {
                        return <Text key={logLineIndex} wrap='truncate' color={logLevelToColor(line.logLevel)}>
                            {msg}
                        </Text>
                    }

                    // Split multiline log messages
                    return line.message.map((value, msgIndex) => {
                        return msgIndex === 0
                            ? createLogLine(`[${line.timestamp.toISOString()}] [${logLevelToString(line.logLevel).toUpperCase()}]: ${value}`, `${lineIndex}-${msgIndex}`)
                            : createLogLine(`... ${value}`, `${lineIndex}-${msgIndex}`)
                    })
                }).flat()
        )
    })

	return (
		<Box height={15} flexDirection="column" borderStyle={BorderStyle} borderColor={isFocused ? FocusColor : PrimaryColor}>
            <Text bold={true} underline={true}>Log - {currentLogSource}<Newline/></Text>
            <Box flexDirection='row'>
                {
                    logLevelVisible && 
                    <Box borderStyle={BorderStyle} 
                        borderBottom={false} 
                        borderTop={false}
                        borderLeft={false}
                        flexDirection="column" 
                        flexGrow={1} 
                        width={9}>
                        <Text>Set log level:</Text><Newline/>
                        <Select
                            isDisabled={!logLevelVisible || !isFocused}
                            onChange={_newValue => {
                                refreshLogLines({_logLevel: textToLogLevel(_newValue as 'error' | 'warn' | 'info' | 'debug')})
                            }}
                            defaultValue={"debug"}
                            options={
                                [{
                                    label: "Debug",
                                    value: "debug"
                                },{
                                    label: "Info",
                                    value: "info"
                                },{
                                    label: "Warn",
                                    value: "warn"
                                },{
                                    label: "Error",
                                    value: "error",
                                }]
                            }
                        />
                        <Spacer/>
                    </Box>
                }
                <Box flexDirection="column" flexGrow={8}>
                    {
                        isFocused &&
                            <Box alignItems='center' height={1}>
                                <Tabs 
                                    colors={TabColors}
                                    showIndex={false}
                                    keyMap={{useTab: true}}
                                    isFocused={isFocused}
                                    onChange={_newValue => {
                                        refreshLogLines({_service: _newValue as keyof AltServerServices})
                                    }}
                                    defaultValue='appLogger'>
                                        <Tab name="appLogger">AltServer Manager</Tab>
                                        <Tab name="usbmuxd">USBMUXD</Tab>
                                </Tabs>
                            </Box>
                    }
                    <Spacer/>
                    <Box minHeight={10} flexDirection="column">
                        {logLines}
                    </Box>
                </Box>
            </Box>
		</Box>
	);
}
