# InspectMe Architecture & Status

## Tech Stack
* Frontend: React (Vite), React Router v6
* Styling: Tailwind CSS
* Backend: Node.js, Express, MongoDB
* Offline Sync: IndexedDB (idb) via custom syncService.js
* PWA: virtual:pwa-register

## Project Structure
* `/src/components` - UI building blocks (e.g., AnimatedBottomDock)
* `/src/pages` - Route views (Dashboard, Inspections, Auth)
* `/src/services` - Axios API clients (`inspectionApi.js`)
* `/src/store` - Context API (`authContext.jsx`)
* `/src/offline` - IndexedDB logic and outbox sync

## Current Milestone
* Refining offline-first inspection submission queue.
* Rapid prototyping new UI components with Tailwind glassmorphism.