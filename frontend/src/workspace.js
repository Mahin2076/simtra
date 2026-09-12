// ─────────────────────────────────────────────────────────────────────────
// Memory workspace: scopes events, reactions, asks and answers per browser.
// No accounts. The id is created on first visit, kept in localStorage, sent on
// every backend request as `X-Simtra-Workspace`, and adopted from `?ws=<id>` so
// a workspace can be shared by link. `public` is the shared pre-workspace data.
// ─────────────────────────────────────────────────────────────────────────

export const WORKSPACE_HEADER = "X-Simtra-Workspace";
const KEY = "simtra.workspace";
const VALID = /^[A-Za-z0-9_-]{1,32}$/;

function freshId() {
  const uuid = (globalThis.crypto?.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/-/g, "");
  return uuid.slice(0, 12);
}

function read() {
  try { return localStorage.getItem(KEY) || ""; } catch { return ""; }
}
function write(id) {
  try { localStorage.setItem(KEY, id); } catch { /* private mode: session-only id */ }
}

function resolve() {
  const fromUrl = (new URLSearchParams(globalThis.location?.search ?? "").get("ws") || "").trim();
  if (VALID.test(fromUrl)) { write(fromUrl); return fromUrl; }
  const stored = read();
  if (VALID.test(stored)) return stored;
  const id = freshId();
  write(id);
  return id;
}

export const WORKSPACE = resolve();

/** Headers to attach to every backend request. The ngrok header skips the free-tier
 *  browser interstitial when the backend is tunnelled; other hosts ignore it. */
export function workspaceHeaders() {
  return { [WORKSPACE_HEADER]: WORKSPACE, "ngrok-skip-browser-warning": "1" };
}

/** A link that opens this workspace (keeps `backend=`/`port=` for local stacks). */
export function shareUrl() {
  const url = new URL(globalThis.location.href);
  const keep = new URLSearchParams();
  for (const k of ["backend", "port", "as_of", "model"]) {
    const v = url.searchParams.get(k);
    if (v) keep.set(k, v);
  }
  keep.set("ws", WORKSPACE);
  return `${url.origin}${url.pathname}?${keep.toString()}`;
}

/** Start a fresh, empty workspace and reload into it. */
export function startNewWorkspace() {
  const id = freshId();
  write(id);
  const url = new URL(globalThis.location.href);
  url.searchParams.delete("ws");
  globalThis.location.href = url.toString();
}
