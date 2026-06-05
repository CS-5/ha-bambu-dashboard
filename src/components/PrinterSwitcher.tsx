import { Box, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrinters } from "@/context/printers";
import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";

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

function Identity({
	printer,
	withChevron,
}: {
	printer: Printer;
	withChevron?: boolean;
}) {
	return (
		<>
			<span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800 bg-ink-900 text-bambu-400 text-xl">
				<Box />
			</span>
			<span className="min-w-0">
				<span className="flex items-center gap-2">
					<span className="truncate font-bold text-ink-100 text-lg">
						{printer.name}
					</span>
					<StatusDot printer={printer} />
					{withChevron && <ChevronDown className="text-ink-400" />}
				</span>
				{printer.model && (
					<span className="block truncate text-ink-400 text-xs">
						{titleCase(printer.model)}
					</span>
				)}
			</span>
		</>
	);
}

/** Header identity + (when >1 printer) a dropdown to switch printers. */
export function PrinterSwitcher() {
	const { printers, selected, setSelectedId } = usePrinters();

	if (!selected) {
		return null;
	}

	// Single printer: just the identity, no dropdown affordance.
	if (printers.length <= 1) {
		return (
			<div className="flex items-center gap-3 px-1 py-1">
				<Identity printer={selected} />
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex items-center gap-3 rounded-xl px-1 py-1 text-left outline-none hover:bg-ink-850/60">
				<Identity printer={selected} withChevron />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-60 border-ink-800 bg-ink-900"
			>
				{printers.map((p) => (
					<DropdownMenuItem
						key={p.id}
						onSelect={() => setSelectedId(p.id)}
						className={cn(
							"gap-2.5 py-2.5 focus:bg-ink-850",
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
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
