import { useEffect, useRef, useState } from "react";
import { usePrinters } from "@/context/printers";
import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { ChevronDownIcon, PrinterIcon } from "./icons";

function StatusDot({ printer }: { printer: Printer }) {
	const online = useEnt(entityIdForRole(printer, "online"));
	const status = useEnt(entityIdForRole(printer, "print_status"));
	const isOnline = !online || online.state === "on";
	const printing = status?.state === "running";
	return (
		<span
			className={cn(
				"h-2 w-2 shrink-0 rounded-full",
				!isOnline
					? "bg-ink-600"
					: printing
						? "animate-pulse-ring bg-bambu-400"
						: "bg-bambu-500",
			)}
		/>
	);
}

/** Header identity + (when >1 printer) a dropdown to switch printers. */
export function PrinterSwitcher() {
	const { printers, selected, setSelectedId } = usePrinters();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		const onClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	if (!selected) {
		return null;
	}
	const multiple = printers.length > 1;

	return (
		<div className="relative" ref={ref}>
			<button
				type="button"
				disabled={!multiple}
				onClick={() => setOpen((o) => !o)}
				className={cn(
					"flex items-center gap-3 rounded-xl px-1 py-1 text-left",
					multiple && "hover:bg-ink-850/60",
				)}
			>
				<span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800 bg-ink-900 text-bambu-400 text-xl">
					<PrinterIcon />
				</span>
				<span className="min-w-0">
					<span className="flex items-center gap-2">
						<span className="truncate font-bold text-ink-100 text-lg">
							{selected.name}
						</span>
						<StatusDot printer={selected} />
						{multiple && <ChevronDownIcon className="text-ink-400" />}
					</span>
					{selected.model && (
						<span className="block truncate text-ink-400 text-xs">
							{titleCase(selected.model)}
						</span>
					)}
				</span>
			</button>

			{open && multiple && (
				<div className="absolute top-full left-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-ink-800 bg-ink-900 shadow-black/40 shadow-xl">
					{printers.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => {
								setSelectedId(p.id);
								setOpen(false);
							}}
							className={cn(
								"flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-ink-850",
								p.id === selected.id ? "text-bambu-300" : "text-ink-200",
							)}
						>
							<StatusDot printer={p} />
							<span className="truncate font-medium">{p.name}</span>
							{p.model && (
								<span className="ml-auto truncate text-ink-400 text-xs">
									{titleCase(p.model)}
								</span>
							)}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
