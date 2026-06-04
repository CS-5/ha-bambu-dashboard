/** Shared formatting helpers for printer telemetry. All are defensive against
 *  `unavailable` / `unknown` / empty states coming from Home Assistant.
 *  Single-use formatters live next to their component instead of here. */

const UNKNOWN = ["unavailable", "unknown", "none", "", null, undefined];

export function isMissing(state: unknown): boolean {
	return UNKNOWN.includes(state as never);
}

/** Parse a numeric state, returning null if not a finite number. */
export function num(state: unknown): number | null {
	if (isMissing(state)) {
		return null;
	}
	const n = typeof state === "number" ? state : Number(state);
	return Number.isFinite(n) ? n : null;
}

/** Percent value 0–100 -> "62%". */
export function percent(state: unknown): string {
	const n = num(state);
	return n === null ? "—" : `${Math.round(n)}%`;
}

/** The ha-bambulab remaining_time sensor is in hours; render "2h 15m". */
export function durationFromHours(state: unknown): string {
	const hours = num(state);
	if (hours === null) {
		return "—";
	}
	const totalMinutes = Math.max(0, Math.round(hours * 60));
	const h = Math.floor(totalMinutes / 60);
	const m = totalMinutes % 60;
	if (h === 0) {
		return `${m}m`;
	}
	return `${h}h ${m.toString().padStart(2, "0")}m`;
}

/** snake_case / lower words -> "Title Case". */
export function titleCase(state: unknown): string {
	if (isMissing(state)) {
		return "—";
	}
	return String(state)
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Append a unit to a numeric state, or "—" if missing. */
export function withUnit(state: unknown, unit: string, digits = 0): string {
	const n = num(state);
	return n === null ? "—" : `${n.toFixed(digits)} ${unit}`;
}
