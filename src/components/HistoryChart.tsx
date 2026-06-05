import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardHeader } from "@/components/Card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useHist } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";

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
				color: "var(--chart-1)",
				hist: nozzleA,
			});
		}
		if (printerHasRole(printer, "right_nozzle_temp")) {
			c.push({
				key: "nozzleB",
				label: "Right Nozzle",
				color: "var(--chart-2)",
				hist: nozzleB,
			});
		}
		if (printerHasRole(printer, "bed_temp")) {
			c.push({ key: "bed", label: "Bed", color: "var(--chart-3)", hist: bed });
		}
		if (printerHasRole(printer, "chamber_temp")) {
			c.push({
				key: "chamber",
				label: "Chamber",
				color: "var(--chart-4)",
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

	const chartConfig = useMemo<ChartConfig>(() => {
		const cfg: ChartConfig = {};
		for (const s of config) {
			cfg[s.key] = { label: s.label, color: s.color };
		}
		return cfg;
	}, [config]);

	const hasData = data.length > 1;
	const loading = config.some((s) => s.hist.loading);

	return (
		<Card className={className}>
			<CardHeader
				icon={<Clock />}
				title="Temperature History"
				action={
					<ToggleGroup
						type="single"
						value={String(hours)}
						onValueChange={(v) => v && setHours(Number(v))}
						spacing={1}
						className="rounded-lg border border-ink-800 bg-ink-850/60 p-0.5"
					>
						{WINDOWS.map((w) => (
							<ToggleGroupItem
								key={w.hours}
								value={String(w.hours)}
								className="rounded-md px-2 py-1 font-semibold text-[0.7rem] text-ink-400 hover:text-ink-200 data-[state=on]:bg-bambu-600/80 data-[state=on]:text-white"
							>
								{w.label}
							</ToggleGroupItem>
						))}
					</ToggleGroup>
				}
			/>
			<div className="px-2 pb-3">
				{hasData ? (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-56 w-full"
					>
						<LineChart
							data={data}
							margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
						>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="t"
								type="number"
								domain={["dataMin", "dataMax"]}
								scale="time"
								tickFormatter={fmtTime}
								fontSize={11}
								minTickGap={40}
							/>
							<YAxis fontSize={11} width={40} unit="°" domain={[0, "auto"]} />
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(label) => fmtTime(Number(label))}
										formatter={(value, name, item) => (
											<>
												<span
													className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
													style={{ backgroundColor: item.color }}
												/>
												<span className="flex flex-1 justify-between gap-3 leading-none">
													<span className="text-muted-foreground">
														{chartConfig[String(name)]?.label ?? String(name)}
													</span>
													<span className="font-medium text-foreground tabular-nums">
														{Math.round(Number(value))}°
													</span>
												</span>
											</>
										)}
									/>
								}
							/>
							<ChartLegend
								verticalAlign="top"
								content={<ChartLegendContent />}
							/>
							{config.map((s) => (
								<Line
									key={s.key}
									type="monotone"
									dataKey={s.key}
									name={s.key}
									stroke={`var(--color-${s.key})`}
									strokeWidth={2}
									dot={false}
									isAnimationActive={false}
									connectNulls
								/>
							))}
						</LineChart>
					</ChartContainer>
				) : (
					<div className="flex h-56 items-center justify-center text-ink-400 text-sm">
						{loading ? "Loading history…" : "No history yet"}
					</div>
				)}
			</div>
		</Card>
	);
}
