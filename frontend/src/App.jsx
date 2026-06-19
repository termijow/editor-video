import { useState, useRef } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    // Only accept video files
    if (selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
    } else {
      alert('Por favor selecciona un archivo de video válido.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <div className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h4l3-9 5 18 3-9h5" />
            </svg>
          </div>
          <span className="logo-text">Subtitula<span className="text-gradient">Pro</span></span>
        </div>
      </header>

      <main className="main-content">
        <section className="hero-section">
          <h1 className="hero-title">
            Inteligencia Artificial para <br/> <span className="text-gradient">tus videos</span>
          </h1>
          <p className="hero-subtitle">
            Genera subtítulos automáticos con la potencia de tu PC y la comodidad de tu portátil. Rápido, preciso y sin esfuerzo.
          </p>
        </section>

        <div 
          className={`upload-card glass-panel ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={isDragging ? { borderColor: 'var(--accent-primary)', transform: 'scale(1.02)' } : {}}
        >
          <div className="upload-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
          </div>
          
          <h2 className="upload-title">Sube tu video aquí</h2>
          <p className="upload-desc">Arrastra y suelta tu archivo o haz clic para buscar</p>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="video/*" 
            className="file-input" 
          />
          
          {file ? (
            <div style={{ marginTop: '1rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
              Archivo seleccionado: {file.name}
            </div>
          ) : (
            <button className="btn-primary" onClick={triggerFileInput}>
              Seleccionar Archivo
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
          )}
        </div>

        <section className="features-grid">
          <div className="feature-item glass-panel">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 className="feature-title">Ultra Rápido</h3>
            <p className="feature-desc">Acelerado por hardware utilizando tu tarjeta gráfica dedicada AMD RX 6600.</p>
          </div>
          <div className="feature-item glass-panel">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12 2.1 12 12 2.1"/></svg>
            </div>
            <h3 className="feature-title">Alta Precisión</h3>
            <p className="feature-desc">Impulsado por el modelo Whisper AI para una transcripción y sincronización perfectas.</p>
          </div>
          <div className="feature-item glass-panel">
            <div className="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h3 className="feature-title">Todo Local</h3>
            <p className="feature-desc">Tus videos no se suben a la nube. Todo el proceso es privado y ocurre en tu red local.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
