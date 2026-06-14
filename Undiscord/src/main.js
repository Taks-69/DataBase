const { Client } = require("discord.js-selfbot-v13");
const process = require("process");

// ── Args ─────────────────────────────────────────────────────────
const token           = process.argv[2];
const channelId       = process.argv[3];
const afterMessageId  = process.argv[4] || "";
const beforeMessageId = process.argv[5] || "";
const afterDateStr    = process.argv[6] || "";
const beforeDateStr   = process.argv[7] || "";
const useMsgFilter    = (process.argv[8] || "false").toString().toLowerCase() === "true";
const useDateFilter   = (process.argv[9] || "false").toString().toLowerCase() === "true";

// ── Utils ─────────────────────────────────────────────────────────
function send(obj) {
  try { process.stdout.write(JSON.stringify(obj) + "\n"); } catch {}
}

function parseDate(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [, Y, M, D, h, min, sec] = m.map(Number);
  const dt = new Date(Y, M - 1, D, h, min, sec);
  return isNaN(dt.getTime()) ? null : dt;
}

const afterDate  = parseDate(afterDateStr);
const beforeDate = parseDate(beforeDateStr);

function msgPassesFilters(msg) {
  if (useMsgFilter) {
    if (afterMessageId  && BigInt(msg.id) <= BigInt(afterMessageId))  return false;
    if (beforeMessageId && BigInt(msg.id) >= BigInt(beforeMessageId)) return false;
  }
  if (useDateFilter) {
    const ts = msg.createdTimestamp || (msg.createdAt ? msg.createdAt.getTime() : 0);
    if (afterDate  && ts < +afterDate)  return false;
    if (beforeDate && ts > +beforeDate) return false;
  }
  return true;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Client ───────────────────────────────────────────────────────
if (!token || !channelId) {
  send({ ok: false, event: "error", error: "Missing token or channelId" });
  process.exit(1);
}

const client = new Client();

client.once("ready", async () => {
  send({ ok: true, event: "ready", user: client.user ? client.user.tag : null });
  await cleanOnce();
  await sleep(500);
  try { await client.destroy(); } catch {}
  process.exit(0);
});

client.on("error", (err) => {
  send({ ok: false, event: "error", error: String(err && err.message ? err.message : err) });
});

// ── Cleaner (one-shot) ──────────────────────────────────────────
async function cleanOnce() {
  try {
    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch || typeof ch.messages?.fetch !== "function") {
      send({ ok: false, event: "clean", error: "invalid channel or no access" });
      return;
    }

    let beforeId = beforeMessageId || null;
    let total = 0;

    while (true) {
      const batch = await ch.messages.fetch({ limit: 100, ...(beforeId ? { before: beforeId } : {}) });
      if (batch.size === 0) break;

      for (const [, m] of batch) {
        if (m.author?.id !== client.user?.id) continue;
        if (!msgPassesFilters(m)) continue;
        try {
          await m.delete();
          total++;
          send({ ok: true, event: "deleted", id: m.id, count: total });
          await sleep(500);
        } catch (e) {
          send({ ok: false, event: "delete_error", id: m.id, error: String(e?.message || e) });
        }
      }

      const last = batch.last();
      beforeId = last ? last.id : null;
      if (batch.size < 100) break;
    }

    send({ ok: true, event: "clean_done", deleted: total });
  } catch (e) {
    send({ ok: false, event: "clean_exception", error: String(e?.message || e) });
  }
}

client.login(token).catch(err => {
  send({ ok: false, event: "login_error", error: String(err?.message || err) });
  process.exit(1);
});