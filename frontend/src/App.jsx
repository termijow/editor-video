import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [media, setMedia] = useState([]);
  const [timeline, setTimeline] = useState({
    resolution: [1920, 1080],
    tracks: [
      { id: 'track-v1', type: 'video', name: 'Video 1', clips: [] },
      { id: 'track-t1', type: 'text', name: 'Subtítulos', clips: [] }
    ]
  });
  const [selectedClip, setSelectedClip] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState(null);
  const fileInputRef = useRef(null);

  // === Media Library Logic ===
  const triggerFileInput = () => fileInputRef.current.click();

  const handleFileUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('http://localhost:8001/upload_media', {
          method: 'POST',
          body: formData,
        });
        return await response.json();
      });
      
      const newMediaItems = await Promise.all(uploadPromises);
      setMedia(prevMedia => [...prevMedia, ...newMediaItems]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error al subir archivo(s)");
    } finally {
      setIsUploading(false);
    }
  };

  const addMediaToTimeline = (mediaItem) => {
    // Add to first video track
    const newTimeline = { ...timeline };
    const track = newTimeline.tracks[0];
    
    // Find last end_time to append
    let lastEnd = 0;
    if (track.clips.length > 0) {
      lastEnd = Math.max(...track.clips.map(c => c.end_time));
    }
    
    const newClip = {
      id: 'clip-' + Date.now(),
      file_id: mediaItem.id,
      name: mediaItem.name,
      url: mediaItem.url,
      start_time: lastEnd,
      end_time: lastEnd + (mediaItem.duration || 5),
      media_start: 0,
      zoom: 1.0,
      x: "center",
      y: "center"
    };
    
    track.clips.push(newClip);
    setTimeline(newTimeline);
  };

  // === Timeline Logic ===
  const selectClip = (trackIndex, clipIndex) => {
    setSelectedClip({ trackIndex, clipIndex });
  };

  const updateSelectedClip = (field, value) => {
    if (!selectedClip) return;
    const { trackIndex, clipIndex } = selectedClip;
    const newTimeline = { ...timeline };
    newTimeline.tracks[trackIndex].clips[clipIndex][field] = value;
    setTimeline(newTimeline);
  };

  const deleteSelectedClip = () => {
    if (!selectedClip) return;
    const { trackIndex, clipIndex } = selectedClip;
    const newTimeline = { ...timeline };
    newTimeline.tracks[trackIndex].clips.splice(clipIndex, 1);
    setTimeline(newTimeline);
    setSelectedClip(null);
  };

  // === AI Tools ===
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const generateAutoSubs = async () => {
    if (!selectedClip) return;
    const clip = timeline.tracks[selectedClip.trackIndex].clips[selectedClip.clipIndex];
    if (timeline.tracks[selectedClip.trackIndex].type !== 'video') return;
    
    setIsGeneratingSubs(true);
    try {
      const response = await fetch('http://localhost:8001/generate_subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: clip.file_id })
      });
      const data = await response.json();
      
      const newTimeline = { ...timeline };
      const textTrack = newTimeline.tracks[1];
      
      data.segments.forEach((seg, i) => {
        textTrack.clips.push({
          id: 'sub-' + Date.now() + '-' + i,
          text: seg.text,
          start_time: clip.start_time + seg.start,
          end_time: clip.start_time + seg.end,
          color: "yellow",
          fontsize: 60
        });
      });
      
      setTimeline(newTimeline);
      alert("Subtítulos generados con éxito!");
    } catch (error) {
      console.error(error);
      alert("Error generando subtítulos");
    } finally {
      setIsGeneratingSubs(false);
    }
  };

  // === Export Logic ===
  const renderVideo = async () => {
    setIsRendering(true);
    setRenderResult(null);
    try {
      const response = await fetch('http://localhost:8001/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeline })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setRenderResult(data.url);
      } else {
        alert("Error: " + data.detail);
      }
    } catch (error) {
      console.error(error);
      alert("Error al exportar");
    } finally {
      setIsRendering(false);
    }
  };

  // Calculate timeline total width
  const maxDuration = Math.max(
    10, 
    ...timeline.tracks.map(t => 
      t.clips.length > 0 ? Math.max(...t.clips.map(c => c.end_time)) : 0
    )
  );
  
  const getSelectedClipData = () => {
    if (!selectedClip) return null;
    return timeline.tracks[selectedClip.trackIndex].clips[selectedClip.clipIndex];
  };
  const activeClip = getSelectedClipData();
  
  const handleResolutionChange = (e) => {
    const [w, h] = e.target.value.split('x').map(Number);
    setTimeline({ ...timeline, resolution: [w, h] });
  };

  return (
    <div className="nle-container">
      <header className="nle-header">
        <div className="logo-text">Subtitula<span className="text-gradient">Pro</span> Studio</div>
        <div className="header-controls" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <select 
            value={`${timeline.resolution[0]}x${timeline.resolution[1]}`} 
            onChange={handleResolutionChange}
            style={{ padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--border-color)' }}
          >
            <option value="1920x1080">Paisaje (16:9)</option>
            <option value="1080x1920">Vertical (9:16)</option>
            <option value="1080x1080">Cuadrado (1:1)</option>
          </select>
          <button className="btn-export" onClick={renderVideo} disabled={isRendering}>
            {isRendering ? 'Renderizando...' : 'Exportar Video'}
          </button>
        </div>
      </header>

      <div className="nle-main">
        {/* Left: Media Library */}
        <div className="nle-panel media-library">
          <h3>Archivos</h3>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{display: 'none'}} multiple />
          <button className="btn-secondary" onClick={triggerFileInput} disabled={isUploading}>
            {isUploading ? 'Subiendo...' : '+ Subir Archivo'}
          </button>
          
          <div className="media-grid">
            {media.map((item, i) => (
              <div key={i} className="media-item">
                <div className="media-thumb">
                  {item.type === 'video' ? '🎬' : '🎵'}
                </div>
                <div className="media-info">
                  <span className="media-name">{item.name}</span>
                  <button onClick={() => addMediaToTimeline(item)}>Añadir</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Preview Player */}
        <div className="nle-panel preview-panel">
          <div className="preview-player glass-panel" style={{ aspectRatio: `${timeline.resolution[0]}/${timeline.resolution[1]}` }}>
            {renderResult ? (
              <video src={renderResult} controls autoPlay className="main-video" />
            ) : activeClip && timeline.tracks[selectedClip.trackIndex].type === 'video' ? (
              <video src={activeClip.url} controls className="main-video" />
            ) : (
              <div className="empty-preview">
                {renderResult === null ? "Selecciona un clip o Exporta para ver" : ""}
              </div>
            )}
          </div>
          {renderResult && (
            <a href={renderResult} download className="btn-primary" style={{marginTop: 15, alignSelf: 'center'}}>
              Descargar Resultado
            </a>
          )}
        </div>

        {/* Right: Properties Inspector */}
        <div className="nle-panel properties-panel">
          <h3>Propiedades</h3>
          {activeClip ? (
            <div className="properties-form">
              <label>Inicio en timeline (s)
                <input type="number" step="0.1" value={activeClip.start_time} onChange={e => updateSelectedClip('start_time', parseFloat(e.target.value))} />
              </label>
              <label>Fin en timeline (s)
                <input type="number" step="0.1" value={activeClip.end_time} onChange={e => updateSelectedClip('end_time', parseFloat(e.target.value))} />
              </label>
              
              {timeline.tracks[selectedClip.trackIndex].type === 'video' && (
                <>
                  <label>Recorte inicio clip (s)
                    <input type="number" step="0.1" value={activeClip.media_start} onChange={e => updateSelectedClip('media_start', parseFloat(e.target.value))} />
                  </label>
                  <label>Zoom (escala)
                    <input type="number" step="0.1" value={activeClip.zoom} onChange={e => updateSelectedClip('zoom', parseFloat(e.target.value))} />
                  </label>
                  <button className="btn-action" onClick={generateAutoSubs} disabled={isGeneratingSubs}>
                    {isGeneratingSubs ? 'Generando...' : '✨ Autogenerar Subtítulos'}
                  </button>
                </>
              )}

              {timeline.tracks[selectedClip.trackIndex].type === 'text' && (
                <>
                  <label>Texto
                    <textarea value={activeClip.text} onChange={e => updateSelectedClip('text', e.target.value)} />
                  </label>
                  <label>Color
                    <input type="text" value={activeClip.color} onChange={e => updateSelectedClip('color', e.target.value)} />
                  </label>
                </>
              )}

              <button className="btn-danger" onClick={deleteSelectedClip}>Eliminar Clip</button>
            </div>
          ) : (
            <p className="text-secondary">Selecciona un clip en la línea de tiempo para editar sus propiedades, o autogenerar subtítulos.</p>
          )}
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="nle-timeline-container glass-panel">
        <div className="timeline-header">
          <h3>Línea de Tiempo</h3>
        </div>
        
        <div className="timeline-tracks">
          {timeline.tracks.map((track, tIdx) => (
            <div key={track.id} className="timeline-track">
              <div className="track-info">
                {track.name}
              </div>
              <div className="track-clips">
                {track.clips.map((clip, cIdx) => {
                  const left = (clip.start_time / maxDuration) * 100;
                  const width = ((clip.end_time - clip.start_time) / maxDuration) * 100;
                  const isSelected = selectedClip?.trackIndex === tIdx && selectedClip?.clipIndex === cIdx;
                  
                  return (
                    <div 
                      key={clip.id}
                      className={`timeline-clip ${isSelected ? 'selected' : ''} ${track.type}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={() => selectClip(tIdx, cIdx)}
                    >
                      {track.type === 'video' ? clip.name : clip.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="timeline-ruler">
          {Array.from({length: Math.ceil(maxDuration)}).map((_, i) => (
            <div key={i} className="ruler-mark" style={{left: `${(i / maxDuration) * 100}%`}}>
              {i}s
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
