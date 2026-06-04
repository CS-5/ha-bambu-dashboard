import { cn } from "@/lib/cn";
import { titleCase } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { selectOption, useCallService, useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import { SpeedIcon } from "./icons";

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
					<SpeedIcon />
				</span>
				Speed Profile
			</span>
			<div className="flex w-full gap-1 rounded-xl border border-ink-800 bg-ink-850/60 p-1">
				{options.map((opt) => {
					const active = opt === current;
					return (
						<button
							key={opt}
							type="button"
							disabled={disabled}
							onClick={() => id && selectOption(call, id, opt)}
							className={cn(
								"flex-1 rounded-lg px-1 py-1.5 font-semibold text-xs transition-colors disabled:opacity-40",
								active
									? "bg-bambu-600/80 text-white shadow"
									: "text-ink-300 hover:bg-ink-800",
							)}
						>
							{titleCase(opt)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
