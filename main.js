// Frontend script to handle login and video upload actions
const BACKEND_URL = window.location.origin;  // base URL of the Flask backend

const loginBtn = document.getElementById('login-btn');
const uploadBtn = document.getElementById('upload-btn');
const messageEl = document.getElementById('message');

// Check if already logged in (to toggle UI accordingly)
fetch(`${BACKEND_URL}/auth_status`)
  .then(res => res.json())
  .then(data => {
    if (data.logged_in) {
      loginBtn.style.display = 'none';
      uploadBtn.style.display = 'inline-block';
    } else {
      loginBtn.style.display = 'inline-block';
      uploadBtn.style.display = 'none';
    }
  });

// Open TikTok OAuth login in a new window when login button is clicked
loginBtn.addEventListener('click', () => {
  // Open the backend /login route (which redirects to TikTok OAuth) in a popup
  window.open(`${BACKEND_URL}/login`, '_blank', 'width=500,height=800');
});

// Listen for message from the OAuth callback popup
window.addEventListener('message', (event) => {
  if (event.data === 'authorized') {
    // User authorized TikTok app – update UI
    loginBtn.style.display = 'none';
    uploadBtn.style.display = 'inline-block';
    messageEl.textContent = "Logged in to TikTok. You can now upload the video.";
  }
});

// Trigger video upload when upload button is clicked
uploadBtn.addEventListener('click', () => {
  messageEl.textContent = "Uploading video to TikTok...";
  fetch(`${BACKEND_URL}/upload`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        messageEl.textContent = "✅ Video uploaded! (Publish ID: " + data.publish_id + ")";
      } else if (data.error) {
        messageEl.textContent = "⚠️ Upload failed: " + (data.error || 'Unknown error');
        console.error("Upload error details:", data);
        if (data.error === "User not authenticated") {
          // If not logged in, show login button again
          loginBtn.style.display = 'inline-block';
          uploadBtn.style.display = 'none';
        }
      }
    })
    .catch(err => {
      console.error("Request failed:", err);
      messageEl.textContent = "❌ An error occurred during upload.";
    });
});
