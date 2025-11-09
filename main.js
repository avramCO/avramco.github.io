console.log("✅ main.js loaded");

const CLIENT_KEY   = window.TIKTOK_CLIENT_KEY;
const REDIRECT_URI = window.TIKTOK_REDIRECT_URI;
const SCOPES       = window.TIKTOK_SCOPES || "user.info.basic";
const BACKEND_URL  = window.BACKEND_URL;

function statusBox(msg){
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
  console.log(msg);
}

function buildAuthURL(){
  if(!CLIENT_KEY || !REDIRECT_URI) throw new Error("Missing client_key/redirect_uri");
  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", CLIENT_KEY);
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("state", crypto.randomUUID());
  return u.toString();
}

function loginTikTok(e){
  e && e.preventDefault();
  const url = buildAuthURL();
  statusBox("Redirecționare către TikTok…");
  location.href = url;
}

async function callGenerate(){
  if(!BACKEND_URL) return statusBox("Config BACKEND_URL lipsă.");
  statusBox("Generez video…");
  const r = await fetch(`${BACKEND_URL}/generate`, {method:"POST"});
  const j = await r.json();
  statusBox(j.ok ? `✅ Video pregătit: ${j.file}` : "❌ Nu s-a găsit fișierul.");
}

async function callUpload(){
  if(!BACKEND_URL) return statusBox("Config BACKEND_URL lipsă.");
  statusBox("Urc pe TikTok…");
  const r = await fetch(`${BACKEND_URL}/upload`, {method:"POST"});
  const j = await r.json();
  statusBox(j.ok ? "✅ Upload/Publish reușit!" : `❌ Eroare: ${JSON.stringify(j).slice(0,200)}…`);
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("login-btn")?.addEventListener("click", loginTikTok);
  document.getElementById("generate-btn")?.addEventListener("click", callGenerate);
  document.getElementById("upload-btn")?.addEventListener("click", callUpload);
  statusBox("Ready to connect TikTok 🔗");
});
