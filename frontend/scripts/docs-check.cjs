// Clicks the admit-card download and verifies a real zip arrives in the page.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9337;
const ORIGIN = "http://localhost:3100";

const cookie = fs.readFileSync(path.join(os.tmpdir(), "sc_cookie.txt"), "utf8").trim();
const examId = fs.readFileSync(path.join(os.tmpdir(), "sc_draftexam.txt"), "utf8").trim();

const profile = path.join(os.tmpdir(), "chrome-cdp-docs");
fs.rmSync(profile, { recursive: true, force: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank"
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  let version;
  for (let i = 0; i < 40; i += 1) {
    try {
      version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
      break;
    } catch {
      await sleep(250);
    }
  }

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve) => {
      id += 1;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const evaluate = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sid);
    return res.result?.result?.value;
  };

  const { result: target } = await send("Target.createTarget", { url: "about:blank" });
  const { result: attached } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sid = attached.sessionId;

  await send("Page.enable", {}, sid);
  await send("Network.enable", {}, sid);
  await send("Runtime.enable", {}, sid);
  await send(
    "Network.setCookie",
    { name: "seatcraft_session", value: cookie, domain: "localhost", path: "/", httpOnly: true },
    sid
  );
  await send("Page.setDownloadBehavior", { behavior: "deny" }, sid);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false }, sid);

  await send("Page.navigate", { url: `${ORIGIN}/exams/${examId}/plan` }, sid);
  await sleep(3200);

  // Intercept the generated blob so the test can inspect the zip header.
  const result = await evaluate(`(async () => {
    const origCreate = URL.createObjectURL;
    let captured = null;
    URL.createObjectURL = (blob) => {
      captured = blob;
      return origCreate.call(URL, blob);
    };

    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Admit cards');
    if (!btn) return { error: 'button not found' };
    if (btn.disabled) return { error: 'button disabled' };

    btn.click();

    for (let i = 0; i < 60; i += 1) {
      await new Promise(r => setTimeout(r, 250));
      if (captured) break;
    }

    URL.createObjectURL = origCreate;
    if (!captured) return { error: 'no blob produced' };

    const head = new Uint8Array(await captured.slice(0, 4).arrayBuffer());
    return { type: captured.type, size: captured.size, zipMagic: String.fromCharCode(...head) };
  })()`);

  console.log(JSON.stringify(result, null, 2));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
