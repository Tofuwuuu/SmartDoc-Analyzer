const configuredUrl = import.meta.env.VITE_API_URL;

/** Set only for local FastAPI. An empty value keeps analysis in the browser. */
export const API_URL = typeof configuredUrl === "string" ? configuredUrl.trim() : "";

export const usesBackend = API_URL.length > 0;
