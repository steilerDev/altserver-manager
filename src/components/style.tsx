import React from "react";
import { Text } from 'ink';
import { ServiceStatus } from "../lib/services.js"
import { LogLevel } from "../lib/log.js";

export const PrimaryColor = `white`
export const FocusColor = `#f80`
export const BorderStyle = `round`

export const TabColors = {
    activeTab: {
        color: FocusColor,
        backgroundColor: `black`
    }
};

export function serviceStatusToText(serviceStatus?: ServiceStatus) {
    switch(serviceStatus) {
    case ServiceStatus.FAULTED:
        return <Text color="black" backgroundColor='red'>Faulted</Text>
    case ServiceStatus.STOPPED:
        return <Text color="black" backgroundColor='red'>Stopped</Text>
    case ServiceStatus.NOT_STARTED:
        return <Text color="black" backgroundColor='yellow'>Not Started</Text>
    case ServiceStatus.STOPPING:
        return <Text color="black" backgroundColor='yellow'>Stopping</Text>
    case ServiceStatus.STARTING:
        return <Text color="black" backgroundColor='yellow'>Starting</Text>
    case ServiceStatus.RUNNING:
        return <Text color="white" backgroundColor='green'>Running</Text>
    default:
    case ServiceStatus.UNKNOWN:
        return <Text color="grey">Unknown</Text>
    }
}

export function logLevelToColor(_logLevel: LogLevel) {
    switch(_logLevel) {
    case LogLevel.DEBUG:
        return `gray`
    case LogLevel.INFO:
        return `white`
    case LogLevel.WARN:
        return `yellow`
    case LogLevel.ERROR:
        return `red`
    }
}

export function logLevelToString(_logLevel: LogLevel): `debug` | `info` | `warn` | `error` {
    switch(_logLevel) {
    case LogLevel.DEBUG:
        return `debug`
    case LogLevel.INFO:
        return `info` 
    case LogLevel.WARN:
        return `warn`
    case LogLevel.ERROR:
        return `error`
    }
}

export function textToLogLevel(logLevelString: `error` | `warn` | `info` | `debug`): LogLevel {
    switch(logLevelString) {
    case `error`:
        return LogLevel.ERROR
    case `warn`:
        return LogLevel.WARN
    case `info`:
        return LogLevel.INFO
    case `debug`:
        return LogLevel.DEBUG
    }
}