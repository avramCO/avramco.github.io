document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const genBtn = document.getElementById("generate-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const statusEl = document.getElementById("status");

  const BACKEND_URL = "https://unspecialized-nonprotractile-sommer.ngrok-free.dev";

  // Redirect to TikTok login (or directly to TikTok if handled client-side)
  loginBtn.onclick = () => {
    window.location.href = `${BACKEND_URL}/login`;
  };

  // Trigger video generation
  genBtn.onclick = () => {
    statusEl.textContent = "Generating video...";
    fetch(`${BACKEND_URL}/generate`, {
      method: "GET",
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          statusEl.textContent = "Video generated: " + (data.message || "");
        } else {
          statusEl.textContent = "Video generation failed: " + (data.error || "");
        }
      })
      .catch(err => {
        console.error("Error calling /generate:", err);
        statusEl.textContent = "Error generating video.";
      });
  };

  // Upload the generated video to TikTok
  uploadBtn.onclick = () => {
    statusEl.textContent = "Uploading video to TikTok...";
    fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert("Upload failed: " + data.error);
          statusEl.textContent = "Upload failed: " + data.error;
        } else {
          alert("Upload successful!");
          statusEl.textContent = "Upload successful. Check TikTok for the uploaded video.";
        }
      })
      .catch(err => {
        console.error("Error calling /upload:", err);
        statusEl.textContent = "Error uploading video.";
      });
  };
});
