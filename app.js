// use your exact ngrok host here
const ABS_BACKEND_START = "https://unspecialized-nonprotractile-sommer.ngrok-free.dev/oauth/start";

document.getElementById("loginBtn").addEventListener("click", () => {
  // force absolute redirect
  window.location.assign(ABS_BACKEND_START);
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
