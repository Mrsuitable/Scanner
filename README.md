# Safety Guardian

Safety Guardian is an AI-powered product safety identifier for visually impaired or low-vision users. It is designed as a zero-search safety assistant: open the app, point at a product or upload a photo, and hear the safest available warning first.

Static demo: https://mrsuitable.github.io/Scanner/

For real Vision AI detection, deploy this repository to a host that supports serverless functions, such as Vercel. GitHub Pages is static and cannot safely store `OPENAI_API_KEY`.

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

Do not put API keys in the frontend. This repo includes a serverless endpoint:

```text
POST /api/analyze-product
```

Set these environment variables on the hosting platform:

```bash
OPENAI_API_KEY=sk-your-server-side-key
OPENAI_VISION_MODEL=gpt-4.1-mini
VITE_ANALYSIS_ENDPOINT=/api/analyze-product
```

On Vercel, `VITE_ANALYSIS_ENDPOINT` can be omitted because the app defaults to `/api/analyze-product`.

The endpoint returns a structured safety result and still fails safely as `Unknown` if confidence is low or the model cannot identify the product.

After deployment, check:

```text
https://YOUR-VERCEL-APP.vercel.app/api/health
```

It should return `"visionConfigured": true`.

See `api/analyze-product.js` for the working serverless implementation and `server/visionApiPlaceholder.js` for integration notes.
