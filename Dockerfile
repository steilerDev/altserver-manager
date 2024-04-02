FROM node:20-bookworm-slim

# Extracting correct architecture for downloading pre-compiled binaries
ARG TARGETPLATFORM
ENV ARCH_FILE="/docker-arch"
RUN if [ -z ${TARGETPLATFORM##linux\/arm\/v*} ]; \
        then echo "armv7" > ${ARCH_FILE}; \
    elif [ -z ${TARGETPLATFORM##linux\/arm64} ]; \
        then echo "aarch64" > ${ARCH_FILE}; \
    else echo "Unsupported architecture ${TARGETPLATFORM}"; exit 1; fi

#########################################
# Intalling dependencies
#   - Avahi + libnss-mdns
#   - go-ios
ARG GO_IOS_VERSION="1.0.121"
ARG GO_IOS_BUILD_TOOLS="golang"
#   - netmuxd
ARG NETMUXD_VERSION="0.1.4"
#   - AltServer-Linux
ARG ALTSERVER_VERSION="0.0.5"
#   - anisette server
ARG ANISETTE_SERVER_VERSION="2.2.0"
ARG ANISETTE_BUILD_TOOLS="ldc git clang dub libz-dev libssl-dev"
#########################################

ARG BUILD_TOOLS="wget ${GO_IOS_BUILD_TOOLS} ${ANISETTE_BUILD_TOOLS}"

ARG DEPENDENCIES="usbmuxd ca-certificates avahi-daemon libnss-mdns libavahi-compat-libdnssd-dev curl"
RUN apt-get update && \
    apt-get install -y --no-install-recommends $BUILD_TOOLS $DEPENDENCIES

# Avahi setup
##################
RUN sed -i 's/.*enable-dbus=.*/enable-dbus=no/' /etc/avahi/avahi-daemon.conf

# go-ios build
##################
RUN mkdir -p /opt/go-ios && \
    wget -qO- "https://api.github.com/repos/danielpaulus/go-ios/tarball/v${GO_IOS_VERSION}" | tar xvz --strip-components=1 -C /opt/go-ios && \
    (cd /opt/go-ios && go build) && \
    mv /opt/go-ios/go-ios /opt/ios && chmod +x /opt/ios && rm -r /opt/go-ios

# anisette server build
##################
#RUN git clone https://github.com/Dadoum/anisette-v3-server.git /opt/ && \
#    (cd anisette-v3-server && DC=ldc2 dub build -c "static" --build-mode allAtOnce -b release --compiler=ldc2) && \
#    mv /opt/annisette-v3-server/anisette-v3-server /opt/anisette-server && chmod +x /opt/anisette-server && rm -r /opt/anisette-v3-server
RUN wget -qO /opt/anisette-server "https://github.com/Dadoum/Provision/releases/download/${ANISETTE_SERVER_VERSION}/anisette-server-$(cat ${ARCH_FILE})" && \
    chmod +x /opt/anisette-server

# netmuxd install
##################
RUN wget -qO /opt/netmuxd "https://github.com/jkcoxson/netmuxd/releases/download/v${NETMUXD_VERSION}/$(cat ${ARCH_FILE})-linux-netmuxd" && \
    chmod +x /opt/netmuxd

# AltServer-Linux install
##################
RUN wget -qO /opt/AltServer "https://github.com/NyaMisty/AltServer-Linux/releases/download/v${ALTSERVER_VERSION}/AltServer-$(cat ${ARCH_FILE})" && \
    chmod +x /opt/AltServer

RUN if [ "$BUILD_ENV" = "prod" ]; \
        then apt-get remove -y $BUILD_TOOLS && \
            apt-get autoremove -y && \
            apt-get clean -y && \
            rm -rf /var/lib/apt/lists/; fi

#########################################
# Intalling application
#########################################
RUN mkdir -p /app/src
WORKDIR /app
COPY ./package.json ./package-lock.json ./tsconfig.json ./eslint.config.json ./knip.config.jsonc /app/
RUN npm install

COPY ./src /app/src
RUN npm run build:typescript

# Start: /opt/anisette-server -p 6969 &
# Start: usbmuxd &
# Start: avahi-daemon &
# Start: /opt/netmuxd --disable-unix --host 127.0.0.1 &
# Start: USBMUXD_SOCKET_ADDRESS=127.0.0.1:27015 ALTSERVER_ANISETTE_SERVER=http://127.0.0.1:6969 /opt/AltServer &
# Select device, pair and install AltServer

ENTRYPOINT ["npm", "run", "--silent"]
CMD [ "execute" ]