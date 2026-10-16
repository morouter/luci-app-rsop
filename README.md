# LuCI-APP-Rustdesk for Openwrt

Rustdesk Server for OpenWrt with LuCI Support.

## 🚀 Features

- Built-in [go-rustdesk-server](https://github.com/moaeiou/go-rustdesk-server).
- One backend process provides the ID, rendezvous, relay, NAT-test, WebSocket and HTTP compatibility services.
- Server settings are managed through LuCI/UCI; the runtime TOML file is generated automatically.
- It can run smoothly with just a few lines of commands.
- It can be set as a daemon process and start automatically on boot.

## ⬇️ Downloads

[GitHub Release](https://github.com/morouter/luci-app-rsop/releases)

## 🛠 How to build

[Install, Compile and init-SDK Generic Guide](https://867678.xyz/docs/openwrt)

And some extra commands:

```bash
# Make sure you are at the root directory of this project.
mkdir -p root/usr/bin
cd root/usr/bin
wget -O go-rustdesk-server https://github.com/moaeiou/go-rustdesk-server/releases/latest/download/go-rustdesk-server-linux-musl-YourCPUArch
chmod +x go-rustdesk-server
cd ../../..
# For the next step: See generic guide
```

## ⚖️ License

This project has been licensed under the [GNU Affero General Public License Version 3 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html).

This project includes [go-rustdesk-server](https://github.com/moaeiou/go-rustdesk-server).

And [the log page](https://github.com/Internet1235/luci-app-openlist/blob/main/luci-app-openlist/htdocs/luci-static/resources/view/openlist/log.js) licensed under the MIT, So in this project I change it to `AGPL-v3`.
