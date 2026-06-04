import { cn } from "@/lib/cn";
import { entityIdForRole } from "@/lib/gating";
import { toggleLight, useCallService, useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { LightIcon } from "./icons";

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
					<LightIcon />
				</span>
				Chamber Light
			</span>
			<button
				type="button"
				role="switch"
				aria-checked={on}
				disabled={disabled}
				onClick={() => id && toggleLight(call, id)}
				className={cn(
					"relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-40",
					on ? "border-bambu-500 bg-bambu-600/70" : "border-ink-700 bg-ink-800",
				)}
			>
				<span
					className={cn(
						"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
						on ? "left-[1.45rem]" : "left-0.5",
					)}
				/>
			</button>
		</div>
	);
}
