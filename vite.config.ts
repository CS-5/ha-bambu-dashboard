import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `base: "./"` keeps asset URLs relative so the build works from HA's `/local/...`
// (config/www) path when embedded as a sidebar iframe panel.
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { "@": path.resolve(__dirname, "src") },
	},
	base: "./",
	server: {
		port: 2022,
		host: true,
	},
});
