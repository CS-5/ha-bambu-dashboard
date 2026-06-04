import type { EntityRole, Printer } from "./types";

/** The single control-gating rule: a role is usable only if its entity was
 *  resolved (present + enabled in the registry) AND is not hidden. Hiding or
 *  disabling the entity in Home Assistant removes the control from the UI. */
export function entityIdForRole(
	printer: Printer,
	role: EntityRole,
): string | null {
	const resolved = printer.roles[role];
	if (!resolved || resolved.hidden) {
		return null;
	}
	return resolved.entityId;
}

/** Whether a role should render at all. */
export function printerHasRole(printer: Printer, role: EntityRole): boolean {
	return entityIdForRole(printer, role) !== null;
}
