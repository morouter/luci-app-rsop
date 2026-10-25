"use strict";
"require dom";
"require fs";
"require poll";
"require ui";
"require view";

return view.extend({
  render: function () {
    var css =
      "#log_textarea{padding:10px;text-align:left}" +
      "#log_textarea pre{padding:.5rem;word-break:break-all;margin:0;" +
      "white-space:pre-wrap;max-height:70vh;overflow-y:auto;" +
      "background:#f4f4f4;border:1px solid #ccc}" +
      ':root[data-darkmode="true"] #log_textarea pre{' +
      "background:#1e1e1e;border-color:#444;color:#d4d4d4}" +
      "@media(prefers-color-scheme:dark){#log_textarea pre{" +
      "background:#1e1e1e;border-color:#444;color:#d4d4d4}}";
    var logArea = E("div", { id: "log_textarea" }, [
      E("img", {
        src: L.resource("icons/loading.svg"),
        alt: _("Loading..."),
        style: "vertical-align:middle",
      }),
      " " + _("Collecting data..."),
    ]);
    var lastLogContent = null;
    var lastTotal = 0;
    var lastInode = null;
    var lastSize = 0;
    var refreshing = false;
    var refreshInterval = 5;

    function callLogScript(action, start) {
      var args = [action];
      if (start != null) args.push(String(start));
      return fs.exec_direct("/usr/share/rsop/tail-log", args, "text");
    }

    function fetchTail(start) {
      if (start == null) start = lastTotal > 0 ? lastTotal + 1 : 0;
      return callLogScript("tail", start);
    }

    function renderLog(text) {
      var log = E("pre", { wrap: "pre" }, [text]);

      dom.content(logArea, log);
      requestAnimationFrame(function () {
        log.scrollTop = log.scrollHeight;
      });
    }

    function handleTail(res, start) {
      var nl = res.indexOf("\n");
      var metadata = nl >= 0 ? res.substring(0, nl).split(/\s+/) : [];
      var inode = metadata.length > 0 ? metadata[0] : null;
      var size = metadata.length > 1 ? parseInt(metadata[1], 10) : 0;
      var total = metadata.length > 2 ? parseInt(metadata[2], 10) : 0;
      var content = nl >= 0 ? res.substring(nl + 1).replace(/\n$/, "") : "";

      if (isNaN(size)) size = 0;
      if (isNaN(total)) total = 0;
      if (
        start > 0 &&
        (inode !== lastInode || size < lastSize || total < lastTotal)
      ) {
        lastTotal = 0;
        lastInode = null;
        lastSize = 0;
        lastLogContent = null;
        return fetchTail(0).then(function (newRes) {
          return handleTail(newRes, 0);
        });
      }

      var newLines = content === "" ? 0 : content.split("\n").length;
      lastInode = inode;
      lastSize = size;
      if (start > 0) {
        if (newLines === 0 && total === lastTotal) return;
        lastTotal += newLines;
      } else {
        lastTotal = total;
        lastLogContent = null;
      }

      var combined = (lastLogContent ? lastLogContent + "\n" : "") + content;
      var lines = combined.split("\n");
      if (lines.length > 1000) lines = lines.slice(-1000);
      lastLogContent = lines.join("\n");
      renderLog(lastLogContent || _("Log is empty."));
    }

    function handleLogError(err) {
      var error = err.toString();
      var content =
        error.includes("NotFoundError") ||
        error.includes("No such file") ||
        error.includes("not found")
          ? _("Log file does not exist.")
          : _("Unknown error: %s").format(err);

      if (content === lastLogContent) return;
      lastLogContent = content;
      lastTotal = 0;
      lastInode = null;
      lastSize = 0;
      renderLog(content);
    }

    function refreshLog() {
      if (refreshing) return Promise.resolve();
      refreshing = true;
      var start = lastTotal > 0 ? lastTotal + 1 : 0;

      return fetchTail(start)
        .then(function (res) {
          return handleTail(res, start);
        })
        .catch(handleLogError)
        .finally(function () {
          refreshing = false;
        });
    }

    function handleClearLog(ev) {
      var btn = ev.target;
      return ui.showModal(_("Clear log"), [
        E(
          "p",
          {},
          _("This will permanently erase the current log file. Continue?"),
        ),
        E("div", { class: "right" }, [
          E("button", { class: "btn", click: ui.hideModal }, _("Cancel")),
          " ",
          E(
            "button",
            {
              class: "btn cbi-button-negative",
              click: function () {
                btn.disabled = true;
                return callLogScript("clear")
                  .then(function () {
                    ui.hideModal();
                    lastLogContent = "";
                    lastTotal = 0;
                    lastInode = null;
                    lastSize = 0;
                    renderLog(_("Log is empty."));
                  })
                  .catch(function (err) {
                    ui.hideModal();
                    ui.addNotification(
                      null,
                      E("p", {}, _("Failed to clear log: %s").format(err)),
                      "error",
                    );
                  })
                  .finally(function () {
                    btn.disabled = false;
                  });
              },
            },
            _("Delete"),
          ),
        ]),
      ]);
    }

    function handleDownloadLog() {
      return callLogScript("export")
        .then(function (content) {
          var url = URL.createObjectURL(
            new Blob([content], { type: "text/plain" }),
          );
          var link = E("a", {
            href: url,
            download:
              "rustdesk-server-" +
              new Date().toISOString().replace(/[:.]/g, "-") +
              ".log",
            style: "display:none",
          });

          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        })
        .catch(function (err) {
          ui.addNotification(
            null,
            E("p", {}, _("Failed to export log: %s").format(err)),
            "error",
          );
        });
    }

    poll.add(L.bind(refreshLog, this), refreshInterval);

    return E([
      E("style", [css]),
      E("div", { class: "cbi-map" }, [
        E("h2", {}, _("RustDesk Server Logs")),
        E("div", { class: "cbi-section" }, [
          logArea,
          E(
            "div",
            {
              style:
                "display:flex;justify-content:space-between;align-items:center;margin-top:10px",
            },
            [
              E("div", {}, [
                E(
                  "button",
                  {
                    class: "btn cbi-button-negative",
                    click: ui.createHandlerFn(this, handleClearLog),
                  },
                  _("Clear log"),
                ),
                " ",
                E(
                  "button",
                  {
                    class: "btn cbi-button-action",
                    click: ui.createHandlerFn(this, refreshLog),
                  },
                  _("Refresh"),
                ),
                " ",
                E(
                  "button",
                  {
                    class: "btn cbi-button-action",
                    click: ui.createHandlerFn(this, handleDownloadLog),
                  },
                  _("Export log"),
                ),
              ]),
              E(
                "small",
                {},
                _("Refresh every %s seconds.").format(refreshInterval),
              ),
            ],
          ),
        ]),
      ]),
    ]);
  },

  handleSaveApply: null,
  handleSave: null,
  handleReset: null,
});
