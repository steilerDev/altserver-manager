# AltServer-Manager
Enabling easy AltServer management on a Raspberry Pi.

# Goal
Since running AltServer on a Desktop machine continuously is sometimes not feasible. This project has the goal to provide an easy way to install AltStore on your iOS devices from a Linux machine and providing Wifi Refresh capabilities from the same host.

Currently there is no '1-click' experience for AltServer on Linux (as it exists on Mac or Windows). This container application will contain all necessary dependencies and tries to replicate the same experience as on Mac or Windows, but in the CLI of a Raspberry Pi.

# Features
- [x] Docker dependencies
  - [x] [usbmuxd](https://github.com/libimobiledevice/usbmuxd)
  - [x] [AltServer](https://github.com/NyaMisty/AltServer-Linux)
  - [x] [AltStore](https://github.com/altstoreio/AltStore)
  - [x] avahi
  - [x] [go-ios](https://github.com/danielpaulus/go-ios)
  - [x] [netmuxd](https://github.com/jkcoxson/netmuxd)
  - [ ] [Anisette Server](https://github.com/Dadoum/Provision)
- [ ] Service Lifecycle Management
  - [x] AltStore-Manager
  - [x] usbmuxd
  - [ ] AltServer
  - [ ] avahi
- [ ] Device Management
  - [ ] Device Selection
  - [ ] Device Installation
- [ ] Wifi Refresh

# Setup

Make sure you have Docker installed and running. Execute the following command to start the AltStore-Manager container.

```bash
docker run --rm -it -v $(pwd)/data/adi:/data/adi -v $(pwd)/data/lockdown:/var/lib/lockdown -v /dev/bus/usb:/dev/bus/usb --network host --privileged steilerdev/sidestore-manager:latest execute:prod
```

- Make sure `avahi` and `usbmuxd` are not running on your host machine
- Press 'h' for help

# Resources

- [Setup Altserver Linux on Raspberry Pi with Wifi Refresh](https://gist.github.com/jschiefner/95a22d7f4803e7ad32a95b0f3aa655dc)
- [Ultimate guide to troubleshooting AltServer on Linux](https://gist.github.com/burritosoftware/37fa2d02eca6408684d0dccabca91b09])
- https://github.com/powenn/AltServer-Linux-PyScript