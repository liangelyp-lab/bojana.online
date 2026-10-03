<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9f492092-5cdf-4d31-b637-926716ec5f78

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Archivos con Google Drive

El MVP incluye proveedor de archivos, OAuth del estudio, carpetas por proyecto y disciplina, entregables dentro de las tareas y acceso autorizado a versiones publicadas. Requiere Node.js 24+, configuración de Google Cloud y volumen persistente para SQLite.

Ver [configuración, arquitectura y límites](docs/STORAGE_ARCHITECTURE.md). Desarrollo: `npm run api` y `npm run dev` en terminales separadas. Validación: `npm run lint`, `npm run build`, `npm run test:storage`.
