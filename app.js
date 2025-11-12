const backendUrl = "https://unspecialized-nonprotractile-sommer.ngrok-free.dev";

document.getElementById('loginBtn').addEventListener('click', () => {
  window.location.href = 'https://unspecialized-nonprotractile-sommer.ngrok-free.dev/oauth2/start';
});


document.getElementById("generateBtn").onclick = async () => {
    const res = await fetch(`${backendUrl}/generate`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.status === "success") {
        document.getElementById("status").innerText = "Video generated!";
        document.getElementById("uploadBtn").disabled = false;
    } else {
        document.getElementById("status").innerText = "Video generation failed.";
    }
};

document.getElementById("uploadBtn").onclick = async () => {
    document.getElementById("status").innerText = "Uploading...";
    const res = await fetch(`${backendUrl}/upload`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (data.data && data.data.publish_id) {
        document.getElementById("status").innerText = "Upload successful! Check your TikTok account.";
    } else {
        document.getElementById("status").innerText = "Upload failed.";
    }
};

// Enable Generate button if login=success in URL
if (window.location.search.includes("login=success")) {
    document.getElementById("generateBtn").disabled = false;
    document.getElementById("status").innerText = "Logged in! Ready to generate a video.";
}
