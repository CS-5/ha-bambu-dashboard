import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A labeled value tile (temperature, fan, etc.). */
export function Stat({
	icon,
	label,
	value,
	sub,
	accent,
	className,
}: {
	icon?: ReactNode;
	label: string;
	value: ReactNode;
	sub?: ReactNode;
	accent?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-0.5 rounded-xl border border-ink-800 bg-ink-850/60 px-3 py-2.5",
				className,
			)}
		>
			<div className="flex items-center gap-1.5 font-medium text-[0.7rem] text-ink-400 uppercase tracking-wide">
				{icon && <span className="text-sm">{icon}</span>}
				{label}
			</div>
			<div
				className={cn(
					"font-semibold text-xl tabular-nums leading-tight",
					accent ? "text-bambu-400" : "text-ink-100",
				)}
			>
				{value}
			</div>
			{sub != null && (
				<div className="text-[0.7rem] text-ink-400 tabular-nums">{sub}</div>
			)}
		</div>
	);
}
