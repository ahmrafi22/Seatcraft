// End-to-end check of the planner: drag-swap two seats and drag-move one to an
// empty seat, then confirm the DOM reflects the new arrangement.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.join(os.tmpdir(), "shot");
const PORT = 9335;
const ORIGIN = "http://localhost:3100";

const cookie = fs.readFileSync(path.join(os.tmpdir(), "sc_cookie.txt"), "utf8").trim();
const examId = fs.readFileSync(path.join(os.tmpdir(), "sc_draftexam.txt"), "utf8").trim();

const profile = path.join(os.tmpdir(), "chrome-cdp-plan");
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

  const before = await evaluate(`(() => {
    const seats = [...document.querySelectorAll('button[draggable="true"]')];
    return seats.slice(0, 4).map(s => ({ roll: s.title.split(' ')[0], label: (s.title.match(/Seat (\\S+)/) || [])[1] }));
  })()`);
  console.log("before:", JSON.stringify(before));

  // Swap seat 0 <-> seat 1 through the real React drag handlers.
  // The handlers keep the dragged seat in state, so the events need separate ticks.
  const swapResult = await evaluate(`(async () => {
    const tick = () => new Promise(r => setTimeout(r, 120));
    const seats = [...document.querySelectorAll('button[draggable="true"]')];
    const dt = new DataTransfer();
    seats[0].dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    await tick();
    seats[1].dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await tick();
    seats[1].dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await tick();
    seats[0].dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    return 'dispatched';
  })()`);
  console.log("swap:", swapResult);
  await sleep(3500);

  const afterSwap = await evaluate(`(() => {
    const seats = [...document.querySelectorAll('button[draggable="true"]')];
    const text = document.body.innerText;
    const notice = (text.match(/(Swapped [^\\n]+|Could not [^\\n]+)/) || [])[0] || 'no notice';
    const byRoll = {};
    for (const roll of ${JSON.stringify(["__A__", "__B__"])}.map(r => r)) {
      const seat = seats.find(s => s.title.startsWith(roll + ' '));
      byRoll[roll] = seat ? (seat.title.match(/Seat (\\S+)/) || [])[1] : 'not on this hall';
    }
    return { notice, byRoll };
  })()`.replace("__A__", before[0].roll).replace("__B__", before[1].roll));
  console.log("after swap:", JSON.stringify(afterSwap));

  const notice = await evaluate(`(() => {
    const el = document.querySelector('[role="status"], .glass-pane');
    const text = document.body.innerText;
    const m = text.match(/(Swapped [^\\n]+|Moved [^\\n]+|Could not [^\\n]+)/);
    return m ? m[0] : 'no notice';
  })()`);
  console.log("notice:", notice);

  // Drag a seat onto an empty cell: that must call /move, not /swap.
  const moveResult = await evaluate(`(async () => {
    const tick = () => new Promise(r => setTimeout(r, 120));
    const seats = [...document.querySelectorAll('button[draggable="true"]')];
    const grid = seats[0].parentElement;
    const empties = [...grid.children].filter(el => el.tagName === 'DIV' && !el.className.includes('repeating'));
    if (!empties.length) return { ok: false, reason: 'no empty seat on this hall' };
    const target = empties[empties.length - 1];
    const roll = seats[0].title.split(' ')[0];
    const dt = new DataTransfer();
    seats[0].dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    await tick();
    target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await tick();
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await tick();
    seats[0].dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
    return { ok: true, roll };
  })()`);
  console.log("move:", JSON.stringify(moveResult));
  await sleep(3500);

  const afterMove = await evaluate(`(() => {
    const roll = ${JSON.stringify("__ROLL__")};
    const seats = [...document.querySelectorAll('button[draggable="true"]')];
    const moved = seats.find(s => s.title.startsWith(roll + ' '));
    const text = document.body.innerText;
    const notice = (text.match(/(Moved [^\\n]+|Could not [^\\n]+)/) || [])[0] || 'no notice';
    return { notice, seat: moved ? (moved.title.match(/Seat (\\S+)/) || [])[1] : 'not on this hall' };
  })()`.replace("__ROLL__", moveResult.roll));
  console.log("move result:", JSON.stringify(afterMove));

  const shot = await send("Page.captureScreenshot", { format: "png" }, sid);
  fs.writeFileSync(path.join(OUT, "plan-draft.png"), Buffer.from(shot.result.data, "base64"));

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  chrome.kill();
  process.exit(1);
});
