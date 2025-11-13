const BACKEND_URL =
  window.BACKEND_URL || "https://unspecialized-nonprotractile-sommer.ngrok-free.dev";
const SESSION_STORAGE_KEY = "hop2topSessionToken";
const statusEl = document.getElementById("status");
const titleInput = document.getElementById("videoTitle");
const creatorSection = document.getElementById("creatorSection");
const creatorNicknameEl = document.getElementById("creatorNickname");
const creatorAccountMetaEl = document.getElementById("creatorAccountMeta");
const privacyOptionList = document.getElementById("privacyOptionList");
const privacyDisclaimer = document.getElementById("privacyDisclaimer");
const allowCommentsBox = document.getElementById("allowComments");
const allowDuetBox = document.getElementById("allowDuet");
const allowStitchBox = document.getElementById("allowStitch");
const refreshCreatorInfoBtn = document.getElementById("refreshCreatorInfo");
const musicConsentCheckbox = document.getElementById("musicConsent");
const postingNoticeEl = document.getElementById("postingNotice");
const FORCED_VISIBILITY = "private";
const uploadBtn = document.getElementById("uploadBtn");
const previewSection = document.getElementById("previewSection");
const previewDetails = document.getElementById("previewDetails");
const refreshPreviewBtn = document.getElementById("refreshPreview");
const commercialToggle = document.getElementById("commercialToggle");
const commercialOptions = document.getElementById("commercialOptions");
const commercialSelf = document.getElementById("commercialSelf");
const commercialBrand = document.getElementById("commercialBrand");
const commercialAlert = document.getElementById("commercialAlert");
const consentText = document.getElementById("consentText");
let sessionToken = localStorage.getItem(SESSION_STORAGE_KEY);
let creatorInfo = null;
let selectedPrivacy = null;

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.style.color = type === "error" ? "#c01616" : "#111";
}

function setUploadAvailability(enabled, notice = "") {
  uploadBtn.disabled = !enabled;
  if (postingNoticeEl) {
    postingNoticeEl.textContent = notice || "";
  }
}

