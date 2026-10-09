# SPDX-License-Identifier: AGPL-3.0-only
#
# Always-200-OK fake RustDesk API server for luci-app-rsop.
# Source lives in the parent repository root (main.go, go.mod).

include $(TOPDIR)/rules.mk

PKG_NAME:=rsop
PKG_VERSION:=0.6.5
PKG_RELEASE:=1
PKG_LICENSE:=AGPL-3.0

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=rsop

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/rsop
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Fake RustDesk API server (always 200 OK)
  URL:=https://github.com/morouter/luci-app-rsop
  DEPENDS:=$(GO_ARCH_DEPENDS)
endef

define Package/rsop/description
  A minimal HTTP server that always answers 200 OK on TCP port 21114,
  used as a fake RustDesk API endpoint by luci-app-rsop.
endef

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
	$(CP) ../main.go ../go.mod $(PKG_BUILD_DIR)/
endef

define Package/rsop/install
	$(call GoPackage/Package/Install/Bin,$(PKG_INSTALL_DIR))
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/rsop $(1)/usr/bin/
endef

$(eval $(call GoBinPackage,rsop))
$(eval $(call BuildPackage,rsop))
