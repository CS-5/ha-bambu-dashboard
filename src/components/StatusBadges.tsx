import {
	Camera,
	CircleCheck,
	DoorClosed,
	RefreshCw,
	TriangleAlert,
	Wifi,
} from "lucide-react";
import { useState } from "react";
import { Pill, type PillTone } from "@/components/Pill";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { isMissing, num } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";

type Entity = NonNullable<ReturnType<typeof useEnt>>;

/** Wi-Fi dBm -> coarse strength label + tone (green/amber/red by strength). */
function wifiStatus(state: unknown): { label: string; tone: PillTone } {
	const dbm = num(state);
	if (dbm === null) {
		return { label: "—", tone: "neutral" };
	}
	if (dbm >= -50) {
		return { label: "Excellent", tone: "good" };
	}
	if (dbm >= -60) {
		return { label: "Good", tone: "good" };
	}
	if (dbm >= -70) {
		return { label: "Fair", tone: "warn" };
	}
	return { label: "Weak", tone: "bad" };
}

// Noise attributes that aren't useful in the error dialog.
const SKIP_ATTRS = new Set([
	"device_class",
	"friendly_name",
	"icon",
	"attribution",
	"supported_features",
]);

function ErrorDetails({ entity, isErr }: { entity: Entity; isErr: boolean }) {
	const attrs = (entity.attributes ?? {}) as Record<string, unknown>;
	const rows = Object.entries(attrs).filter(([key]) => !SKIP_ATTRS.has(key));

	if (!isErr) {
		return (
			<div className="flex items-center gap-2 text-ink-300 text-sm">
				<CircleCheck className="text-bambu-400 text-base" />
				No active errors reported.
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<p className="text-ink-300 text-sm">
				An error is active, but Home Assistant reported no further details.
			</p>
		);
	}

	return (
		<dl className="space-y-2">
			{rows.map(([key, value]) => (
				<div
					key={key}
					className="rounded-lg border border-ink-800 bg-ink-850/60 px-3 py-2"
				>
					<dt className="text-[0.7rem] text-ink-400 uppercase tracking-wide">
						{key}
					</dt>
					<dd className="break-words text-ink-100 text-sm">
						{typeof value === "object" ? JSON.stringify(value) : String(value)}
					</dd>
				</div>
			))}
		</dl>
	);
}

/** An always-visible diagnostic pill (HMS / print error): green when healthy,
 *  red when a problem is active. Tapping opens a dialog with the error info. */
function ErrorPill({
	label,
	title,
	entity,
}: {
	label: string;
	title: string;
	entity: Entity;
}) {
	const [open, setOpen] = useState(false);
	const unknown = isMissing(entity.state);
	const isErr = entity.state === "on";
	const tone: PillTone = unknown ? "neutral" : isErr ? "bad" : "good";
	const status = unknown ? "—" : isErr ? "Error" : "OK";

	return (
		<>
			<Pill
				tone={tone}
				onClick={() => setOpen(true)}
				title={`${title} — details`}
			>
				{isErr ? <TriangleAlert /> : <CircleCheck />} {label} {status}
			</Pill>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-md border-ink-800 bg-ink-900">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
					</DialogHeader>
					<div className="max-h-[70vh] overflow-y-auto">
						<ErrorDetails entity={entity} isErr={isErr} />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

/** Compact diagnostic pills: online, door, errors, wifi, firmware, timelapse. */
export function StatusBadges({ printer }: { printer: Printer }) {
	const online = useEnt(entityIdForRole(printer, "online"));
	const door = useEnt(entityIdForRole(printer, "door"));
	const hms = useEnt(entityIdForRole(printer, "hms_errors"));
	const printErr = useEnt(entityIdForRole(printer, "print_error"));
	const wifi = useEnt(entityIdForRole(printer, "wifi_signal"));
	const firmware = useEnt(entityIdForRole(printer, "firmware_update"));
	const timelapse = useEnt(entityIdForRole(printer, "timelapse"));

	const pills: React.ReactNode[] = [];

	if (online) {
		const isOnline = online.state === "on";
		pills.push(
			<Pill key="online" tone={isOnline ? "good" : "bad"}>
				<span
					className={cn(
						"h-1.5 w-1.5 rounded-full",
						isOnline ? "bg-bambu-400" : "bg-red-400",
					)}
				/>
				{isOnline ? "Online" : "Offline"}
			</Pill>,
		);
	}

	if (door) {
		const open = door.state === "on";
		pills.push(
			<Pill key="door" tone={open ? "warn" : "good"}>
				<DoorClosed /> {open ? "Door Open" : "Closed"}
			</Pill>,
		);
	}

	if (hms) {
		pills.push(
			<ErrorPill key="hms" label="HMS" title="HMS Errors" entity={hms} />,
		);
	}

	if (printErr) {
		pills.push(
			<ErrorPill
				key="perr"
				label="Print"
				title="Print Error"
				entity={printErr}
			/>,
		);
	}

	if (timelapse?.state === "on") {
		pills.push(
			<Pill key="timelapse" tone="active">
				<Camera /> Timelapse
			</Pill>,
		);
	}

	if (firmware?.state === "on") {
		pills.push(
			<Pill key="fw" tone="warn">
				<RefreshCw /> Update
			</Pill>,
		);
	}

	if (wifi && !isMissing(wifi.state)) {
		const { label, tone } = wifiStatus(wifi.state);
		pills.push(
			<Pill key="wifi" tone={tone} title={`${num(wifi.state)} dBm`}>
				<Wifi /> {label}
			</Pill>,
		);
	}

	if (pills.length === 0) {
		return null;
	}

	return <div className="flex flex-wrap items-center gap-2">{pills}</div>;
}
