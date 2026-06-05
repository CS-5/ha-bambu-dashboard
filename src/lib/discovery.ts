import type {
	DeviceRegistryEntry,
	EntityRegistryDisplayEntry,
} from "@hakit/core";
import {
	AMS_TRAY_RE,
	EXTERNAL_SPOOL_RE,
	matchRole,
	objectId,
} from "@/lib/roles";
import type { AmsTray, Printer, ResolvedEntity } from "@/lib/types";

const BAMBU_PLATFORM = "bambu_lab";

function isBambuDevice(
	device: DeviceRegistryEntry,
	deviceEntities: EntityRegistryDisplayEntry[],
): boolean {
	if (device.manufacturer && /bambu/i.test(device.manufacturer)) {
		return true;
	}
	return deviceEntities.some((e) => e.platform === BAMBU_PLATFORM);
}

function prettyName(device: DeviceRegistryEntry): string {
	return device.name_by_user || device.name || "Printer";
}

/** Build the Printer model for one device from its display-registry entities.
 *  Disabled entities never appear in the display registry, so a resolved role is
 *  inherently "enabled". `hidden` is carried through for control gating. */
function buildPrinter(
	device: DeviceRegistryEntry,
	entities: EntityRegistryDisplayEntry[],
): Printer {
	const roles: Printer["roles"] = {};
	const trays: AmsTray[] = [];
	const externalSpools: string[] = [];

	for (const e of entities) {
		const id = e.entity_id;
		const hidden = e.hidden === true;
		const oid = objectId(id);

		// AMS trays — keep ordered, skip hidden (gating).
		const trayMatch = oid.match(AMS_TRAY_RE);
		if (trayMatch) {
			if (!hidden) {
				const unit = Number(trayMatch[1]);
				const slot = Number(trayMatch[2]);
				trays.push({ index: unit * 100 + slot, entityId: id });
			}
			continue;
		}

		// External spools — skip hidden.
		if (EXTERNAL_SPOOL_RE.test(oid)) {
			if (!hidden) {
				externalSpools.push(id);
			}
			continue;
		}

		const role = matchRole(id);
		if (!role) {
			continue;
		}
		const resolved: ResolvedEntity = { entityId: id, hidden };
		const existing = roles[role];
		// Prefer a visible entity if two map to the same role.
		if (!existing || (existing.hidden && !hidden)) {
			roles[role] = resolved;
		}
	}

	trays.sort((a, b) => a.index - b.index);
	externalSpools.sort();

	return {
		id: device.id,
		name: prettyName(device),
		model: device.model,
		roles,
		amsTrays: trays,
		externalSpools,
	};
}

/** Discover all Bambu printers from the HA device + entity-display registries. */
export function discoverPrinters(
	devices: Record<string, DeviceRegistryEntry>,
	entitiesRegistryDisplay: Record<string, EntityRegistryDisplayEntry>,
): Printer[] {
	// Group display entries by device_id.
	const byDevice = new Map<string, EntityRegistryDisplayEntry[]>();
	for (const entry of Object.values(entitiesRegistryDisplay)) {
		if (!entry.device_id) {
			continue;
		}
		const list = byDevice.get(entry.device_id) ?? [];
		list.push(entry);
		byDevice.set(entry.device_id, list);
	}

	const printers: Printer[] = [];
	for (const device of Object.values(devices)) {
		const deviceEntities = byDevice.get(device.id) ?? [];
		if (deviceEntities.length === 0) {
			continue;
		}
		if (!isBambuDevice(device, deviceEntities)) {
			continue;
		}
		printers.push(buildPrinter(device, deviceEntities));
	}

	printers.sort((a, b) => a.name.localeCompare(b.name));
	return printers;
}
