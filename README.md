# LuCI-APP-Rustdesk for Openwrt

Rustdesk Server for OpenWrt with LuCI Support.

## 🚀 Features

- Built-in latest version of Rustdesk-Server and A Fake API server.
- It can run smoothly with just a few lines of commands.
- It can be set as a daemon process and start automatically on boot.

## ⬇️ Downloads

[GitHub Release](https://github.com/morouter/luci-app-rsop/releases)
[Always OK Server](https://github.com/morouter/luci-app-rsop/releases/tag/Always-200OK-Server)

## 🛠 How to build

[Install, Compile and init-SDK Generic Guide](https://867678.xyz/docs/openwrt)

And some extra commands:

```bash
# Make sure you at root directory of this project
rm root/usr/bin/DONOTREMOVE
wget -O rsop https://github.com/morouter/luci-app-rsop/releases/download/Always-200OK-Server/rsop-YourCPUArch
cd ../../../
# See generic guide
```

## ⚖️ License

This project has been licensed under the [GNU Affero General Public License Version 3 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html).

This project has included the [RustDesk-Server](https://github.com/rustdesk/rustdesk-server).

And [the log page](https://github.com/Internet1235/luci-app-openlist/blob/main/luci-app-openlist/htdocs/luci-static/resources/view/openlist/log.js) licensed under the MIT, So in this project I change it to `AGPL-v3`.
