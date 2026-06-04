import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { entityIdForRole } from "@/lib/gating";
import { pressButton, useCallService, useEnt } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";
import { PauseIcon, PlayIcon, StopIcon } from "./icons";

type Tone = "primary" | "neutral" | "danger";

function ActionButton({
	icon,
	label,
	tone,
	disabled,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	tone: Tone;
	disabled?: boolean;
	onClick: () => void;
}) {
	const tones: Record<Tone, string> = {
		primary:
			"border-bambu-500/40 bg-bambu-600/20 text-bambu-300 hover:bg-bambu-600/30 active:bg-bambu-600/40",
		neutral:
			"border-ink-700 bg-ink-850 text-ink-200 hover:bg-ink-800 active:bg-ink-700",
		danger:
			"border-red-600/40 bg-red-600/15 text-red-300 hover:bg-red-600/25 active:bg-red-600/35",
	};
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"flex h-14 flex-1 items-center justify-center gap-2 rounded-xl border font-semibold text-sm transition-colors",
				"disabled:cursor-not-allowed disabled:border-ink-800 disabled:bg-ink-900 disabled:text-ink-600",
				tones[tone],
			)}
		>
			<span className="text-lg">{icon}</span>
			{label}
		</button>
	);
}

function useAvailable(printer: Printer, role: EntityRole) {
	const id = entityIdForRole(printer, role);
	const entity = useEnt(id);
	return { id, available: !!id && entity?.state !== "unavailable" };
}

/** Pause / Resume / Stop transport controls. Each button only renders if its
 *  button entity is present + visible, and is disabled when HA reports it
 *  unavailable (e.g. Resume while a print is running). */
export function ControlBar({ printer }: { printer: Printer }) {
	const call = useCallService();
	const pause = useAvailable(printer, "pause");
	const resume = useAvailable(printer, "resume");
	const stop = useAvailable(printer, "stop");

	const [confirmStop, setConfirmStop] = useState(false);
	useEffect(() => {
		if (!confirmStop) {
			return;
		}
		const t = setTimeout(() => setConfirmStop(false), 3500);
		return () => clearTimeout(t);
	}, [confirmStop]);

	if (!pause.id && !resume.id && !stop.id) {
		return null;
	}

	const handleStop = () => {
		if (!confirmStop) {
			setConfirmStop(true);
			return;
		}
		setConfirmStop(false);
		if (stop.id) {
			pressButton(call, stop.id);
		}
	};

	return (
		<div className="flex items-stretch gap-2.5">
			{pause.id && (
				<ActionButton
					icon={<PauseIcon />}
					label="Pause"
					tone="neutral"
					disabled={!pause.available}
					onClick={() => pause.id && pressButton(call, pause.id)}
				/>
			)}
			{resume.id && (
				<ActionButton
					icon={<PlayIcon />}
					label="Resume"
					tone="primary"
					disabled={!resume.available}
					onClick={() => resume.id && pressButton(call, resume.id)}
				/>
			)}
			{stop.id && (
				<ActionButton
					icon={<StopIcon />}
					label={confirmStop ? "Confirm Stop" : "Stop"}
					tone="danger"
					disabled={!stop.available}
					onClick={handleStop}
				/>
			)}
		</div>
	);
}
