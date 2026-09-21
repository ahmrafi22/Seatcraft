// Clicks "Publish plan" on a draft plan and confirms the status flips.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9336;
const ORIGIN = "http://localhost:3100";

const cookie = fs.readFileSync(path.join(os.tmpdir(), "sc_cookie.txt"), "utf8").trim();
const examId = fs.readFileSync(path.join(os.tmpdir(), "sc_draftexam.txt"), "utf8").trim();

const profile = path.join(os.tmpdir(), "chrome-cdp-publish");
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
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false }, sid);

  await send("Page.navigate", { url: `${ORIGIN}/exams/${examId}/plan` }, sid);
  await sleep(3200);

  console.log("before:", await evaluate(`document.body.innerText.match(/Draft|Published|Allocated/)?.[0]`));

  console.log(
    "click:",
    await evaluate(`(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Publish plan');
      if (!btn) return 'button not found';
      if (btn.disabled) return 'button disabled';
      btn.click();
      return 'clicked';
    })()`)
  );

  await sleep(4500);

  console.log("after:", await evaluate(`(() => {
    const text = document.body.innerText;
    return {
      status: (text.match(/read-only, published|editable/) || [])[0],
      notice: (text.match(/(Plan published[^\\n]*|Could not[^\\n]*)/) || [])[0] || 'none',
      docsUnlocked: !/Publish the plan to unlock documents/.test(text)
    };
  })()`));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
