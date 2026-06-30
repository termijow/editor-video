from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import moviepy.editor as mp
import whisper
import json
from render_engine import render_timeline

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/processed", StaticFiles(directory=PROCESSED_DIR), name="processed")

# Load Whisper model globally to avoid loading it on every request
whisper_model = None

@app.get("/")
def read_root():
    return {"message": "Video NLE API is running"}

@app.post("/upload_media")
async def upload_media(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Get duration
    duration = 0
    try:
        clip = mp.VideoFileClip(file_path)
        duration = clip.duration
        clip.close()
    except Exception as e:
        print(f"Warning: Could not get duration for {filename}: {e}")
        
    url = f"http://localhost:8001/uploads/{filename}"
    return {
        "id": filename,
        "name": file.filename,
        "url": url,
        "duration": duration,
        "type": "video" if ext.lower() in ['.mp4', '.mov', '.avi', '.webm'] else "audio"
    }

class SubtitleRequest(BaseModel):
    file_id: str

@app.post("/generate_subtitles")
def generate_subtitles(req: SubtitleRequest):
    global whisper_model
    file_path = os.path.join(UPLOAD_DIR, req.file_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    if whisper_model is None:
        print("Loading Whisper model...")
        whisper_model = whisper.load_model("base")
        
    print(f"Transcribing {file_path}...")
    # Extract audio temporarily for whisper
    temp_audio = f"{file_path}_audio.wav"
    try:
        clip = mp.VideoFileClip(file_path)
        clip.audio.write_audiofile(temp_audio, codec='pcm_s16le', verbose=False, logger=None)
        clip.close()
        
        result = whisper_model.transcribe(temp_audio)
        segments = result.get("segments", [])
        
        # Cleanup
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
            
        return {"segments": segments}
    except Exception as e:
        if os.path.exists(temp_audio):
            os.remove(temp_audio)
        raise HTTPException(status_code=500, detail=str(e))

class RenderRequest(BaseModel):
    timeline: Dict[str, Any]

@app.post("/render")
def render_video(req: RenderRequest):
    output_filename = f"export_{str(uuid.uuid4())[:8]}.mp4"
    output_path = os.path.join(PROCESSED_DIR, output_filename)
    
    try:
        render_timeline(req.timeline, UPLOAD_DIR, output_path)
        download_url = f"http://localhost:8001/processed/{output_filename}"
        return {"status": "success", "url": download_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
