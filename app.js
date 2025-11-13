const BACKEND_URL =
  window.BACKEND_URL || "https://unspecialized-nonprotractile-sommer.ngrok-free.dev";
const statusEl = document.getElementById("status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.style.color = type === "error" ? "#c01616" : "#111";
}

async function callBackend(endpoint, { method = "GET", body, headers = {} } = {}) {
  const options = {
    method,
    credentials: "include",
    headers: { ...headers },
  };
  if (body !== undefined) {
    options.headers["Content-Type"] =
      options.headers["Content-Type"] || "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function refreshAuthStatus() {
  try {
    const status = await callBackend("/auth/status");
    setStatus(status.authenticated ? "Logged in with TikTok." : "Not logged in.");
  } catch (err) {
    console.error(err);
    setStatus("Unable to reach backend.", "error");
  }
}

document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.assign(`${BACKEND_URL}/oauth/start`);
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  setStatus("Generating video...");
  try {
    const data = await callBackend("/generate", { method: "POST" });
    console.log("Video generated:", data);
    setStatus(`Video generated (${data.filename || "generated.mp4"}).`);
  } catch (err) {
    console.error(err);
    setStatus(`Generation failed: ${err.message}`, "error");
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  setStatus("Uploading to TikTok...");
  try {
    const data = await callBackend("/upload", {
      method: "POST",
      body: { path: "generated.mp4" },
    });
    console.log("Upload result:", data);
    setStatus("Upload requested. Check TikTok for processing status.");
  } catch (err) {
    console.error(err);
    setStatus(`Upload failed: ${err.message}`, "error");
  }
});

refreshAuthStatus();
