import os, requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
APP_KEY = os.getenv("TIKTOK_CLIENT_KEY")
APP_SECRET = os.getenv("TIKTOK_CLIENT_SECRET")
DEMO_VIDEO = os.getenv("DEMO_VIDEO", "output/demo.mp4")
ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [ALLOWED_ORIGIN, "*"]}})

TOKENS = {"access_token": None, "open_id": None}  # demo only

@app.get("/health")
def health():
    return {"ok": True, "key_set": bool(APP_KEY), "secret_set": bool(APP_SECRET)}

@app.get("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"ok": False, "error": "missing_code"}), 400

    # Exchange code -> access_token
    r = requests.post(
        "https://open-api.tiktok.com/oauth/access_token/",
        data={
            "client_key": APP_KEY,
            "client_secret": APP_SECRET,
            "code": code,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    j = r.json()
    data = j.get("data", {})
    TOKENS["access_token"] = data.get("access_token")
    TOKENS["open_id"] = data.get("open_id")
    ok = bool(TOKENS["access_token"])
    return jsonify({"ok": ok, "data": {"open_id": TOKENS["open_id"]}, "raw": j})

@app.post("/generate")
def generate():
    # Hook your generator here. For demo, just report file presence.
    return {"ok": os.path.exists(DEMO_VIDEO), "file": DEMO_VIDEO}

@app.post("/upload")
def upload():
    at, oid = TOKENS.get("access_token"), TOKENS.get("open_id")
    if not (at and oid):
        return {"ok": False, "error": "no_token"}, 401
    if not os.path.exists(DEMO_VIDEO):
        return {"ok": False, "error": "no_demo_video", "file": DEMO_VIDEO}, 404

    # 1) Upload
    up = requests.post(
        "https://open-api.tiktok.com/api/v2/video/upload/",
        headers={"Authorization": f"Bearer {at}"},
        data={"open_id": oid},
        files={"video": open(DEMO_VIDEO, "rb")},
        timeout=180,
    ).json()
    upload_id = up.get("data", {}).get("upload_id")
    if not upload_id:
        return {"ok": False, "stage": "upload", "res": up}, 400

    # 2) Publish (private)
    pub = requests.post(
        "https://open-api.tiktok.com/api/v2/video/publish/",
        headers={"Authorization": f"Bearer {at}"},
        json={
            "open_id": oid,
            "upload_id": upload_id,
            "post_info": {"title": "Hop2Top quiz demo", "visibility": "private"},
        },
        timeout=60,
    ).json()

    return {"ok": not pub.get("error"), "res": pub, "upload_res": up}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860)

