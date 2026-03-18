import "./style.css";
import { invoke } from "@tauri-apps/api/core";

const state = {
  verbose: false,
  lastOutput: "",
  lastReportName: "",
  isRunning: false,
};

function setStatus(text) {
  const el = document.querySelector("#statusText");
  if (el) el.textContent = text;
}

function setBusy(isBusy) {
  state.isRunning = isBusy;

  const buttons = document.querySelectorAll("button[data-action]");
  buttons.forEach((b) => {
    b.disabled = isBusy;
  });

  const exportBtn = document.querySelector("#exportBtn");
  if (exportBtn) {
    exportBtn.disabled = isBusy || !state.lastOutput;
  }

  setStatus(isBusy ? "Running..." : "Done");
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function buildSummary(text) {
  const lines = (text || "").split("\n");

  const listenCount = lines.filter((l) => /LISTEN/i.test(l)).length;
  const javaMention = lines.some((l) => /java/i.test(l));
  const mcPortMention = lines.some((l) => /:25565\b/.test(l));

  const ips = [];
  for (const l of lines) {
    const m = l.match(/\b(\d{1,3}\.){3}\d{1,3}\b/g);
    if (m) ips.push(...m);
  }

  const freq = new Map();
  for (const ip of ips) {
    freq.set(ip, (freq.get(ip) || 0) + 1);
  }

  const topIps = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    listenCount,
    javaMention,
    mcPortMention,
    topIps,
  };
}

function renderSummary() {
  const el = document.querySelector("#summary");
  if (!el) return;

  const s = buildSummary(state.lastOutput);

  const top = s.topIps.length
    ? s.topIps.map(([ip, n]) => `<li><span>${ip}</span><span>${n}</span></li>`).join("")
    : `<li class="muted">No IPs parsed (yet)</li>`;

  el.innerHTML = `
    <div class="cardMini">
      <div class="miniTitle">LISTEN lines</div>
      <div class="miniValue">${s.listenCount}</div>
    </div>
    <div class="cardMini">
      <div class="miniTitle">Java seen</div>
      <div class="miniValue">${s.javaMention ? "Yes" : "No"}</div>
    </div>
    <div class="cardMini">
      <div class="miniTitle">Port 25565 seen</div>
      <div class="miniValue">${s.mcPortMention ? "Yes" : "No"}</div>
    </div>
    <div class="cardMini wide">
      <div class="miniTitle">Top remote IPs (sample)</div>
      <ul class="miniList">${top}</ul>
    </div>
  `;
}

function setOutput(text) {
  state.lastOutput = text;
  const out = document.querySelector("#output");
  if (out) {
    out.value = text;
    out.scrollTop = out.scrollHeight;
  }
  renderSummary();
}

function appendOutput(line) {
  setOutput((state.lastOutput ? state.lastOutput + "\n" : "") + line);
}

async function runCheck(checkId, label) {
  setBusy(true);

  const stamp = nowStamp();
  const v = state.verbose ? "ON" : "OFF";

  setOutput(
    [
      "Minecraft Hypixel Security — Local Checks",
      "----------------------------------------",
      `Run: ${label}`,
      `Verbose: ${v}`,
      `Timestamp: ${stamp}`,
      "",
      "[+] Executing via Tauri backend (allowlist enforced)...",
      "",
    ].join("\n")
  );

  try {
    const res = await invoke("run_check", { checkId, verbose: state.verbose });

    appendOutput(`[+] Result: ${res.ok ? "OK" : "WARN"} | exit_code=${res.exit_code ?? "null"}`);

    if (res.stdout && res.stdout.trim()) {
      appendOutput("");
      appendOutput("----- STDOUT -----");
      appendOutput(res.stdout.trimEnd());
    }

    if (res.stderr && res.stderr.trim()) {
      appendOutput("");
      appendOutput("----- STDERR -----");
      appendOutput(res.stderr.trimEnd());
    }

    state.lastReportName = `report_${checkId}_${stamp}.txt`;

    try {
      const savedPath = await invoke("save_report", {
        filename: state.lastReportName,
        content: state.lastOutput,
      });
      appendOutput("");
      appendOutput(`[+] Saved report to: ${savedPath}`);
    } catch (e) {
      appendOutput("");
      appendOutput("[!] Auto-save failed (download export still works).");
      appendOutput(String(e));
    }
  } catch (e) {
    appendOutput("");
    appendOutput("[!] Failed to run check.");
    appendOutput(String(e));
  } finally {
    setBusy(false);
  }
}

function exportReport() {
  const stamp = nowStamp();
  const filename = state.lastReportName || `report_${stamp}.txt`;
  const blob = new Blob([state.lastOutput || ""], {
    type: "text/plain;charset=utf-8",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  document.body.removeChild(a);

  appendOutput("");
  appendOutput(`[+] Exported report (downloaded): ${filename}`);
}

document.querySelector("#app").innerHTML = `
  <div class="shell">
    <header class="top">
      <div>
        <h1>Minecraft Hypixel Security</h1>
        <p class="subtitle">Local-only defensive checks (Linux + Windows)</p>
      </div>

      <div class="right">
        <label class="toggle">
          <input id="verboseToggle" type="checkbox" />
          <span>Verbose</span>
        </label>
        <div class="status">
          <span class="dot"></span>
          <span id="statusText">Ready</span>
        </div>
      </div>
    </header>

    <main class="grid">
      <section class="card">
        <h2>Checks</h2>
        <p class="hint">
          Local-only checks executed via a strict backend allowlist.
        </p>

        <div class="btnGrid">
          <button data-action="linux_system">Linux: System Check</button>
          <button data-action="linux_mods">Linux: Mod Awareness</button>
          <button data-action="linux_network">Linux: Network Awareness</button>
          <button data-action="linux_lunar">Linux: Lunar/Hypixel Baseline</button>
          <button data-action="windows_network">Windows: Network Awareness</button>
        </div>

        <div class="meta">
          <div class="metaRow">
            <span class="k">Scope</span>
            <span class="v">Local observation only. No interception. No data collection.</span>
          </div>
          <div class="metaRow">
            <span class="k">Safety</span>
            <span class="v">Allowlist execution only. No arbitrary commands.</span>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="outHead">
          <h2>Output</h2>
          <button id="exportBtn" class="secondary">Export report</button>
        </div>

        <div id="summary" class="summary"></div>

        <textarea
          id="output"
          spellcheck="false"
          readonly
          placeholder="Output will appear here..."
        ></textarea>

        <p class="footnote">
          Reports are auto-saved locally and ignored by Git.
        </p>
      </section>
    </main>
  </div>
`;

document.querySelector("#verboseToggle").addEventListener("change", (e) => {
  state.verbose = !!e.target.checked;
});

document.querySelectorAll("button[data-action]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const action = btn.getAttribute("data-action");

    const map = {
      linux_system: { id: "linux_system", label: "Linux System Check" },
      linux_mods: { id: "linux_mods", label: "Linux Mod Awareness" },
      linux_network: { id: "linux_network", label: "Linux Network Awareness" },
      linux_lunar: { id: "linux_lunar", label: "Linux Lunar/Hypixel Baseline" },
      windows_network: { id: "windows_network", label: "Windows Network Awareness" },
    };

    const item = map[action];
    await runCheck(item?.id || action, item?.label || action);
  });
});

document.querySelector("#exportBtn").addEventListener("click", exportReport);

setBusy(false);
setStatus("Ready");
