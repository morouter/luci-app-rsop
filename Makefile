include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-rsop
PKG_VERSION:=0.6.7
PKG_RELEASE:=1
PKG_LICENSE:=AGPL-3.0

LUCI_TITLE:=Rustdesk Server for OpenWrt
LUCI_DEPENDS:= \
         +rsop \
         +rustdesk-server

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
