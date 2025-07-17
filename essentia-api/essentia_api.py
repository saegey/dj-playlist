import os, subprocess, json, tempfile, requests
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    url = data.get("filename")           # really a URL now
    if not url:
        return {"error": "No URL provided"}

    # download it to a temp file
    resp = requests.get(url)
    if not resp.ok:
        return {"error": f"Couldn’t download file: {resp.status_code}"}

    suffix = os.path.splitext(url)[1] or ".mp3"
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
        return {"error": proc.stderr}

    return json.loads(proc.stdout)