import { Disc3, Layers } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Stat } from "@/components/Stat";
import { isMissing, num, titleCase, withUnit } from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt, useJoinHassUrl } from "@/lib/ha";
import type { Printer } from "@/lib/types";

/** ISO timestamp -> short local "Jun 4, 3:22 PM" (today omits the date). */
function timestampShort(state: unknown): string {
	if (isMissing(state)) {
		return "—";
	}
	const d = new Date(String(state));
	if (Number.isNaN(d.getTime())) {
		return "—";
	}
	const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	const isToday = d.toDateString() === new Date().toDateString();
	if (isToday) {
		return time;
	}
	const date = d.toLocaleDateString([], { month: "short", day: "numeric" });
	return `${date}, ${time}`;
}

/** Current print job: preview + filament usage, plate, objects, start time. */
export function JobCard({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const join = useJoinHassUrl();
	const weight = useEnt(entityIdForRole(printer, "print_weight"));
	const length = useEnt(entityIdForRole(printer, "print_length"));
	const plate = useEnt(entityIdForRole(printer, "print_bed_type"));
	const printable = useEnt(entityIdForRole(printer, "printable_objects"));
	const skipped = useEnt(entityIdForRole(printer, "skipped_objects"));
	const started = useEnt(entityIdForRole(printer, "start_time"));
	const cover = useEnt(entityIdForRole(printer, "cover_image"));

	const picture = cover?.attributes?.entity_picture as string | undefined;
	const stats: { label: string; value: string }[] = [];

	if (printerHasRole(printer, "print_weight")) {
		stats.push({ label: "Filament", value: withUnit(weight?.state, "g", 1) });
	}
	if (printerHasRole(printer, "print_length")) {
		stats.push({ label: "Length", value: withUnit(length?.state, "m", 2) });
	}
	if (printerHasRole(printer, "print_bed_type")) {
		stats.push({ label: "Plate", value: titleCase(plate?.state) });
	}
	if (printerHasRole(printer, "printable_objects")) {
		const total = num(printable?.state);
		const skip = num(skipped?.state);
		stats.push({
			label: "Objects",
			value:
				total === null
					? "—"
					: skip && skip > 0
						? `${total} (${skip} skipped)`
						: String(total),
		});
	}
	if (printerHasRole(printer, "start_time")) {
		stats.push({ label: "Started", value: timestampShort(started?.state) });
	}

	// Nothing to show (no preview and every stat missing/unknown).
	const anyStat = stats.some((s) => !isMissing(s.value) && s.value !== "—");
	if (!picture && !anyStat) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader icon={<Layers />} title="Print Job" />
			<div className="flex gap-3 px-4 pb-4">
				{picture ? (
					<img
						src={join(picture)}
						alt="Model preview"
						className="h-24 w-24 shrink-0 rounded-xl border border-ink-800 bg-ink-950 object-cover"
					/>
				) : (
					<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-ink-800 bg-ink-950 text-2xl text-ink-600">
						<Disc3 />
					</div>
				)}
				<div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
					{stats.map((s) => (
						<Stat key={s.label} label={s.label} value={s.value} />
					))}
				</div>
			</div>
		</Card>
	);
}
