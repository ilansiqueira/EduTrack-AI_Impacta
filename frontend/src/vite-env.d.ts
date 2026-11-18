/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XANO_AUTH_BASE_URL?: string;
  readonly VITE_XANO_SUBJECTS_BASE_URL?: string;
  readonly VITE_XANO_TASKS_BASE_URL?: string;
  readonly VITE_XANO_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
