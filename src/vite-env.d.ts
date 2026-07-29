/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API host, without a trailing slash. e.g. http://localhost:7001 */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
