import { useHass } from "@hakit/core";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { discoverPrinters } from "@/lib/discovery";
import type { Printer } from "@/lib/types";

interface PrinterContextValue {
	printers: Printer[];
	selected: Printer | null;
	selectedId: string | null;
	setSelectedId: (id: string) => void;
}

const PrinterContext = createContext<PrinterContextValue | null>(null);

export function PrinterProvider({ children }: { children: ReactNode }) {
	const devices = useHass((s) => s.devices);
	const entitiesRegistryDisplay = useHass((s) => s.entitiesRegistryDisplay);

	const printers = useMemo(
		() => discoverPrinters(devices, entitiesRegistryDisplay),
		[devices, entitiesRegistryDisplay],
	);

	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Keep a valid selection as printers appear / disappear.
	useEffect(() => {
		if (printers.length === 0) {
			if (selectedId !== null) {
				setSelectedId(null);
			}
			return;
		}
		if (!selectedId || !printers.some((p) => p.id === selectedId)) {
			setSelectedId(printers[0].id);
		}
	}, [printers, selectedId]);

	const selected = useMemo(
		() => printers.find((p) => p.id === selectedId) ?? null,
		[printers, selectedId],
	);

	const value = useMemo<PrinterContextValue>(
		() => ({ printers, selected, selectedId, setSelectedId }),
		[printers, selected, selectedId],
	);

	return (
		<PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>
	);
}

export function usePrinters(): PrinterContextValue {
	const ctx = useContext(PrinterContext);
	if (!ctx) {
		throw new Error("usePrinters must be used within PrinterProvider");
	}
	return ctx;
}
