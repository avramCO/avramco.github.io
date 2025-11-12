// main.js: Handles button click logic for TikTok OAuth flow and video operations
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("login-btn");
  const genBtn = document.getElementById("generate-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const statusEl = document.getElementById("status");

  // Redirect to TikTok login (backend will handle building the URL)
  loginBtn.onclick = () => {
    window.location.href = "/login";
  };

  // Trigger video generation (optional stub endpoint)
  genBtn.onclick = () => {
    statusEl.textContent = "Generating video...";
    fetch("/generate")
      .then(res => res.json())
      .then(data => {
        if (data.status === "ok") {
          // Video generation succeeded (or is stubbed out)
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
    fetch("/upload", { method: "POST" })
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
