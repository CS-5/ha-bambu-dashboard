import { cn } from "@/lib/cn";
import { isMissing } from "@/lib/format";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { ControlBar } from "./ControlBar";
import { LightToggle } from "./LightToggle";
import { ProgressRing } from "./ProgressRing";
import { SpeedProfileSelect } from "./SpeedProfileSelect";
import { Card } from "./ui";

/** The control cockpit: print job name, progress ring, transport controls
 *  (desktop), and environment controls. */
export function Cockpit({
	printer,
	className,
}: {
	printer: Printer;
	className?: string;
}) {
	const task = useEnt(entityIdForRole(printer, "task_name"));
	const taskName = !isMissing(task?.state) ? String(task?.state) : null;

	const hasControls =
		printerHasRole(printer, "pause") ||
		printerHasRole(printer, "resume") ||
		printerHasRole(printer, "stop");
	const hasEnv =
		printerHasRole(printer, "chamber_light") ||
		printerHasRole(printer, "printing_speed");

	return (
		<Card className={cn("flex flex-col", className)}>
			{taskName && (
				<div className="border-ink-800 border-b px-4 py-2.5">
					<p
						className="truncate font-medium text-ink-200 text-sm"
						title={taskName}
					>
						{taskName.replace(/\.gcode(\.3mf)?$/i, "").replace(/\+/g, " ")}
					</p>
				</div>
			)}

			<div className="flex flex-col items-center gap-5 px-4 py-5">
				<ProgressRing printer={printer} />
				{hasControls && (
					<div className="hidden w-full lg:block">
						<ControlBar printer={printer} />
					</div>
				)}
			</div>

			{hasEnv && (
				<div className="space-y-1 border-ink-800 border-t px-4 py-2">
					<LightToggle printer={printer} />
					<SpeedProfileSelect printer={printer} />
				</div>
			)}
		</Card>
	);
}
