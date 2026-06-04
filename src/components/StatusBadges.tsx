import { cn } from "@/lib/cn";
import { isMissing, num } from "@/lib/format";
import { entityIdForRole } from "@/lib/gating";
import { useEnt } from "@/lib/ha";
import type { Printer } from "@/lib/types";
import {
	AlertIcon,
	CameraIcon,
	DoorIcon,
	RefreshIcon,
	WifiIcon,
} from "./icons";
import { Pill } from "./ui";

/** Wi-Fi dBm -> coarse strength label. */
function wifiLabel(state: unknown): string {
	const dbm = num(state);
	if (dbm === null) {
		return "—";
	}
	if (dbm >= -50) {
		return "Excellent";
	}
	if (dbm >= -60) {
		return "Good";
	}
	if (dbm >= -70) {
		return "Fair";
	}
	return "Weak";
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
			<Pill key="door" tone={open ? "warn" : "neutral"}>
				<DoorIcon /> {open ? "Door Open" : "Closed"}
			</Pill>,
		);
	}

	if (hms?.state === "on") {
		pills.push(
			<Pill key="hms" tone="bad">
				<AlertIcon /> HMS Error
			</Pill>,
		);
	}

	if (printErr?.state === "on") {
		pills.push(
			<Pill key="perr" tone="bad">
				<AlertIcon /> Print Error
			</Pill>,
		);
	}

	if (timelapse?.state === "on") {
		pills.push(
			<Pill key="timelapse" tone="active">
				<CameraIcon /> Timelapse
			</Pill>,
		);
	}

	if (firmware?.state === "on") {
		pills.push(
			<Pill key="fw" tone="warn">
				<RefreshIcon /> Update
			</Pill>,
		);
	}

	if (wifi && !isMissing(wifi.state)) {
		pills.push(
			<Pill key="wifi" tone="neutral">
				<WifiIcon /> {wifiLabel(wifi.state)}
			</Pill>,
		);
	}

	if (pills.length === 0) {
		return null;
	}

	return <div className="flex flex-wrap items-center gap-2">{pills}</div>;
}