function applyInteractionControl(checkbox, serverValue) {
  if (!checkbox) {
    return;
  }
  checkbox.checked = false;
  checkbox.disabled = false;
  if (checkbox.parentElement) {
    checkbox.parentElement.classList.remove("disabled");
  }
  const unavailable =
    serverValue === false ||
    (typeof serverValue === "object" &&
      (serverValue.available === false || serverValue.disabled === true));
  if (unavailable) {
    checkbox.disabled = true;
    if (checkbox.parentElement) {
      checkbox.parentElement.classList.add("disabled");
    }
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function renderPrivacyOptions(options) {
  privacyOptionList.innerHTML = "";
  selectedPrivacy = null;
  const disclaimer = [];
  if (options && options.length) {
    disclaimer.push("Select one of the options TikTok allows for your account.");
  }
  if (!options.includes("private")) {
    options = [...options, "private"];
  }
  privacyDisclaimer.textContent =
    disclaimer.join(" ") ||
    "TikTok currently restricts this integration to private uploads.";
  options.forEach((option) => {
    const li = document.createElement("li");
    const label = document.createElement("label");
    label.className = "privacy-option";
    if (option !== FORCED_VISIBILITY) {
      label.classList.add("disabled");
    }
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "privacyChoice";
    input.value = option;
    input.disabled = option !== FORCED_VISIBILITY;
    input.addEventListener("change", () => {
      selectedPrivacy = option;
    });
    label.appendChild(input);
    const text = document.createElement("span");
    text.textContent = option === "private" ? "Private (Only me)" : option;
    label.appendChild(text);
    li.appendChild(label);
    privacyOptionList.appendChild(li);
  });
}

function updateConsentText() {
  let message = "By posting, you agree to TikTok's Music Usage Confirmation.";
  if (commercialToggle.checked && commercialBrand.checked) {
    message =
      "By posting, you agree to TikTok's Branded Content Policy and Music Usage Confirmation.";
  } else if (commercialToggle.checked && commercialSelf.checked) {
    message =
      "By posting, you agree to TikTok's Music Usage Confirmation.";
  }
  consentText.textContent = message;
}

function updateCommercialUI() {
  const enabled = commercialToggle.checked;
  commercialOptions.hidden = !enabled;
  commercialAlert.textContent = "";
  if (!enabled) {
    commercialSelf.checked = false;
    commercialBrand.checked = false;
  }
  updateConsentText();
}

function validateCommercialSelection() {
  if (!commercialToggle.checked) {
    return true;
  }
  const anySelected = commercialSelf.checked || commercialBrand.checked;
  if (!anySelected) {
    commercialAlert.textContent =
      "Select whether you're promoting yourself, another brand, or both.";
    return false;
  }
  commercialAlert.textContent = "";
  return true;
}

async function loadPreview(force = false) {
  if (!sessionToken) {
    return;
  }
  try {
    const data = await callBackend(`/preview${force ? "?force=1" : ""}`);
    if (data && data.filename) {
      previewSection.hidden = false;
      previewDetails.innerHTML = `
        <strong>${data.filename}</strong><br>
        Size: ${formatBytes(data.size)}<br>
        Last modified: ${new Date(data.modified * 1000).toLocaleString()}
      `;
    }
  } catch (err) {
    console.warn("Preview unavailable:", err);
  }
}

function renderCreatorInfo(response) {
  if (!response) {
    return;
  }
  creatorSection.hidden = false;
  const nickname =
    response.nickname || (response.creator_info && response.creator_info.nickname) || "TikTok user";
  creatorNicknameEl.textContent = nickname;
  const accountBits = [];
  if (response.open_id) {
    accountBits.push(`Open ID: ${response.open_id}`);
  }
  if (response.max_video_post_duration_sec) {
    accountBits.push(
      `Max duration: ${response.max_video_post_duration_sec}s`
    );
  }
  creatorAccountMetaEl.textContent = accountBits.join(" · ");

  const privacyOptions =
    (response.privacy_options && response.privacy_options.length
      ? response.privacy_options
      : [FORCED_VISIBILITY]);
  privacyOptionList.innerHTML = "";
  renderPrivacyOptions(privacyOptions);

  const interactions = response.interaction_settings || {};
  applyInteractionControl(allowCommentsBox, interactions.comments);
  applyInteractionControl(allowDuetBox, interactions.duet);
  applyInteractionControl(allowStitchBox, interactions.stitch);

  const canPost = response.can_post !== false;
  if (!canPost) {
    setUploadAvailability(
      false,
      "TikTok reports you have reached your posting or privacy limits. Please try again later."
    );
  } else {
    setUploadAvailability(
      true,
      "Uploads are currently limited to 'Private' visibility until TikTok approves this integration."
    );
  }
}

async function loadCreatorInfo({ force = false, silent = false } = {}) {
  if (!sessionToken) {
    return;
  }
  try {
    const info = await callBackend(`/creator/info${force ? "?force=1" : ""}`);
    creatorInfo = info;
    renderCreatorInfo(info);
  } catch (err) {
    console.error(err);
    if (!silent) {
      setStatus(`Unable to load TikTok account info: ${err.message}`, "error");
    }
  }
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
setUploadAvailability(
  Boolean(sessionToken),
  sessionToken
    ? "Uploads are currently limited to 'Private' visibility."
    : "Log in with TikTok to enable uploads."
);

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
      loadCreatorInfo({ silent: true });
    } else if (sessionToken) {
      saveSessionToken(null);
      setStatus("Session expired. Please log in again.", "error");
      creatorSection.hidden = true;
      creatorInfo = null;
      setUploadAvailability(false, "Log in with TikTok to enable uploads.");
    } else {
      setStatus("Not logged in.");
      creatorSection.hidden = true;
      setUploadAvailability(false, "Log in with TikTok to enable uploads.");
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

if (refreshCreatorInfoBtn) {
  refreshCreatorInfoBtn.addEventListener("click", () =>
    loadCreatorInfo({ force: true })
  );
}

if (refreshPreviewBtn) {
  refreshPreviewBtn.addEventListener("click", () => loadPreview(true));
}

if (commercialToggle) {
  commercialToggle.addEventListener("change", updateCommercialUI);
}
if (commercialSelf) {
  commercialSelf.addEventListener("change", updateConsentText);
}
if (commercialBrand) {
  commercialBrand.addEventListener("change", updateConsentText);
}

document.getElementById("generateBtn").addEventListener("click", async () => {
  setStatus("Selecting a random video...");
  try {
    requireSession();
    if (!creatorInfo) {
      await loadCreatorInfo({ silent: true });
    }
    const data = await callBackend("/generate", { method: "POST" });
    console.log("Video generated:", data);
    await loadPreview(true);
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
    if (!musicConsentCheckbox.checked) {
      setStatus(
        "Please confirm TikTok's Music Usage agreement before uploading.",
        "error"
      );
      musicConsentCheckbox.focus();
      return;
    }
    if (creatorInfo && creatorInfo.can_post === false) {
      setStatus(
        "TikTok is currently preventing uploads for this account. Please try again later.",
        "error"
      );
      return;
    }
    if (!creatorInfo) {
      await loadCreatorInfo({ silent: true });
    }
    const title = titleInput.value.trim();
    if (!title) {
      setStatus("Please enter a video title before uploading.", "error");
      titleInput.focus();
      return;
    }
    if (!selectedPrivacy) {
      setStatus("Please select a privacy option provided by TikTok.", "error");
      return;
    }
    if (selectedPrivacy !== FORCED_VISIBILITY) {
      setStatus(
        "This sandbox can only upload with private visibility until TikTok approves the app.",
        "error"
      );
      return;
    }
    if (!validateCommercialSelection()) {
      setStatus("Complete the commercial disclosure section.", "error");
      return;
    }

    const data = await callBackend("/upload", {
      method: "POST",
      body: {
        title,
        visibility: selectedPrivacy,
        allow_comments: allowCommentsBox?.checked ?? false,
        allow_duet: allowDuetBox?.checked ?? false,
        allow_stitch: allowStitchBox?.checked ?? false,
        commercial: {
          enabled: commercialToggle?.checked ?? false,
          your_brand: commercialSelf?.checked ?? false,
          branded_content: commercialBrand?.checked ?? false,
        },
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
