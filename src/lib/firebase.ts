import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Initialized via a helper to avoid top-level await issues in some environments
let config: any = null;
let app: any = null;
let db: any = null;
let auth: any = null;

const initFirebase = async () => {
  if (app) return { app, db, auth };
  
  try {
    // Vite handles this at build time, but we guard it just in case
    // @ts-ignore
    const configModule = await import('../../firebase-applet-config.json');
    config = configModule.default || configModule;
    
    if (config && config.apiKey && config.apiKey !== "") {
      // Prevent multiple initialization in dev HMR
      if (getApps().length > 0) {
        app = getApp();
      } else {
        app = initializeApp(config);
      }
      db = getFirestore(app);
      auth = getAuth(app);
    }
  } catch (e) {
    console.log("Firebase config not found or invalid - falling back to mock mode");
  }
  
  return { app, db, auth };
};

// For synchronous checks, we might still have issues
// But we can export getters or just handle the async nature in the AppContext
export { initFirebase };

// Mock readiness check
export const isConfigValid = (c: any) => c && c.apiKey && c.apiKey !== "";
