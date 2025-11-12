document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const generateBtn = document.getElementById("generate-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const statusEl = document.getElementById("status");

  console.log("main.js loaded");

  loginBtn.onclick = () => {
    console.log("Login with TikTok clicked");

    if (!window.TIKTOK_CLIENT_KEY || !window.TIKTOK_REDIRECT_URI) {
      alert("Lipsă TikTok client_key. Configurați-l în window.TIKTOK_CLIENT_KEY.");
      return;
    }

    const state = crypto.randomUUID();
    const scopes = window.TIKTOK_SCOPES || "user.info.basic";
    const url = new URL("https://www.tiktok.com/auth/authorize");
    url.searchParams.set("client_key", window.TIKTOK_CLIENT_KEY);
    url.searchParams.set("scope", scopes);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", window.TIKTOK_REDIRECT_URI);
    url.searchParams.set("state", state);

    window.location.href = url.toString();
  };

  generateBtn.onclick = () => {
    statusEl.textContent = "Generez video…";
    fetch(`${window.BACKEND_URL}/generate`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(r => r.json())
      .then(data => {
        statusEl.textContent = "Video generat.";
        console.log("generate:", data);
      })
      .catch(e => {
        statusEl.textContent = "Eroare la generare.";
        console.error(e);
      });
  };

  uploadBtn.onclick = () => {
    statusEl.textContent = "Urc pe TikTok…";
    fetch(`${window.BACKEND_URL}/upload`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.ok) {
          statusEl.textContent = "✅ Urcat cu succes.";
        } else {
          statusEl.textContent = "❌ Upload eșuat.";
          console.error(data);
        }
      })
      .catch(e => {
        statusEl.textContent = "❌ Eroare la upload.";
        console.error(e);
      });
  };
});
