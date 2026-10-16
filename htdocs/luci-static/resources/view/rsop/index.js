"use strict";
"require form";
"require fs";
"require poll";
"require rpc";
"require ui";
"require view";

var callServiceList = rpc.declare({
  object: "service",
  method: "list",
  params: ["name"],
  expect: { "": {} },
});

async function updateStatus() {
  const res = await Promise.all([
    L.resolveDefault(callServiceList("rsop"), {}),
    L.resolveDefault(fs.stat("/usr/bin/go-rustdesk-server"), null),
    L.resolveDefault(fs.read("/etc/rustdesk/id_ed25519.pub"), null),
  ]);
  const instances = (res[0].rsop && res[0].rsop.instances) || {};
  const running = !!(instances.server && instances.server.running);
  const status = document.getElementById("service_status");
  const key = document.getElementById("widget.cbid.rsop.main.server_key");

  if (status) {
    const state = !res[1]
      ? _("binary is missing")
      : running
        ? _("is running")
        : _("is not running");
    const color = !res[1] ? "orange" : running ? "green" : "red";
    status.innerHTML =
      '<span style="color:%s"><strong>%s %s</strong></span>'.format(
        color,
        _("RustDesk Server"),
        state,
      );
  }
  if (key) key.value = res[2] ? res[2].trim() : "";
}

function copyServerKey() {
  const key = document.getElementById("widget.cbid.rsop.main.server_key");
  if (!key || !key.value) return;
  const notify = function (ok) {
    ui.addNotification(null, E("p", {}, ok ? _("Copied!") : _("Copy failed")));
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(key.value).then(
      function () {
        notify(true);
      },
      function () {
        notify(false);
      },
    );
    return;
  }
  key.focus();
  key.select();
  try {
    notify(document.execCommand("copy"));
  } catch (e) {
    notify(false);
  }
}

return view.extend({
  render: function () {
    var m, s, o;

    m = new form.Map(
      "rsop",
      _("RustDesk Server"),
      _("Rustdesk Server for OpenWrt with LuCI Support."),
    );

    s = m.section(form.TypedSection);
    s.anonymous = true;
    s.render = function () {
      poll.add(updateStatus);
      return E("div", { class: "cbi-section", id: "status_bar" }, [
        E("p", { id: "service_status" }, _("Collecting data...")),
      ]);
    };

    s = m.section(form.NamedSection, "main", "rsop");
    s.tab("general", _("General"));
    s.tab("ports", _("Ports"));
    s.tab("logging", _("Logging"));
    s.tab("advanced", _("Advanced"));

    o = s.taboption("general", form.Flag, "enabled", _("Enable Service"));
    o.rmempty = false;
    o.default = "1";

    o = s.taboption(
      "general",
      form.TextValue,
      "server_key",
      _("Connection Public Key"),
    );
    o.readonly = true;
    o.rows = 1;
    o.cols = 90;
    o.placeholder = _("No key yet. Start the service once to generate it.");
    o.cfgvalue = function () {
      return "";
    };
    o.write = function () {};
    o.remove = function () {};
    o.renderWidget = function () {
      var node = form.TextValue.prototype.renderWidget.apply(this, arguments);
      var textarea = node.querySelector("textarea");
      textarea.style.width = "100%";
      textarea.style.maxWidth = "600px";
      textarea.style.height = "4em";
      textarea.style.minHeight = "4em";
      textarea.style.resize = "none";
      textarea.style.boxSizing = "border-box";
      textarea.style.display = "block";
      node.appendChild(
        E(
          "button",
          {
            type: "button",
            class: "cbi-button cbi-button-action",
            style: "display:block;margin-top:6px",
            click: copyServerKey,
          },
          _("Copy"),
        ),
      );
      return node;
    };

    o = s.taboption(
      "general",
      form.Flag,
      "enforce_key",
      _("Verify Client Key"),
      _("Reject clients that do not provide the correct public key."),
    );
    o.default = "1";
    o.rmempty = false;

    o = s.taboption("general", form.Value, "listen", _("Listen Address"));
    o.datatype = "ipaddr";
    o.default = "::";
    o.rmempty = false;

    o = s.taboption(
      "general",
      form.Value,
      "relay_server",
      _("Public Relay Address"),
    );
    o.placeholder = _("Automatically detect when empty");

    [
      ["http_port", _("HTTP Compatibility Port"), "21114"],
      ["nat_port", _("NAT Test Port"), "21115"],
      ["id_port", _("ID and Rendezvous Port"), "21116"],
      ["relay_port", _("Relay Port"), "21117"],
      ["websocket_port", _("WebSocket Port"), "21118"],
      ["web_api_port", _("Web API Port"), "21119"],
    ].forEach(function (item) {
      o = s.taboption("ports", form.Value, item[0], item[1]);
      o.datatype = "port";
      o.default = item[2];
      o.rmempty = false;
    });

    o = s.taboption("logging", form.Value, "log_path", _("Log File"));
    o.default = "rdks.log";
    o.rmempty = false;

    o = s.taboption("logging", form.ListValue, "log_level", _("Log Level"));
    ["info", "warn", "error"].forEach(function (level) {
      o.value(level, level);
    });
    o.default = "info";

    o = s.taboption("logging", form.Flag, "log_color", _("Colored Logs"));
    o.default = "0";

    o = s.taboption(
      "logging",
      form.Value,
      "max_size",
      _("Maximum Log Size (bytes)"),
    );
    o.datatype = "and(uinteger,min(1024))";
    o.default = "10485760";
    o.rmempty = false;

    o = s.taboption(
      "logging",
      form.Value,
      "max_files",
      _("Retained Log Files"),
    );
    o.datatype = "range(1,100)";
    o.default = "4";
    o.rmempty = false;

    o = s.taboption(
      "advanced",
      form.Value,
      "max_connections",
      _("Maximum Connections"),
    );
    o.datatype = "and(uinteger,min(1))";
    o.default = "4096";
    o.rmempty = false;

    o = s.taboption(
      "advanced",
      form.Value,
      "max_frame_size",
      _("Maximum Frame Size (bytes)"),
    );
    o.datatype = "and(uinteger,min(1024))";
    o.default = "16777216";
    o.rmempty = false;

    return m.render();
  },
});
