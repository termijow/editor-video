#!/bin/bash

# ==========================================================
# Roadmap del Proyecto: Editor de Video con IA (React + FastAPI)
# ==========================================================

# Fase 1: Configuración del Entorno y Estructura
# 1. Instalar Node.js y NPM (necesarios para el frontend).
# 2. Inicializar el proyecto React con Vite en la carpeta 'frontend'.
# 3. Configurar el entorno virtual y dependencias de Python (FastAPI, MoviePy, Whisper, OpenCV) en 'backend'.

# Fase 2: Desarrollo del Backend y Procesamiento de Video (IA Local)
# 1. Crear endpoint de subida de video en FastAPI.
# 2. IA de Subtítulos: Integrar 'openai-whisper' para transcribir el audio y generar los tiempos de cada palabra.
# 3. Detección de Silencios: Analizar las pistas de audio para marcar fragmentos sin voz.
# 4. Zoom Inteligente: Usar OpenCV para rastrear el rostro o el movimiento y aplicar zooms automáticos en momentos clave.
# 5. Renderizado: Unir cortes, zooms y subtítulos quemados usando MoviePy o FFmpeg, devolviendo el video final.

# Fase 3: Interfaz de Usuario y Frontend
# 1. Diseñar una UI Premium (Dark mode, glassmorphism, micro-animaciones).
# 2. Crear el componente de subida de archivos (Drag & Drop).
# 3. Desarrollar una línea de tiempo (Timeline) donde se puedan visualizar y ajustar las sugerencias de la IA.
# 4. Vista previa de video interactiva.
# 5. Botón de Exportar para mandar las configuraciones finales al backend y recibir el video editado.

# Fase 4: Pruebas y Optimización
# 1. Probar el rendimiento local con la GPU AMD RX 6600 (asegurar aceleración si es posible).
# 2. Refinar estilos y animaciones CSS (sin Tailwind, 100% Vanilla CSS).
# 3. Optimización de tiempos de renderizado de video en el backend.

echo "Roadmap guardado. Sigue estas fases para completar el proyecto."
