/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_USE_EMULATORS: string;
  readonly VITE_FIRESTORE_EMULATOR_HOST: string;
  readonly VITE_FIRESTORE_EMULATOR_PORT: string;
  readonly VITE_AUTH_EMULATOR_HOST: string;
  readonly VITE_AUTH_EMULATOR_PORT: string;
  readonly VITE_STORAGE_EMULATOR_HOST: string;
  readonly VITE_STORAGE_EMULATOR_PORT: string;
  readonly VITE_FUNCTIONS_EMULATOR_HOST: string;
  readonly VITE_FUNCTIONS_EMULATOR_PORT: string;
  readonly VITE_ENABLE_AI_FEATURES: string;
  readonly VITE_ENABLE_FHIR_API: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEEPSEEK_API_KEY: string;
  readonly VITE_OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
