import {
	durationFromHours,
	isMissing,
	titleCase,
	withUnit,
} from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";
import { ClockIcon, PrinterIcon } from "./icons";
import { Card, CardHeader, Stat } from "./ui";

function NozzleTile({
	printer,
	label,
	sizeRole,
	typeRole,
}: {
	printer: Printer;
	label: string;
	sizeRole: EntityRole;
	typeRole: EntityRole;
}) {
	const size = useEnt(entityIdForRole(printer, sizeRole));
	const type = useEnt(entityIdForRole(printer, typeRole));
	const sub = isMissing(type?.state) ? undefined : titleCase(type?.state);
	return (
		<Stat label={label} value={withUnit(size?.state, "mm", 1)} sub={sub} />
	);
}

/** Hardware + lifetime stats: nozzle(s) and total print time. */
export function MachineCard({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const total = useEnt(entityIdForRole(printer, "total_usage"));

	const dual =
		printerHasRole(printer, "left_nozzle_size") ||
		printerHasRole(printer, "left_nozzle_type");
	const showSingleNozzle =
		!dual &&
		(printerHasRole(printer, "nozzle_size") ||
			printerHasRole(printer, "nozzle_type"));
	const showLifetime = printerHasRole(printer, "total_usage");

	if (!dual && !showSingleNozzle && !showLifetime) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader icon={<PrinterIcon />} title="Machine" />
			<div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
				{dual ? (
					<>
						<NozzleTile
							printer={printer}
							label="Left Nozzle"
							sizeRole="left_nozzle_size"
							typeRole="left_nozzle_type"
						/>
						<NozzleTile
							printer={printer}
							label="Right Nozzle"
							sizeRole="right_nozzle_size"
							typeRole="right_nozzle_type"
						/>
					</>
				) : showSingleNozzle ? (
					<NozzleTile
						printer={printer}
						label="Nozzle"
						sizeRole="nozzle_size"
						typeRole="nozzle_type"
					/>
				) : null}
				{showLifetime && (
					<Stat
						icon={<ClockIcon />}
						label="Total Prints"
						value={durationFromHours(total?.state)}
					/>
				)}
			</div>
		</Card>
	);
}
