import os, subprocess, json, tempfile, requests, re
import socket, ipaddress

from urllib.parse import urlparse
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()

def is_public_http_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False
        if not parsed.hostname:
            return False

        infos = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
        for info in infos:
            ip = ipaddress.ip_address(info[4][0])
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_reserved
                or ip.is_unspecified
            ):
                return False
        return True
    except Exception:
        return False

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    url = data.get("filename")           # really a URL now
    if not url:
        raise HTTPException(status_code=400, detail="No URL provided")
    if not is_public_http_url(url):
        raise HTTPException(status_code=400, detail="Invalid or disallowed URL")

    # download it to a temp file
    resp = requests.get(url, allow_redirects=False, timeout=10)
    if not resp.ok:
        raise HTTPException(
            status_code=502,
            detail=f"Couldn’t download file: {resp.status_code}",
        )

    parsed = urlparse(url)
    path_ext = os.path.splitext(os.path.basename(parsed.path))[1].lower()
    suffix = path_ext if re.fullmatch(r"\.[a-z0-9]{1,10}", path_ext) else ".mp3"
    tf = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tf.write(resp.content)
    tf.flush(); tf.close()

    # run Essentia on that temp file
    cmd = [
        "essentia_streaming_extractor_music",
        tf.name,
        "-",
        "/etc/essentia/profile.yaml"
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(tf.name)

    if proc.returncode != 0:
        raise HTTPException(
            status_code=422,
            detail=f"Essentia extractor failed: {proc.stderr.strip()}",
        )

    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Essentia produced invalid JSON: {e}",
        )