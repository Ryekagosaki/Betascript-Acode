(function () {
  const PLUGIN_NAME = "betascript-acode";
  let editor = null;
  let worker = null;
  let runButton = null;
  let outputPanel = null;

  const CSS_ID = "betascript-plugin-style";
  const RUN_BUTTON_ID = "betascript-run-btn";
  const OUTPUT_PANEL_ID = "betascript-output-panel";
  const FILE_ICON_CLASS = "betascript-file-icon-badge";
  const BETA_ICON = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF6B35"/><stop offset="100%" style="stop-color:#F7931E"/></linearGradient></defs><rect width="120" height="120" x="4" y="4" rx="20" ry="20" fill="url(#bg)"/><text x="64" y="88" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">β</text><polygon points="100,15 103,25 113,25 105,31 108,41 100,35 92,41 95,31 87,25 97,25" fill="#FFD700"/></svg>`)}`;
  let fileIconObserver = null;

  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement("style");
    style.id = CSS_ID;
    style.textContent = `
      .${RUN_BUTTON_ID} {
        position: fixed;
        bottom: 72px;
        right: 16px;
        z-index: 99999;
        background: #ffd700;
        color: #000;
        border: 2px solid #000;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
        user-select: none;
      }
      .${RUN_BUTTON_ID}:hover {
        background: #ffe44d;
      }
      .${OUTPUT_PANEL_ID} {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 40%;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: monospace;
        font-size: 13px;
        overflow-y: auto;
        z-index: 99999;
        border-top: 2px solid #ffd700;
        display: none;
      }
      .${OUTPUT_PANEL_ID}__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 12px;
        background: #252526;
        border-bottom: 1px solid #333;
      }
      .${OUTPUT_PANEL_ID}__body {
        padding: 10px 12px;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .${OUTPUT_PANEL_ID}__error {
        color: #f48771;
      }
      .${OUTPUT_PANEL_ID}__success {
        color: #89d185;
      }
      .${FILE_ICON_CLASS} {
        width: 18px;
        height: 18px;
        min-width: 18px;
        display: inline-block;
        margin-right: 6px;
        vertical-align: -4px;
        background-image: url("${BETA_ICON}");
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }
    `;
    document.head.appendChild(style);
  }

  function elementLooksLikeBetaFile(element) {
    if (!element || element.nodeType !== 1) return false;
    if (element.closest(".ace_editor, textarea, [contenteditable='true'], ." + OUTPUT_PANEL_ID)) return false;

    const attrs = ["title", "data-path", "data-file", "data-name", "aria-label"];
    for (const attr of attrs) {
      const value = element.getAttribute && element.getAttribute(attr);
      if (value && /(^|[\\/\s])[^\\/\s]+\.beta($|\s)/i.test(value)) return true;
    }

    const text = (element.textContent || "").trim();
    return text.length > 0 && text.length < 120 && /(^|[\\/\s])[^\\/\s]+\.beta($|\s)/i.test(text);
  }

  function addBetaIcon(element) {
    if (element.dataset && element.dataset.betascriptIcon === "1") return;
    const target = element.querySelector?.(".file-name, .name, .title, span") || element;
    if (target.querySelector?.(`.${FILE_ICON_CLASS}`)) return;

    const icon = document.createElement("span");
    icon.className = FILE_ICON_CLASS;
    icon.setAttribute("aria-hidden", "true");
    target.insertBefore(icon, target.firstChild);

    if (element.dataset) element.dataset.betascriptIcon = "1";
  }

  function decorateBetaFileIcons(root = document) {
    const selector = [
      "[title$='.beta']",
      "[data-path$='.beta']",
      "[data-file$='.beta']",
      "[data-name$='.beta']",
      "[aria-label$='.beta']",
      "li",
      ".file",
      ".file-item",
      ".list-item",
      ".tree-item",
      ".item"
    ].join(",");

    const candidates = root.querySelectorAll ? root.querySelectorAll(selector) : [];
    candidates.forEach((element) => {
      if (elementLooksLikeBetaFile(element)) addBetaIcon(element);
    });
  }

  function startFileIconObserver() {
    decorateBetaFileIcons();
    if (fileIconObserver) return;

    fileIconObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (elementLooksLikeBetaFile(node)) addBetaIcon(node);
            decorateBetaFileIcons(node);
          }
        });
      }
    });

    fileIconObserver.observe(document.body, { childList: true, subtree: true });
  }

  function createRunButton() {
    if (runButton) return;
    runButton = document.createElement("button");
    runButton.className = RUN_BUTTON_ID;
    runButton.innerText = "▶ Run BetaScript";
    runButton.addEventListener("click", () => {
      const code = getActiveEditorCode();
      if (code !== null) {
        runCode(code);
      }
    });
    document.body.appendChild(runButton);
  }

  function createOutputPanel() {
    if (outputPanel) return;
    outputPanel = document.createElement("div");
    outputPanel.className = OUTPUT_PANEL_ID;
    outputPanel.innerHTML = `
      <div class="${OUTPUT_PANEL_ID}__header">
        <span>BetaScript Output</span>
        <span style="cursor:pointer" id="betascript-close-panel">✕</span>
      </div>
      <div class="${OUTPUT_PANEL_ID}__body"></div>
    `;
    document.body.appendChild(outputPanel);
    outputPanel.querySelector(`#betascript-close-panel`).addEventListener("click", () => {
      outputPanel.style.display = "none";
    });
  }

  function initWorker() {
    if (worker) return;
    try {
      worker = new Worker("src/worker.js");
      worker.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === "compiled") {
          writeOutput(`// Compiled JS:\n${payload.code}\n\nRunning...\n`, "success");
          try {
            const originalLog = console.log;
            const logs = [];
            console.log = (...args) => {
              logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
              originalLog.apply(console, args);
            };
            new Function(payload.code)();
            console.log = originalLog;
            if (logs.length > 0) {
              writeOutput(logs.join("\n"), "success");
            } else {
              writeOutput("(no output)", "success");
            }
          } catch (err) {
            writeOutput(`Runtime error: ${err.message}\n${err.stack || ""}`, "error");
          }
        } else if (type === "error") {
          writeOutput(`Compile error: ${payload.message}`, "error");
          if (payload.range) {
            highlightErrorRange(payload.range);
          }
        } else if (type === "panic") {
          writeOutput(`Worker panic: ${payload.message}`, "error");
        }
      };
    } catch (err) {
      writeOutput(`Failed to init worker: ${err.message}`, "error");
    }
  }

  function getActiveEditorCode() {
    if (typeof acode !== "undefined" && acode.action) {
      try {
        return acode.action("getActiveEditor").value;
      } catch (_) {
        // fallback below
      }
    }
    if (editor) return editor.getText();
    if (document.querySelector && document.querySelector("[contenteditable]")) {
      return document.querySelector("[contenteditable]").innerText;
    }
    return null;
  }

  function runCode(source) {
    if (!worker) initWorker();
    showOutputPanel();
    writeOutput("Compiling...", "success");
    worker.postMessage({ type: "compile", source });
  }

  function writeOutput(message, kind = "success") {
    if (!outputPanel) createOutputPanel();
    outputPanel.style.display = "block";
    const body = outputPanel.querySelector(`.${OUTPUT_PANEL_ID}__body`) || outputPanel.lastElementChild;
    const line = document.createElement("div");
    line.className = kind === "error" ? `${OUTPUT_PANEL_ID}__error` : `${OUTPUT_PANEL_ID}__success`;
    line.textContent = message;
    body.appendChild(line);
    outputPanel.scrollTop = outputPanel.scrollHeight;
  }

  function highlightErrorRange(range) {
    if (!editor || !editor.somethingSelected || !editor.discardToken) {
      return;
    }
    try {
      const line = range.start.line - 1;
      editor.setCursor({ line, ch: range.start.column || 0 });
      editor.setSelection({ line, ch: range.start.column || 0 }, { line, ch: range.end.column || 0 });
    } catch (_) {}
  }

  function showOutputPanel() {
    createOutputPanel();
    outputPanel.style.display = "block";
  }

  const plugin = {
    name: PLUGIN_NAME,
    background: false,
    init: function () {
      injectStyles();
      createRunButton();
      createOutputPanel();
      initWorker();
      startFileIconObserver();
    },
    onFileSelected: function () {
      runButton.style.display = "block";
      decorateBetaFileIcons();
    },
    onEditorChanged: function (e) {
      if (e && e.editor && e.editor.getText) {
        editor = e.editor;
      }
    },
    onClose: function () {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      if (runButton && runButton.parentNode) {
        runButton.parentNode.removeChild(runButton);
      }
      if (outputPanel && outputPanel.parentNode) {
        outputPanel.parentNode.removeChild(outputPanel);
      }
      if (fileIconObserver) {
        fileIconObserver.disconnect();
        fileIconObserver = null;
      }
      document.querySelectorAll(`.${FILE_ICON_CLASS}`).forEach((icon) => icon.remove());
      outputPanel = null;
      worker = null;
      runButton = null;
    }
  };

  if (typeof acode !== "undefined" && acode && typeof acode.ready === "function") {
    const ready = acode.ready();
    if (typeof ready === "function") ready(plugin);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      injectStyles();
      startFileIconObserver();
    });
  }
})();
