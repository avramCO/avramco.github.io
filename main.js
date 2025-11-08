(() => {
  const statusEl = document.getElementById("status");
  const CLIENT_KEY = window.TIKTOK_CLIENT_KEY || "REPLACE_WITH_TIKTOK_CLIENT_KEY";
  const REDIRECT_URI =
    window.TIKTOK_REDIRECT_URI || `${window.location.origin.replace(/\/$/, "")}/`;

  const setStatus = (message) => {
    if (statusEl) {
      statusEl.innerText = message;
    }
  };

  const loginTikTok = () => {
    if (!CLIENT_KEY || CLIENT_KEY === "REPLACE_WITH_TIKTOK_CLIENT_KEY") {
      setStatus("⚠️ Lipsă TikTok client_key. Configurați-l în window.TIKTOK_CLIENT_KEY.");
      return;
    }
    const scope = encodeURIComponent("user.info.basic,video.upload,video.publish");
    const redirect = encodeURIComponent(`${REDIRECT_URI}oauth`);
    const state = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${CLIENT_KEY}&scope=${scope}&response_type=code&redirect_uri=${redirect}&state=${state}`;
    window.location.href = authUrl;
  };

  const callBackend = async (endpoint, body) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : null,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json().catch(() => ({}));
  };

  const generateVideo = async () => {
    setStatus("🎬 Generăm videoclipul quiz...");
    try {
      const result = await callBackend("/generate");
      setStatus(result.message || "✅ Videoclipul a fost generat!");
    } catch (error) {
      setStatus(`❌ Eroare la generare: ${error.message}`);
    }
  };

  const uploadVideo = async () => {
    setStatus("⬆️ Încărcăm videoclipul pe TikTok...");
    try {
      const result = await callBackend("/upload");
      setStatus(result.message || "✅ Video uploaded successfully!");
    } catch (error) {
      setStatus(`❌ Upload eșuat: ${error.message}`);
    }
  };

  const handleTikTokCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    setStatus("🔗 Finalizăm autentificarea TikTok...");
    try {
      const response = await fetch(`/callback?code=${encodeURIComponent(code)}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      setStatus("✅ TikTok login reușit!");
      params.delete("code");
      params.delete("state");
      const newUrl =
        window.location.pathname + (params.toString() ? `?${params.toString()}` : "");
      window.history.replaceState({}, document.title, newUrl);
    } catch (error) {
      setStatus(`❌ Autentificare eșuată: ${error.message}`);
    }
  };

  document.getElementById("login-btn")?.addEventListener("click", loginTikTok);
  document.getElementById("generate-btn")?.addEventListener("click", generateVideo);
  document.getElementById("upload-btn")?.addEventListener("click", uploadVideo);

  handleTikTokCallback();

  window.loginTikTok = loginTikTok;
  window.generateVideo = generateVideo;
  window.uploadVideo = uploadVideo;
})();
