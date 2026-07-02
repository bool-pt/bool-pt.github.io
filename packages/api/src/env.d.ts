// The client reads PUBLIC_API_BASE_URL from the build-time env (injected by
// Astro/Vite). Declare it here so this framework-agnostic package types
// import.meta.env without pulling in astro/client or vite/client.
interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
