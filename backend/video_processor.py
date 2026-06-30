import os
import moviepy.editor as mp
import whisper
import numpy as np

# Configure ImageMagick binary for TextClip
os.environ["IMAGEMAGICK_BINARY"] = "magick"

def process_video(input_path, output_path):
    print(f"Loading video: {input_path}")
    video = mp.VideoFileClip(input_path)
    
    # 1. Extract audio
    audio_path = input_path + "_temp_audio.wav"
    video.audio.write_audiofile(audio_path, codec='pcm_s16le')
    
    # 2. Transcribe with Whisper
    print("Loading Whisper model (base)...")
    # Using base model for speed
    model = whisper.load_model("base")
    print("Transcribing audio...")
    result = model.transcribe(audio_path)
    segments = result["segments"]
    
    # 3. Silence Detection using numpy on moviepy audio array
    print("Detecting silence...")
    fps = video.audio.fps
    audio_array = video.audio.to_soundarray()
    
    # Convert stereo to mono by averaging channels
    if len(audio_array.shape) > 1:
        mono_audio = np.mean(audio_array, axis=1)
    else:
        mono_audio = audio_array
        
    chunk_duration = 0.1 # 100ms chunks
    chunk_samples = int(fps * chunk_duration)
    
    keep_segments = []
    current_start = None
    
    # A simple threshold. RMS = sqrt(mean(square)). 
    # Max value is 1.0 (float). Let's use 0.01 as threshold
    threshold = 0.01
    
    for i in range(0, len(mono_audio), chunk_samples):
        chunk = mono_audio[i:i+chunk_samples]
        if len(chunk) == 0: break
        rms = np.sqrt(np.mean(chunk**2))
        
        t = i / fps
        is_silent = rms < threshold
        
        if not is_silent and current_start is None:
            current_start = t
        elif is_silent and current_start is not None:
            if t - current_start > 0.5: # min length 0.5s
                keep_segments.append((current_start, t))
            current_start = None
            
    if current_start is not None:
        keep_segments.append((current_start, len(mono_audio) / fps))

    
    if not keep_segments:
        # If no silence detected, keep the whole video
        keep_segments = [(0, video.duration)]
        
    print(f"Non-silent segments: {keep_segments}")
    
    final_clips = []
    
    # 4. Process each non-silent segment
    for i, (start, end) in enumerate(keep_segments):
        # Prevent going out of bounds
        if start >= video.duration: continue
        end = min(end, video.duration)
        
        clip = video.subclip(start, end)
        
        # Zoom Inteligente: Apply a simple zoom effect on alternating clips to make it dynamic
        if i % 2 == 1:
            w, h = clip.size
            # Crop center 80% and resize back to original size (zoom in)
            clip = clip.crop(x_center=w/2, y_center=h/2, width=w*0.8, height=h*0.8).resize((w, h))
            
        # Find subtitles that fall in this time range
        clip_subs = []
        for sub in segments:
            # If subtitle overlaps with this clip
            if sub["start"] < end and sub["end"] > start:
                try:
                    # Create TextClip for the subtitle
                    txt_clip = mp.TextClip(
                        sub["text"].strip(),
                        fontsize=60,
                        color='yellow',
                        stroke_color='black',
                        stroke_width=2,
                        font='Arial-Bold',
                        method='caption',
                        size=(clip.size[0] * 0.9, None)
                    )
                    
                    # Adjust timings relative to the subclip
                    sub_start = max(0, sub["start"] - start)
                    sub_end = min(clip.duration, sub["end"] - start)
                    
                    txt_clip = txt_clip.set_position(('center', 'bottom')).set_start(sub_start).set_end(sub_end)
                    clip_subs.append(txt_clip)
                except Exception as e:
                    print(f"Error creating TextClip: {e}")
                    
        if clip_subs:
            clip = mp.CompositeVideoClip([clip] + clip_subs)
            
        final_clips.append(clip)
        
    print("Concatenating clips...")
    if final_clips:
        final_video = mp.concatenate_videoclips(final_clips)
        print("Writing final video...")
        final_video.write_videofile(output_path, codec="libx264", audio_codec="aac")
    else:
        print("No valid segments found, saving original video.")
        video.write_videofile(output_path, codec="libx264", audio_codec="aac")
        
    # Cleanup
    if os.path.exists(audio_path):
        os.remove(audio_path)
    video.close()
