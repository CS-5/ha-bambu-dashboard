import { Pause, Play, Square, X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { entityIdForRole } from "@/lib/gating";
import { pressButton, useCallService, useEnt } from "@/lib/ha";
import type { EntityRole, Printer } from "@/lib/types";

type Variant = "default" | "secondary" | "destructive";

function ActionButton({
	icon,
	label,
	variant,
	disabled,
	onClick,
}: {
	icon: ReactNode;
	label: string;
	variant: Variant;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			variant={variant}
			disabled={disabled}
			onClick={onClick}
			className="flex-1 text-sm"
		>
			{icon}
			{label}
		</Button>
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

	// Stopping is destructive, so it takes a deliberate two-step confirmation:
	// the transport row is replaced by an explicit "Cancel / Stop print" prompt
	// (which auto-dismisses after a few seconds).
	if (confirmStop && stop.id) {
		return (
			<div className="flex items-stretch gap-2.5">
				<ActionButton
					icon={<X />}
					label="Cancel"
					variant="secondary"
					onClick={() => setConfirmStop(false)}
				/>
				<ActionButton
					icon={<Square />}
					label="Stop print?"
					variant="destructive"
					disabled={!stop.available}
					onClick={() => {
						setConfirmStop(false);
						if (stop.id) {
							pressButton(call, stop.id);
						}
					}}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-stretch gap-2.5">
			{resume.id && (
				<ActionButton
					icon={<Play />}
					label="Resume"
					variant="default"
					disabled={!resume.available}
					onClick={() => resume.id && pressButton(call, resume.id)}
				/>
			)}
			{pause.id && (
				<ActionButton
					icon={<Pause />}
					label="Pause"
					variant="secondary"
					disabled={!pause.available}
					onClick={() => pause.id && pressButton(call, pause.id)}
				/>
			)}
			{stop.id && (
				<ActionButton
					icon={<Square />}
					label="Stop"
					variant="destructive"
					disabled={!stop.available}
					onClick={() => setConfirmStop(true)}
				/>
			)}
		</div>
	);
}
