(function () {
  if (!window.BACKEND_URL) {
    document.body.textContent =
      "Missing BACKEND_URL. Update frontend/config.js and redeploy.";
    return;
  }

  const query = window.location.search || "";
  const target = `${window.BACKEND_URL}/callback${query}`;
  window.location.replace(target);
})();
