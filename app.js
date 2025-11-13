const BACKEND_URL =
  window.BACKEND_URL || "https://unspecialized-nonprotractile-sommer.ngrok-free.dev";
const SESSION_STORAGE_KEY = "hop2topSessionToken";
const statusEl = document.getElementById("status");
const titleInput = document.getElementById("videoTitle");
const privacySelect = document.getElementById("privacySelect");
const ALLOWED_VISIBILITY = ["private", "friends", "mutual_followers", "public"];
let sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.style.color = type === "error" ? "#c01616" : "#111";
}

function saveSessionToken(token) {
  sessionToken = token;
  if (token) {
    localStorage.setItem(SESSION_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

function captureSessionFromUrl() {
  try {
    const url = new URL(window.location.href);
    const inboundToken = url.searchParams.get("sessionToken");
    if (inboundToken) {
      saveSessionToken(inboundToken);
      url.searchParams.delete("sessionToken");
      const newQuery = url.searchParams.toString();
      const nextUrl =
        url.pathname + (newQuery ? `?${newQuery}` : "") + (url.hash || "");
      window.history.replaceState({}, "", nextUrl);
    }
  } catch (err) {
    console.warn("Unable to parse session token from URL:", err);
  }
}

captureSessionFromUrl();

async function callBackend(endpoint, { method = "GET", body, headers = {} } = {}) {
  const options = {
    method,
    credentials: "include",
    headers: { ...headers },
  };
  if (sessionToken) {
    options.headers["X-Hop2Top-Session"] = sessionToken;
  }
  if (body !== undefined) {
    options.headers["Content-Type"] =
      options.headers["Content-Type"] || "application/json";
    options.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      saveSessionToken(null);
    }
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
    if (status.authenticated) {
      setStatus("Logged in with TikTok.");
    } else if (sessionToken) {
      saveSessionToken(null);
      setStatus("Session expired. Please log in again.", "error");
    } else {
      setStatus("Not logged in.");
    }
  } catch (err) {
    console.error(err);
    setStatus("Unable to reach backend.", "error");
  }
}

function requireSession() {
  if (!sessionToken) {
    setStatus("Please log in with TikTok first.", "error");
    throw new Error("Missing session token");
  }
}

document.getElementById("loginBtn").addEventListener("click", () => {
  saveSessionToken(null);
  window.location.assign(`${BACKEND_URL}/oauth/start`);
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  setStatus("Selecting a random video...");
  try {
    requireSession();
    const data = await callBackend("/generate", { method: "POST" });
    console.log("Video generated:", data);
    setStatus(
      `Selected video: ${data && data.filename ? data.filename : "unknown file"}`
    );
  } catch (err) {
    console.error(err);
    if (err.message === "Missing session token") {
      return;
    }
    setStatus(`Generation failed: ${err.message}`, "error");
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  setStatus("Uploading to TikTok...");
  try {
    requireSession();
    const title = titleInput.value.trim();
    if (!title) {
      setStatus("Please enter a video title before uploading.", "error");
      titleInput.focus();
      return;
    }

    let visibility = privacySelect.value;
    if (!ALLOWED_VISIBILITY.includes(visibility)) {
      visibility = "private";
    }

    const data = await callBackend("/upload", {
      method: "POST",
      body: {
        title,
        visibility,
      },
    });
    console.log("Upload result:", data);
    setStatus("Upload requested. Check TikTok for processing status.");
  } catch (err) {
    console.error(err);
    if (err.message === "Missing session token") {
      return;
    }
    setStatus(`Upload failed: ${err.message}`, "error");
  }
});

refreshAuthStatus();
