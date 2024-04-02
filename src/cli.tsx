#!/usr/bin/env node
import React, { StrictMode } from 'react';
import {render } from 'ink';
//import meow from 'meow';
import App from './app.js';
import { AppLogger, Logger } from './lib/log.js';
import { USBMUXD } from './lib/services/usbmuxd-service.js';

// const cli = meow(
// 	`
// 	Usage
// 	  $ my-ink-cli

// 	Options
// 		--name  Your name

// 	Examples
// 	  $ my-ink-cli --name=Jane
// 	  Hello, Jane
// `,
// 	{
// 		importMeta: import.meta,
// 		flags: {
// 			name: {
// 				type: 'string',
// 			},
// 		},
// 	},
// );
export type AltServerServices = {
    usbmuxd: USBMUXD,
    appLogger: AppLogger
}

const services: AltServerServices = {
    appLogger: Logger,
    usbmuxd: new USBMUXD(),
}

const shutdown = async () => {
    console.log(`Shutting down AltServer-Manager...`)
    await services.usbmuxd.stop()
    console.log(`All services shutdown - goodbye!`)
    process.exit(1)
}

process.on(`SIGTERM`, shutdown)
process.on(`SIGINT`, shutdown)

render(<StrictMode><App services={services}/></StrictMode>);

await services.usbmuxd.start()