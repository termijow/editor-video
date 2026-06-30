import os
import moviepy.editor as mp

os.environ["IMAGEMAGICK_BINARY"] = "magick"
os.environ["IMAGEIO_FFMPEG_EXE"] = "/usr/bin/ffmpeg"

def render_timeline(timeline, upload_dir, output_path):
    print("Rendering timeline...")
    resolution = timeline.get("resolution", [1920, 1080])
    w, h = resolution
    
    bg_clip = mp.ColorClip(size=resolution, color=(0,0,0)).set_duration(0.1) # Placeholder duration
    max_duration = 0
    
    layer_clips = []
    
    # Process tracks in reverse order so track 0 is bottom
    for track in timeline.get("tracks", []):
        track_type = track.get("type", "video")
        
        for clip_data in track.get("clips", []):
            start_time = clip_data.get("start_time", 0)
            end_time = clip_data.get("end_time", 5)
            clip_duration = end_time - start_time
            if end_time > max_duration:
                max_duration = end_time
                
            if track_type == "video":
                file_id = clip_data.get("file_id")
                file_path = os.path.join(upload_dir, file_id)
                if not os.path.exists(file_path):
                    continue
                    
                v_clip = mp.VideoFileClip(file_path)
                
                # Trim the clip
                media_start = clip_data.get("media_start", 0)
                media_end = min(media_start + clip_duration, v_clip.duration)
                v_clip = v_clip.subclip(media_start, media_end)
                
                # Apply zoom/crop
                zoom = clip_data.get("zoom", 1.0)
                if zoom != 1.0:
                    cw, ch = v_clip.size
                    new_w, new_h = cw / zoom, ch / zoom
                    v_clip = v_clip.crop(x_center=cw/2, y_center=ch/2, width=new_w, height=new_h).resize((cw, ch))
                
                # Position and timing
                x = clip_data.get("x", "center")
                y = clip_data.get("y", "center")
                v_clip = v_clip.set_position((x, y)).set_start(start_time).set_end(start_time + v_clip.duration)
                
                layer_clips.append(v_clip)
                
            elif track_type == "text":
                text = clip_data.get("text", "")
                fontsize = clip_data.get("fontsize", 60)
                color = clip_data.get("color", "yellow")
                
                try:
                    t_clip = mp.TextClip(
                        text,
                        fontsize=fontsize,
                        color=color,
                        stroke_color='black',
                        stroke_width=2,
                        font='Arial-Bold',
                        method='caption',
                        size=(w * 0.8, None)
                    )
                    t_clip = t_clip.set_position(('center', 'bottom')).set_start(start_time).set_end(end_time)
                    layer_clips.append(t_clip)
                except Exception as e:
                    print(f"Error rendering text clip: {e}")

    if max_duration > 0:
        bg_clip = bg_clip.set_duration(max_duration)
        final_video = mp.CompositeVideoClip([bg_clip] + layer_clips, size=resolution)
        
        # GPU Acceleration (AMD VAAPI)
        ffmpeg_params = [
            "-vaapi_device", "/dev/dri/renderD128", 
            "-vf", "format=nv12,hwupload"
        ]
        
        final_video.write_videofile(
            output_path, 
            codec="h264_vaapi", 
            audio_codec="aac", 
            fps=30,
            ffmpeg_params=ffmpeg_params
        )
    else:
        raise ValueError("Timeline is empty or has no duration")
