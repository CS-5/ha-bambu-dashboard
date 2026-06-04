import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A panel surface. */
export function Card({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-ink-800 bg-ink-900/80 shadow-black/20 shadow-lg backdrop-blur",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	icon,
	title,
	action,
}: {
	icon?: ReactNode;
	title: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
			<div className="flex items-center gap-2 text-ink-300">
				{icon && <span className="text-[1.05rem] text-ink-400">{icon}</span>}
				<h2 className="font-semibold text-xs uppercase tracking-wider">
					{title}
				</h2>
			</div>
			{action}
		</div>
	);
}

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

/** Small status pill. */
export function Pill({
	children,
	tone = "neutral",
	className,
}: {
	children: ReactNode;
	tone?: "neutral" | "good" | "warn" | "bad" | "active";
	className?: string;
}) {
	const tones: Record<string, string> = {
		neutral: "border-ink-700 bg-ink-850 text-ink-300",
		good: "border-bambu-700/50 bg-bambu-700/15 text-bambu-300",
		warn: "border-amber-700/50 bg-amber-700/15 text-amber-300",
		bad: "border-red-700/50 bg-red-700/15 text-red-300",
		active: "border-bambu-500/60 bg-bambu-500/20 text-bambu-300",
	};
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium text-[0.7rem]",
				tones[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
