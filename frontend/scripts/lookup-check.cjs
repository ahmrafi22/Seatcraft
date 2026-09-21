// Drives the real lookup form in headless Chrome and screenshots the result.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(os.tmpdir(), "shot");
const PORT = 9334;
const ORIGIN = "http://localhost:3100";

const profile = path.join(os.tmpdir(), "chrome-cdp-lookup");
fs.rmSync(profile, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

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

  const { result: target } = await send("Target.createTarget", { url: "about:blank" });
  const { result: attached } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sid = attached.sessionId;

  await send("Page.enable", {}, sid);
  await send("Runtime.enable", {}, sid);
  await send("Emulation.setDeviceMetricsOverride", { width: 900, height: 1150, deviceScaleFactor: 1, mobile: false }, sid);

  await send("Page.navigate", { url: `${ORIGIN}/lookup` }, sid);
  await sleep(2500);

  // Fill the form the way a candidate would, then submit it.
  await send(
    "Runtime.evaluate",
    {
      expression: `(() => {
        const set = (selector, value) => {
          const el = document.querySelector(selector);
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          setter.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        };
        set('#tenant', 'demo');
        set('#roll', 'R00001');
        set('#dateOfBirth', '2000-01-01');
        document.querySelector('form').requestSubmit();
        return 'submitted';
      })()`
    },
    sid
  );

  await sleep(3000);

  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sid);
  fs.writeFileSync(path.join(OUT, "lookup-result.png"), Buffer.from(shot.result.data, "base64"));

  const text = await send("Runtime.evaluate", { expression: "document.body.innerText", returnByValue: true }, sid);
  console.log(text.result.result.value.slice(0, 900));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
