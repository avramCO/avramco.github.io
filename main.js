// =============== Hop2Top TikTok Login ===============
// This file builds the OAuth URL, connects the button,
// and shows helpful logs & fallbacks for debugging.
// ====================================================

console.log("✅ main.js loaded");

// 🔧 Config values are read from window.TIKTOK_* defined in index.html
const CLIENT_KEY = window.TIKTOK_CLIENT_KEY;
const REDIRECT_URI = window.TIKTOK_REDIRECT_URI;
const SCOPES = window.TIKTOK_SCOPES || "user.info.basic,video.upload,video.publish";

const STATUS_EL_ID = "status";
const FALLBACK_ID = "oauth-fallback";
const BUTTON_ID = "login-btn";

// ----------------------------------------------------
// Helper: Build OAuth URL correctly
// ----------------------------------------------------
function buildTikTokAuthURL() {
  if (!CLIENT_KEY || !REDIRECT_URI) {
    const msg = "⚠️ Lipsă TikTok client_key sau redirect_uri. Configurați-le în window.TIKTOK_CLIENT_KEY / window.TIKTOK_REDIRECT_URI.";
    console.warn(msg);
    updateStatus(msg);
    throw new Error(msg);
  }

  const u = new URL("https://www.tiktok.com/auth/authorize");
  u.searchParams.set("client_key", CLIENT_KEY);
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", REDIRECT_URI);
  u.searchParams.set("state", crypto.randomUUID());

  return u.toString();
}

// ----------------------------------------------------
// Helper: Update status text (optional UI feedback)
// ----------------------------------------------------
function updateStatus(msg) {
  const el = document.getElementById(STATUS_EL_ID);
  if (el) el.textContent = msg;
  console.log(msg);
}

// ----------------------------------------------------
// Core: Perform TikTok OAuth redirect
// ----------------------------------------------------
function loginTikTok(e) {
  if (e) e.preventDefault();
  try {
    const authUrl = buildTikTokAuthURL();
    console.log("Redirecting to TikTok:", authUrl);
    updateStatus("Redirecting to TikTok...");
    // use full page redirect (popup blockers safe)
    window.location.href = authUrl;
  } catch (err) {
    console.error("Login error:", err);
  }
}

// ----------------------------------------------------
// Auto-setup on page load
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById(BUTTON_ID);
  const fallback = document.getElementById(FALLBACK_ID);

  // 1️⃣ Attach click handler
  if (btn) {
    btn.addEventListener("click", loginTikTok);
    console.log("✅ TikTok login button attached.");
  } else {
    console.warn("⚠️ No button with id='login-btn' found.");
  }

  // 2️⃣ Set up fallback link (works even if JS handler fails)
  try {
    const authUrl = buildTikTokAuthURL();
    if (fallback) {
      fallback.href = authUrl;
      fallback.style.display = "inline-block";
      console.log("✅ Fallback login link ready.");
    }
  } catch (err) {
    console.warn("Fallback not built:", err);
  }

  // 3️⃣ Optional: Show confirmation in status element
  updateStatus("Ready to connect TikTok 🔗");
});
