import { cn } from "@/lib/cn";
import { isMissing, num } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { DropIcon, SpoolIcon, ThermoIcon } from "./icons";
import { Card, CardHeader, Pill } from "./ui";

/** Normalize an 8-digit (#RRGGBBAA) or 6-digit hex; returns null if transparent/empty. */
function usableColor(color: unknown): string | null {
	if (typeof color !== "string") {
		return null;
	}
	const c = color.trim();
	if (!/^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(c)) {
		return null;
	}
	const hex = c.startsWith("#") ? c : `#${c}`;
	// alpha 00 -> empty slot
	if (hex.length === 9 && hex.slice(7).toLowerCase() === "00") {
		return null;
	}
	return hex;
}

function TrayChip({ entityId, label }: { entityId: string; label?: string }) {
	const tray = useEnt(entityId);
	const color = usableColor(tray?.attributes?.color);
	const type = (tray?.attributes?.type as string) || "";
	const name = isMissing(tray?.state) ? "—" : String(tray?.state);
	const active = tray?.attributes?.active === true;
	const remain = num(tray?.attributes?.remain);
	const empty = !color || name === "Empty";

	return (
		<div
			className={cn(
				"flex items-center gap-2.5 rounded-xl border bg-ink-850/60 px-2.5 py-2",
				active
					? "border-bambu-500/60 ring-1 ring-bambu-500/30"
					: "border-ink-800",
			)}
		>
			<span
				className={cn(
					"h-8 w-8 shrink-0 rounded-lg border border-white/10",
					empty && "border-ink-600 border-dashed bg-transparent",
				)}
				style={color ? { backgroundColor: color } : undefined}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-1.5">
					<span className="truncate font-medium text-ink-100 text-sm">
						{type || (empty ? "Empty" : name)}
					</span>
					{active && (
						<span className="rounded bg-bambu-600/30 px-1 font-bold text-[0.6rem] text-bambu-300 uppercase">
							Active
						</span>
					)}
				</div>
				<div className="flex items-center gap-1.5 text-[0.7rem] text-ink-400">
					<span className="truncate">{label ? label : name}</span>
					{remain !== null && remain >= 0 && (
						<span className="tabular-nums">· {remain}%</span>
					)}
				</div>
			</div>
		</div>
	);
}

export function AmsPanel({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const humidity = useEnt(entityIdForRole(printer, "ams_humidity"));
	const temperature = useEnt(entityIdForRole(printer, "ams_temperature"));
	const drying = useEnt(entityIdForRole(printer, "ams_drying"));

	const trays = printer.amsTrays;
	const spools = printer.externalSpools;
	if (trays.length === 0 && spools.length === 0) {
		return null;
	}

	const isDrying = drying?.state === "on";

	return (
		<Card className={className}>
			<CardHeader
				icon={<SpoolIcon />}
				title="Filament (AMS)"
				action={
					<div className="flex items-center gap-1.5">
						{humidity && !isMissing(humidity.state) && (
							<Pill tone="neutral">
								<DropIcon /> {Math.round(num(humidity.state) ?? 0)}%
							</Pill>
						)}
						{temperature && !isMissing(temperature.state) && (
							<Pill tone="neutral">
								<ThermoIcon /> {Math.round(num(temperature.state) ?? 0)}°
							</Pill>
						)}
						{isDrying && <Pill tone="warn">Drying</Pill>}
					</div>
				}
			/>
			<div className="grid grid-cols-1 gap-2 px-4 pb-4 sm:grid-cols-2">
				{trays.map((t, i) => (
					<TrayChip
						key={t.entityId}
						entityId={t.entityId}
						label={`Slot ${i + 1}`}
					/>
				))}
				{spools.map((id) => (
					<TrayChip key={id} entityId={id} label="External" />
				))}
			</div>
		</Card>
	);
}
