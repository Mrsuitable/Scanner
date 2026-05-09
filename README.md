# Safety Guardian

Safety Guardian is an AI-powered product safety identifier for visually impaired or low-vision users. It is designed as a zero-search safety assistant: open the app, point at a product or upload a photo, and hear the safest available warning first.

Live app: https://mrsuitable.github.io/Scanner/

## Features

- React + Vite frontend
- Tailwind CSS styling
- Mobile-first scanner interface
- Browser camera API support
- Photo upload fallback
- Web Speech API warnings
- Emergency mode
- Demo product simulations
- Safety Curator Database
- PWA manifest and service worker
- Backend placeholder for a real Vision Language Model integration

## Safety Behavior

The current app does not pretend to identify real-world products without a connected vision backend. Live camera and photo scans fail safely as `Unknown` until `VITE_ANALYSIS_ENDPOINT` points to a server-side VLM endpoint.

Demo mode still simulates sample products such as bleach, juice, medicine, and insect spray.

## Run Locally

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Production Build

```bash
npm run build
npm run preview
```

## Vision API Integration

Do not put API keys in the frontend. Create a server endpoint such as:

```text
POST /api/analyze-product
```

Then configure:

```bash
VITE_ANALYSIS_ENDPOINT=/api/analyze-product
```

See `server/visionApiPlaceholder.js` for pseudocode.
