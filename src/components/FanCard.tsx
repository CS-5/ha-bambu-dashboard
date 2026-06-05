import { Fan } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Stat } from "@/components/Stat";
import { percent } from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";

const FANS: Array<{ label: string; role: EntityRole }> = [
	{ label: "Part", role: "cooling_fan_speed" },
	{ label: "Aux", role: "aux_fan_speed" },
	{ label: "Chamber", role: "chamber_fan_speed" },
	{ label: "Heatbreak", role: "heatbreak_fan_speed" },
];

function FanTile({
	printer,
	label,
	role,
}: {
	printer: Printer;
	label: string;
	role: EntityRole;
}) {
	const fan = useEnt(entityIdForRole(printer, role));
	return <Stat icon={<Fan />} label={label} value={percent(fan?.state)} />;
}

/** Read-only fan speeds (monitoring scope). */
export function FanCard({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const fans = FANS.filter((f) => printerHasRole(printer, f.role));
	if (fans.length === 0) {
		return null;
	}

	return (
		<Card className={className}>
			<CardHeader icon={<Fan />} title="Fans" />
			<div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
				{fans.map((f) => (
					<FanTile
						key={f.role}
						printer={printer}
						label={f.label}
						role={f.role}
					/>
				))}
			</div>
		</Card>
	);
}
