/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Home Assistant base URL used during local dev (e.g. http://homeassistant.local:8123).
	 *  In production (served by HA) we fall back to window.location.origin. */
	readonly VITE_HA_URL?: string;
	/** Optional long-lived access token to bypass the login screen during local dev. */
	readonly VITE_HA_TOKEN?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
