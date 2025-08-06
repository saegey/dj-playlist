from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from starlette.concurrency import run_in_threadpool
from optimizer import run_genetic_algorithm

app = FastAPI()


class Track(BaseModel):
    embedding: str
    bpm: float

    class Config:
        extra = 'allow'    # ← this tells Pydantic “anything else you see, keep it”


class OptimizeRequest(BaseModel):
    tracks: List[Track]


@app.post("/optimize")
async def optimize(req: OptimizeRequest):
    # Convert Pydantic models to plain dicts
    tracks = [t.dict() for t in req.tracks]

    # Offload CPU‐bound work to a thread
    try:
        optimized = await run_in_threadpool(run_genetic_algorithm, tracks)
    except ValueError as e:
        # For example, if your algorithm raises on malformed data
        raise HTTPException(status_code=400, detail=str(e))

    return {"result": optimized}
