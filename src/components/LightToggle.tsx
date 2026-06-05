import { Lightbulb } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { entityIdForRole } from "@/lib/gating";
import { toggleLight, useCallService, useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";

/** Chamber light on/off row (entity is onoff-only on the H2D). */
export function LightToggle({ printer }: { printer: Printer }) {
	const call = useCallService();
	const id = entityIdForRole(printer, "chamber_light");
	const light = useEnt(id);
	if (!id) {
		return null;
	}

	const on = light?.state === "on";
	const disabled = !light || light.state === "unavailable";

	return (
		<div className="flex items-center justify-between gap-3 px-1 py-2">
			<span className="flex items-center gap-2.5 font-medium text-ink-200 text-sm">
				<span className={cn("text-lg", on ? "text-bambu-400" : "text-ink-400")}>
					<Lightbulb />
				</span>
				Chamber Light
			</span>
			<Switch
				checked={on}
				disabled={disabled}
				onCheckedChange={() => toggleLight(call, id)}
				aria-label="Chamber light"
			/>
		</div>
	);
}
