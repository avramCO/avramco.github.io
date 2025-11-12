
const BACKEND_URL = "https://unspecialized-nonprotractile-sommer.ngrok-free.dev/v2/auth/start";

document.getElementById("loginBtn").addEventListener("click", () => {
  window.location.href = `${BACKEND_URL}/oauth/start`;
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const res = await fetch(`${BACKEND_URL}/generate`, { method: "POST" });
  const data = await res.json();
  console.log("Video generated:", data);
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const res = await fetch(`${BACKEND_URL}/upload`, { method: "POST" });
  const data = await res.json();
  console.log("Upload result:", data);
});
