import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { cn } from "@/lib/cn";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useHist } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";
import { ClockIcon } from "./icons";
import { Card, CardHeader } from "./ui";

type Point = [number, number]; // [ms, value]

interface HistResult {
	entityHistory: { s: string; lu: number; lc?: number }[];
	loading: boolean;
}

function toPoints(h: HistResult): Point[] {
	const pts: Point[] = [];
	for (const row of h.entityHistory ?? []) {
		const v = Number(row.s);
		if (!Number.isFinite(v)) {
			continue;
		}
		const tRaw = row.lu ?? row.lc ?? 0;
		const t = tRaw < 1e12 ? tRaw * 1000 : tRaw; // seconds -> ms
		pts.push([t, v]);
	}
	return pts.sort((a, b) => a[0] - b[0]);
}

/** Forward-fill merge of several named series into recharts rows keyed by time. */
function mergeSeries(series: { key: string; points: Point[] }[]) {
	const times = Array.from(
		new Set(series.flatMap((s) => s.points.map((p) => p[0]))),
	).sort((a, b) => a - b);
	const idx = series.map(() => 0);
	const last = series.map<number | null>(() => null);
	return times.map((t) => {
		const row: Record<string, number | null> = { t };
		series.forEach((s, i) => {
			while (idx[i] < s.points.length && s.points[idx[i]][0] <= t) {
				last[i] = s.points[idx[i]][1];
				idx[i]++;
			}
			row[s.key] = last[i];
		});
		return row;
	});
}

const WINDOWS = [
	{ label: "1h", hours: 1 },
	{ label: "6h", hours: 6 },
	{ label: "24h", hours: 24 },
];

function fmtTime(t: number) {
	return new Date(t).toLocaleTimeString([], {
		hour: "numeric",
		minute: "2-digit",
	});
}

const tooltipStyle = {
	background: "#0f151b",
	border: "1px solid #243140",
	borderRadius: 12,
	fontSize: 12,
} as const;

export default function HistoryChart({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const [hours, setHours] = useState(6);
	const opts = { hoursToShow: hours, forceNumeric: true };

	const dualNozzle = printerHasRole(printer, "left_nozzle_temp");
	const nozzleARole: EntityRole = dualNozzle
		? "left_nozzle_temp"
		: "nozzle_temp";

	// Fixed hook slots so the hook count is stable across printers.
	const nozzleA = useHist(
		entityIdForRole(printer, nozzleARole),
		opts,
	) as HistResult;
	const nozzleB = useHist(
		entityIdForRole(printer, "right_nozzle_temp"),
		opts,
	) as HistResult;
	const bed = useHist(entityIdForRole(printer, "bed_temp"), opts) as HistResult;
	const chamber = useHist(
		entityIdForRole(printer, "chamber_temp"),
		opts,
	) as HistResult;

	const config = useMemo(() => {
		const c: { key: string; label: string; color: string; hist: HistResult }[] =
			[];
		if (printerHasRole(printer, nozzleARole)) {
			c.push({
				key: "nozzleA",
				label: dualNozzle ? "Left Nozzle" : "Nozzle",
				color: "#34e07f",
				hist: nozzleA,
			});
		}
		if (printerHasRole(printer, "right_nozzle_temp")) {
			c.push({
				key: "nozzleB",
				label: "Right Nozzle",
				color: "#22d3ee",
				hist: nozzleB,
			});
		}
		if (printerHasRole(printer, "bed_temp")) {
			c.push({ key: "bed", label: "Bed", color: "#f59e0b", hist: bed });
		}
		if (printerHasRole(printer, "chamber_temp")) {
			c.push({
				key: "chamber",
				label: "Chamber",
				color: "#a78bfa",
				hist: chamber,
			});
		}
		return c;
	}, [printer, dualNozzle, nozzleARole, nozzleA, nozzleB, bed, chamber]);

	const data = useMemo(
		() =>
			mergeSeries(
				config.map((s) => ({ key: s.key, points: toPoints(s.hist) })),
			),
		[config],
	);
	const labelByKey = useMemo(
		() => Object.fromEntries(config.map((s) => [s.key, s.label])),
		[config],
	);

	const hasData = data.length > 1;
	const loading = config.some((s) => s.hist.loading);

	return (
		<Card className={className}>
			<CardHeader
				icon={<ClockIcon />}
				title="Temperature History"
				action={
					<Segmented
						value={String(hours)}
						onChange={(v) => setHours(Number(v))}
						options={WINDOWS.map((w) => ({
							value: String(w.hours),
							label: w.label,
						}))}
					/>
				}
			/>
			{/* legend */}
			<div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-1">
				{config.map((s) => (
					<span
						key={s.key}
						className="flex items-center gap-1.5 text-[0.7rem] text-ink-400"
					>
						<span
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: s.color }}
						/>
						{s.label}
					</span>
				))}
			</div>
			<div className="h-56 px-2 pb-3">
				{hasData ? (
					<ResponsiveContainer width="100%" height="100%">
						<LineChart
							data={data}
							margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
						>
							<CartesianGrid stroke="#1a242e" vertical={false} />
							<XAxis
								dataKey="t"
								type="number"
								domain={["dataMin", "dataMax"]}
								scale="time"
								tickFormatter={fmtTime}
								stroke="#7e93a8"
								fontSize={11}
								minTickGap={40}
							/>
							<YAxis
								stroke="#7e93a8"
								fontSize={11}
								width={40}
								unit="°"
								domain={[0, "auto"]}
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								labelFormatter={(t) => fmtTime(Number(t))}
								formatter={(value, name) => [
									`${Math.round(Number(value))}°`,
									labelByKey[String(name)] ?? String(name),
								]}
							/>
							{config.map((s) => (
								<Line
									key={s.key}
									type="monotone"
									dataKey={s.key}
									name={s.key}
									stroke={s.color}
									strokeWidth={2}
									dot={false}
									isAnimationActive={false}
									connectNulls
								/>
							))}
						</LineChart>
					</ResponsiveContainer>
				) : (
					<div className="flex h-full items-center justify-center text-ink-400 text-sm">
						{loading ? "Loading history…" : "No history yet"}
					</div>
				)}
			</div>
		</Card>
	);
}

function Segmented({
	value,
	onChange,
	options,
}: {
	value: string;
	onChange: (v: string) => void;
	options: { value: string; label: string }[];
}) {
	return (
		<div className="flex gap-0.5 rounded-lg border border-ink-800 bg-ink-850/60 p-0.5">
			{options.map((o) => (
				<button
					key={o.value}
					type="button"
					onClick={() => onChange(o.value)}
					className={cn(
						"rounded-md px-2 py-1 font-semibold text-[0.7rem] transition-colors",
						value === o.value
							? "bg-bambu-600/80 text-white"
							: "text-ink-400 hover:text-ink-200",
					)}
				>
					{o.label}
				</button>
			))}
		</div>
	);
}
