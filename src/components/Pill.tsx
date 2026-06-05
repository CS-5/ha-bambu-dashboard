import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export type PillTone = "neutral" | "good" | "warn" | "bad" | "active";

const tones: Record<PillTone, string> = {
	neutral: "border-ink-700 bg-ink-850 text-ink-300",
	good: "border-bambu-700/50 bg-bambu-700/15 text-bambu-300",
	warn: "border-amber-700/50 bg-amber-700/15 text-amber-300",
	bad: "border-red-700/50 bg-red-700/15 text-red-300",
	active: "border-bambu-500/60 bg-bambu-500/20 text-bambu-300",
};

/** Small status pill, built on shadcn Badge. Becomes a button when `onClick`
 *  is provided (e.g. to open a details dialog). */
export function Pill({
	children,
	tone = "neutral",
	className,
	onClick,
	title,
}: {
	children: ReactNode;
	tone?: PillTone;
	className?: string;
	onClick?: () => void;
	title?: string;
}) {
	const classes = cn(
		"gap-1.5 px-2.5 py-1 text-[0.7rem]",
		tones[tone],
		onClick && "cursor-pointer transition hover:brightness-125",
		className,
	);
	if (onClick) {
		return (
			<Badge asChild className={classes}>
				<button type="button" onClick={onClick} title={title}>
					{children}
				</button>
			</Badge>
		);
	}
	return (
		<Badge title={title} className={classes}>
			{children}
		</Badge>
	);
}
