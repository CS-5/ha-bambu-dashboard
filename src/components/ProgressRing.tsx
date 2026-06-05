import { Clock, Layers } from "lucide-react";
import { Cell, Label, Pie, PieChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
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

/** Central print-progress ring (a donut chart with a centered readout) plus
 *  layer + time-remaining tiles. */
export function ProgressRing({ printer }: { printer: Printer }) {
	const progress = useEnt(entityIdForRole(printer, "print_progress"));
	const curLayer = useEnt(entityIdForRole(printer, "current_layer"));
	const totLayers = useEnt(entityIdForRole(printer, "total_layers"));
	const remaining = useEnt(entityIdForRole(printer, "remaining_time"));
	const status = useEnt(entityIdForRole(printer, "print_status"));
	const stage = useEnt(entityIdForRole(printer, "current_stage"));

	const pct = clampPct(progress?.state);
	const pctText =
		progress && !isMissing(progress.state) ? percent(progress.state) : "—";
	const ringData = [
		{ name: "done", value: pct },
		{ name: "rest", value: 100 - pct },
	];

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
			<ChartContainer
				config={{ done: { label: "Progress" } }}
				className="mx-auto aspect-square h-[168px]"
			>
				<PieChart>
					<Pie
						data={ringData}
						dataKey="value"
						nameKey="name"
						innerRadius={66}
						outerRadius={82}
						startAngle={90}
						endAngle={-270}
						cornerRadius={8}
						strokeWidth={0}
						isAnimationActive={false}
					>
						<Cell fill="var(--color-bambu-500)" />
						<Cell fill="var(--color-ink-800)" />
						<Label
							content={({ viewBox }) => {
								if (!viewBox || !("cx" in viewBox)) {
									return null;
								}
								const { cx, cy } = viewBox;
								return (
									<text
										x={cx}
										y={cy}
										textAnchor="middle"
										dominantBaseline="middle"
									>
										<tspan
											x={cx}
											y={cy}
											className="fill-ink-100 font-bold text-4xl tabular-nums"
										>
											{pctText}
										</tspan>
										<tspan
											x={cx}
											y={(cy ?? 0) + 26}
											className={cn(
												"font-semibold text-xs uppercase tracking-wider",
												isPrinting ? "fill-bambu-400" : "fill-ink-400",
											)}
										>
											{statusLabel}
										</tspan>
									</text>
								);
							}}
						/>
					</Pie>
				</PieChart>
			</ChartContainer>

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
						icon={<Layers />}
						label="Layer"
						value={layers(curLayer?.state, totLayers?.state)}
					/>
				)}
				{printerHasRole(printer, "remaining_time") && (
					<Readout
						icon={<Clock />}
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
