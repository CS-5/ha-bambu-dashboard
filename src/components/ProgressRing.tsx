import { cn } from "@/lib/cn";
import {
	durationFromHours,
	isMissing,
	num,
	percent,
	titleCase,
} from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { ClockIcon, LayersIcon } from "./icons";

const SIZE = 168;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/** Clamp a 0–100 progress number for the ring. */
function clampPct(state: unknown): number {
	const n = num(state);
	if (n === null) {
		return 0;
	}
	return Math.min(100, Math.max(0, n));
}

/** Clock estimate for completion given remaining hours ("" if none). */
function etaFromHours(state: unknown): string {
	const hours = num(state);
	if (hours === null || hours <= 0) {
		return "";
	}
	const eta = new Date(Date.now() + hours * 3600_000);
	return eta.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Layer "x / y". */
function layers(current: unknown, total: unknown): string {
	const c = num(current);
	const t = num(total);
	if (c === null && t === null) {
		return "—";
	}
	return `${c ?? "—"} / ${t ?? "—"}`;
}

/** Central print-progress ring with layer + time-remaining readouts. */
export function ProgressRing({ printer }: { printer: Printer }) {
	const progress = useEnt(entityIdForRole(printer, "print_progress"));
	const curLayer = useEnt(entityIdForRole(printer, "current_layer"));
	const totLayers = useEnt(entityIdForRole(printer, "total_layers"));
	const remaining = useEnt(entityIdForRole(printer, "remaining_time"));
	const status = useEnt(entityIdForRole(printer, "print_status"));
	const stage = useEnt(entityIdForRole(printer, "current_stage"));

	const pct = clampPct(progress?.state);
	const offset = CIRC * (1 - pct / 100);

	const statusLabel = !isMissing(status?.state)
		? titleCase(status?.state)
		: !isMissing(stage?.state)
			? titleCase(stage?.state)
			: "Idle";
	const isPrinting = status?.state === "running" || stage?.state === "printing";

	// The live "what's happening" string (heating, calibrating, printing…).
	const stageLabel =
		stage && !isMissing(stage.state) ? titleCase(stage.state) : null;

	const remainingStr = durationFromHours(remaining?.state);
	const eta = etaFromHours(remaining?.state);

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="relative" style={{ width: SIZE, height: SIZE }}>
				<svg width={SIZE} height={SIZE} className="-rotate-90">
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						fill="none"
						stroke="currentColor"
						strokeWidth={STROKE}
						className="text-ink-800"
					/>
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						fill="none"
						stroke="currentColor"
						strokeWidth={STROKE}
						strokeLinecap="round"
						strokeDasharray={CIRC}
						strokeDashoffset={offset}
						className="text-bambu-500 transition-[stroke-dashoffset] duration-700 ease-out"
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="font-bold text-4xl text-ink-100 tabular-nums">
						{progress && !isMissing(progress.state)
							? percent(progress.state)
							: "—"}
					</span>
					<span
						className={cn(
							"mt-0.5 font-semibold text-xs uppercase tracking-wider",
							isPrinting ? "text-bambu-400" : "text-ink-400",
						)}
					>
						{statusLabel}
					</span>
				</div>
			</div>

			{stageLabel && (
				<div
					className={cn(
						"flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-center font-medium text-xs",
						isPrinting
							? "border-bambu-500/40 bg-bambu-500/15 text-bambu-300"
							: "border-ink-700 bg-ink-850 text-ink-300",
					)}
				>
					<span
						className={cn(
							"h-1.5 w-1.5 shrink-0 rounded-full",
							isPrinting ? "animate-pulse-ring bg-bambu-400" : "bg-ink-600",
						)}
					/>
					<span className="truncate">{stageLabel}</span>
				</div>
			)}

			<div className="flex w-full items-stretch justify-center gap-3">
				{(printerHasRole(printer, "current_layer") ||
					printerHasRole(printer, "total_layers")) && (
					<Readout
						icon={<LayersIcon />}
						label="Layer"
						value={layers(curLayer?.state, totLayers?.state)}
					/>
				)}
				{printerHasRole(printer, "remaining_time") && (
					<Readout
						icon={<ClockIcon />}
						label="Remaining"
						value={remainingStr}
						sub={eta ? `~${eta}` : undefined}
					/>
				)}
			</div>
		</div>
	);
}

function Readout({
	icon,
	label,
	value,
	sub,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
}) {
	return (
		<div className="flex min-w-[6.5rem] flex-col items-center rounded-xl border border-ink-800 bg-ink-850/60 px-3 py-2">
			<span className="flex items-center gap-1 font-medium text-[0.7rem] text-ink-400 uppercase tracking-wide">
				<span className="text-sm">{icon}</span>
				{label}
			</span>
			<span className="font-semibold text-base text-ink-100 tabular-nums">
				{value}
			</span>
			{sub && <span className="text-[0.7rem] text-ink-400">{sub}</span>}
		</div>
	);
}
