import { Thermometer } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Stat } from "@/components/Stat";
import { num } from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";

/** Round to a temperature display (whole degrees). */
function temp(state: unknown): string {
	const n = num(state);
	return n === null ? "—" : `${Math.round(n)}°`;
}

function TempTile({
	printer,
	label,
	current,
	target,
}: {
	printer: Printer;
	label: string;
	current: EntityRole;
	target?: EntityRole;
}) {
	const cur = useEnt(entityIdForRole(printer, current));
	const tgt = useEnt(target ? entityIdForRole(printer, target) : null);
	const targetNum = num(tgt?.state);
	const sub =
		targetNum && targetNum > 0 ? `target ${Math.round(targetNum)}°` : undefined;
	const active = !!(targetNum && targetNum > 0);

	return (
		<Stat
			icon={<Thermometer />}
			label={label}
			value={temp(cur?.state)}
			sub={sub}
			accent={active}
		/>
	);
}

/** Temperature tiles, dual-nozzle aware (H2D shows Left/Right). */
export function TempCard({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const hasDualNozzle =
		printerHasRole(printer, "left_nozzle_temp") ||
		printerHasRole(printer, "right_nozzle_temp");

	const tiles: Array<{
		label: string;
		current: EntityRole;
		target?: EntityRole;
	}> = [];

	if (hasDualNozzle) {
		if (printerHasRole(printer, "left_nozzle_temp")) {
			tiles.push({
				label: "Left Nozzle",
				current: "left_nozzle_temp",
				target: "left_nozzle_target",
			});
		}
		if (printerHasRole(printer, "right_nozzle_temp")) {
			tiles.push({
				label: "Right Nozzle",
				current: "right_nozzle_temp",
				target: "right_nozzle_target",
			});
		}
	} else if (printerHasRole(printer, "nozzle_temp")) {
		tiles.push({
			label: "Nozzle",
			current: "nozzle_temp",
			target: "nozzle_target",
		});
	}

	if (printerHasRole(printer, "bed_temp")) {
		tiles.push({ label: "Bed", current: "bed_temp", target: "bed_target" });
	}
	if (printerHasRole(printer, "chamber_temp")) {
		tiles.push({
			label: "Chamber",
			current: "chamber_temp",
			target: "chamber_target",
		});
	}

	if (tiles.length === 0) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader icon={<Thermometer />} title="Temperatures" />
			<div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-2">
				{tiles.map((t) => (
					<TempTile key={t.current} printer={printer} {...t} />
				))}
			</div>
		</Card>
	);
}
