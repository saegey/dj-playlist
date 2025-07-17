FROM ghcr.io/mgoltzsche/essentia
RUN apk add --no-cache python3 py3-pip

# create venv & install
COPY requirements.txt /tmp/requirements.txt
RUN python3 -m venv /venv \
     && . /venv/bin/activate \
     && pip install --no-cache-dir -r /tmp/requirements.txt
ENV PATH="/venv/bin:$PATH"

WORKDIR /data
COPY essentia_api.py .

EXPOSE 8001
CMD ["uvicorn", "essentia_api:app", "--host", "0.0.0.0", "--port", "8001"]