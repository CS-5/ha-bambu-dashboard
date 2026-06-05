import { Box } from "lucide-react";

/** Full-screen state shown while connecting to HA or when nothing is found. */
export function ConnectionScreen({
	message,
	detail,
}: {
	message: string;
	detail?: string;
}) {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
			<div className="flex h-16 w-16 animate-pulse-ring items-center justify-center rounded-2xl border border-ink-800 bg-ink-900 text-3xl text-bambu-400">
				<Box />
			</div>
			<div>
				<p className="font-medium text-base text-ink-100">{message}</p>
				{detail && <p className="mt-1 text-ink-400 text-sm">{detail}</p>}
			</div>
		</div>
	);
}
