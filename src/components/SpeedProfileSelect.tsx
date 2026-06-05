import { Gauge } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { titleCase } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { selectOption, useCallService, useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";

/** Print-speed profile segmented control (silent / standard / sport / ludicrous). */
export function SpeedProfileSelect({ printer }: { printer: Printer }) {
	const call = useCallService();
	const id = entityIdForRole(printer, "printing_speed");
	const select = useEnt(id);
	if (!id) {
		return null;
	}

	const options = (select?.attributes?.options as string[] | undefined) ?? [];
	const current = select?.state;
	const disabled = !select || select.state === "unavailable";

	return (
		<div className="flex flex-col gap-2 px-1 py-2">
			<span className="flex items-center gap-2.5 font-medium text-ink-200 text-sm">
				<span className="text-ink-400 text-lg">
					<Gauge />
				</span>
				Speed Profile
			</span>
			<ToggleGroup
				type="single"
				value={current}
				disabled={disabled}
				spacing={1}
				// ToggleGroup allows deselecting; ignore the empty value so the
				// active profile can't be toggled off.
				onValueChange={(v) => v && selectOption(call, id, v)}
				className="w-full rounded-xl border border-ink-800 bg-ink-850/60 p-1"
			>
				{options.map((opt) => (
					<ToggleGroupItem
						key={opt}
						value={opt}
						className="flex-1 rounded-lg px-1 py-1.5 font-semibold text-ink-300 text-xs hover:bg-ink-800 hover:text-ink-200 data-[state=on]:bg-bambu-600/80 data-[state=on]:text-white data-[state=on]:shadow"
					>
						{titleCase(opt)}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}
