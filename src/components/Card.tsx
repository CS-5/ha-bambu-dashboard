import type { ComponentProps, ReactNode } from "react";
import {
	CardAction,
	CardTitle,
	Card as ShadcnCard,
	CardHeader as ShadcnCardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

/** A panel surface. Wraps shadcn Card with the dashboard's dark look and lets
 *  children own their own padding (shadcn's default py-6/gap-6 is dropped). */
export function Card({
	className,
	...props
}: ComponentProps<typeof ShadcnCard>) {
	return (
		<ShadcnCard
			className={cn(
				"gap-0 rounded-2xl border-ink-800 bg-ink-900/80 py-0 shadow-black/20 shadow-lg backdrop-blur",
				className,
			)}
			{...props}
		/>
	);
}

/** Compact card header: uppercase title with an optional leading icon and a
 *  trailing action slot. */
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
		<ShadcnCardHeader className="items-center px-4 pt-3.5 pb-2">
			<CardTitle className="flex items-center gap-2 font-semibold text-ink-300 text-xs uppercase tracking-wider">
				{icon && <span className="text-[1.05rem] text-ink-400">{icon}</span>}
				{title}
			</CardTitle>
			{action && <CardAction className="self-center">{action}</CardAction>}
		</ShadcnCardHeader>
	);
}
