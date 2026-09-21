// Screenshot helper: launches headless Chrome, injects the session cookie,
// then captures each page. Dev-only tooling, not part of the app.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(os.tmpdir(), "shot");
const PORT = 9333;
const ORIGIN = "http://localhost:3100";

const cookie = fs.readFileSync(path.join(os.tmpdir(), "sc_cookie.txt"), "utf8").trim();
const examId = fs.readFileSync(path.join(os.tmpdir(), "sc_examid.txt"), "utf8").trim();

const pages = [
  ["dashboard", "/", 1440, 1500],
  ["dashboard-mobile", "/", 430, 1500],
  ["plan-mobile", `/exams/${examId}/plan`, 430, 1400],
  ["lookup-mobile", "/lookup", 430, 1200],
  ["exams", "/exams", 1440, 1100],
  ["exam", `/exams/${examId}`, 1440, 1500],
  ["plan", `/exams/${examId}/plan`, 1440, 1350],
  ["login", "/login", 1440, 1000]
];

const profile = path.join(os.tmpdir(), "chrome-cdp");
fs.rmSync(profile, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank"
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 40) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}
    await sleep(250);
  }
  throw new Error(`could not reach ${url}`);
}

async function main() {
  const version = await getJson(`http://127.0.0.1:${PORT}/json/version`);
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
  const sessionId = attached.sessionId;

  await send("Page.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);

  await send(
    "Network.setCookie",
    { name: "seatcraft_session", value: cookie, domain: "localhost", path: "/", httpOnly: true },
    sessionId
  );

  for (const [name, route, width, height] of pages) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
    await send("Page.navigate", { url: ORIGIN + route }, sessionId);
    await sleep(2600);

    const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);

    if (shot.result?.data) {
      fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(shot.result.data, "base64"));
      console.log(`saved ${name}.png`);
    } else {
      console.log(`FAILED ${name}: ${JSON.stringify(shot.error ?? shot)}`);
    }
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});

