from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exception_handlers import RequestValidationError
from fastapi.exceptions import RequestValidationError as FastAPIRequestValidationError
from pydantic import BaseModel
from typing import List
from starlette.concurrency import run_in_threadpool
from optimizer import run_genetic_algorithm

app = FastAPI()

# Custom handler to ensure validation errors return 422 and are logged
@app.exception_handler(FastAPIRequestValidationError)
async def validation_exception_handler(request: Request, exc: FastAPIRequestValidationError):
    # Log the error for debugging
    print(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


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
