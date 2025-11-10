console.log("✅ main.js loaded");

const CLIENT_KEY   = window.TIKTOK_CLIENT_KEY;
const REDIRECT_URI = window.TIKTOK_REDIRECT_URI;
const SCOPES       = window.TIKTOK_SCOPES || "user.info.basic";
const BACKEND_URL  = window.BACKEND_URL;

function setStatus(msg){
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
  console.log(msg);
}

// (optional) PKCE helpers — not strictly required, but recommended later
async function sha256ToB64url(input) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function randVerifier(len=64){
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
  let out = "";
  const rnd = crypto.getRandomValues(new Uint8Array(len));
  for (let i=0;i<len;i++) out += chars[rnd[i] % chars.length];
  return out;
}

async function buildAuthURL(){
  if(!CLIENT_KEY || !REDIRECT_URI) throw new Error("Missing client_key/redirect_uri");

  // You can enable PKCE later by uncommenting
  // const verifier = randVerifier(64);
  // localStorage.setItem("tiktok_pkce_verifier", verifier);
  // const challenge = await sha256ToB64url(verifier);

  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", CLIENT_KEY);
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("state", crypto.randomUUID());
  // u.searchParams.set("code_challenge", challenge);
  // u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

async function loginTikTok(e){
  e && e.preventDefault();
  const url = await buildAuthURL();
  setStatus("Redirecționare către TikTok…");
  location.href = url;
}

async function callGenerate(){
  if(!BACKEND_URL) return setStatus("Config BACKEND_URL lipsă.");
  setStatus("Generez video…");
  const r = await fetch(`${BACKEND_URL}/generate`, {
    method:"POST",
    headers:{ "ngrok-skip-browser-warning": "true" }
  });
  const j = await r.json();
  setStatus(j.ok ? `✅ Video pregătit: ${j.file}` : "❌ Nu s-a găsit fișierul.");
}

async function callUpload(){
  if(!BACKEND_URL) return setStatus("Config BACKEND_URL lipsă.");
  setStatus("Urc pe TikTok…");
  const r = await fetch(`${BACKEND_URL}/upload`, {
    method:"POST",
    headers:{ "ngrok-skip-browser-warning": "true" }
  });
  const j = await r.json();
  setStatus(j.ok ? "✅ Upload/Publish reușit!" : `❌ Eroare: ${JSON.stringify(j).slice(0,200)}…`);
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("login-btn")?.addEventListener("click", loginTikTok);
  document.getElementById("generate-btn")?.addEventListener("click", callGenerate);
  document.getElementById("upload-btn")?.addEventListener("click", callUpload);
  setStatus("Ready to connect TikTok 🔗");
});
