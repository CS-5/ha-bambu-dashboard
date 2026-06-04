import { HassConnect } from "@hakit/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConnectionScreen } from "./components/ConnectionScreen";
import { PrinterProvider } from "./context/printers";
import "./styles/index.css";

// In production the dashboard is served by Home Assistant, so the HA origin is
// simply where the page is loaded from. For local dev, point VITE_HA_URL at your
// instance (and optionally VITE_HA_TOKEN to skip the login screen).
const hassUrl = import.meta.env.VITE_HA_URL || window.location.origin;
const hassToken = import.meta.env.VITE_HA_TOKEN;

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error('Root element "#root" not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<HassConnect
			hassUrl={hassUrl}
			hassToken={hassToken}
			loading={<ConnectionScreen message="Connecting to Home Assistant…" />}
		>
			<PrinterProvider>
				<App />
			</PrinterProvider>
		</HassConnect>
	</StrictMode>,
);
