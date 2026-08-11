// Vercel serverless entry point — exports the Express app for @vercel/node
// The app itself lives in src/app.ts; this file just re-exports it without starting a server.
// On Vercel, the platform handles the HTTP listener; locally, src/app.ts starts it directly.

import app from '../src/app';

export default app;
