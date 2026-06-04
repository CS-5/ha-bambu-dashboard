import type { EntityRole } from "./types";

/** A rule maps a logical role to (HA domain + entity_id suffix). The suffix is
 *  matched against the entity's object_id (entity_id minus its domain). When
 *  several rules match one entity, the LONGEST suffix wins — this disambiguates
 *  e.g. `left_nozzle_temperature` from `nozzle_temperature`, and
 *  `secondary_aux_fan` from `aux_fan`. Suffixes are anchored with a leading
 *  underscore so they only match on a token boundary. */
interface RoleRule {
	role: EntityRole;
	domain: string;
	suffix: string;
}

const ROLE_RULES: RoleRule[] = [
	// Print controls
	{ role: "pause", domain: "button", suffix: "_pause" },
	{ role: "resume", domain: "button", suffix: "_resume" },
	{ role: "stop", domain: "button", suffix: "_stop" },

	// Environment controls
	{ role: "chamber_light", domain: "light", suffix: "_chamber_light" },
	{ role: "printing_speed", domain: "select", suffix: "_printing_speed" },
	{ role: "airduct_mode", domain: "select", suffix: "_airduct_mode" },

	// Media
	{ role: "camera", domain: "camera", suffix: "_camera" },
	{ role: "cover_image", domain: "image", suffix: "_cover_image" },
	{ role: "pick_image", domain: "image", suffix: "_pick_image" },

	// Print job
	{ role: "print_progress", domain: "sensor", suffix: "_print_progress" },
	{ role: "current_layer", domain: "sensor", suffix: "_current_layer" },
	{ role: "total_layers", domain: "sensor", suffix: "_total_layer_count" },
	{ role: "remaining_time", domain: "sensor", suffix: "_remaining_time" },
	{ role: "print_status", domain: "sensor", suffix: "_print_status" },
	{ role: "current_stage", domain: "sensor", suffix: "_current_stage" },
	{ role: "start_time", domain: "sensor", suffix: "_start_time" },
	{ role: "end_time", domain: "sensor", suffix: "_end_time" },
	{ role: "task_name", domain: "sensor", suffix: "_task_name" },
	{ role: "print_weight", domain: "sensor", suffix: "_print_weight" },
	{ role: "print_length", domain: "sensor", suffix: "_print_length" },
	{ role: "printable_objects", domain: "sensor", suffix: "_printable_objects" },
	{ role: "skipped_objects", domain: "sensor", suffix: "_skipped_objects" },
	{ role: "print_bed_type", domain: "sensor", suffix: "_print_bed_type" },

	// Machine / hardware (dual-nozzle rules are longer so they win)
	{ role: "total_usage", domain: "sensor", suffix: "_total_usage" },
	{ role: "left_nozzle_size", domain: "sensor", suffix: "_left_nozzle_size" },
	{ role: "left_nozzle_type", domain: "sensor", suffix: "_left_nozzle_type" },
	{ role: "right_nozzle_size", domain: "sensor", suffix: "_right_nozzle_size" },
	{ role: "right_nozzle_type", domain: "sensor", suffix: "_right_nozzle_type" },
	{ role: "nozzle_size", domain: "sensor", suffix: "_nozzle_size" },
	{ role: "nozzle_type", domain: "sensor", suffix: "_nozzle_type" },

	// Temperatures — dual-nozzle rules are longer so they win over the plain ones.
	{
		role: "left_nozzle_temp",
		domain: "sensor",
		suffix: "_left_nozzle_temperature",
	},
	{
		role: "left_nozzle_target",
		domain: "sensor",
		suffix: "_left_nozzle_target_temperature",
	},
	{
		role: "right_nozzle_temp",
		domain: "sensor",
		suffix: "_right_nozzle_temperature",
	},
	{
		role: "right_nozzle_target",
		domain: "sensor",
		suffix: "_right_nozzle_target_temperature",
	},
	{ role: "nozzle_temp", domain: "sensor", suffix: "_nozzle_temperature" },
	{
		role: "nozzle_target",
		domain: "sensor",
		suffix: "_nozzle_target_temperature",
	},
	{ role: "bed_temp", domain: "sensor", suffix: "_bed_temperature" },
	{ role: "bed_target", domain: "sensor", suffix: "_bed_target_temperature" },
	{ role: "chamber_temp", domain: "sensor", suffix: "_chamber_temperature" },
	{
		role: "chamber_target",
		domain: "sensor",
		suffix: "_chamber_target_temperature",
	},

	// Fan speeds (read-only)
	{ role: "aux_fan_speed", domain: "sensor", suffix: "_aux_fan_speed" },
	{ role: "chamber_fan_speed", domain: "sensor", suffix: "_chamber_fan_speed" },
	{ role: "cooling_fan_speed", domain: "sensor", suffix: "_cooling_fan_speed" },
	{
		role: "heatbreak_fan_speed",
		domain: "sensor",
		suffix: "_heatbreak_fan_speed",
	},

	// Diagnostics
	{ role: "door", domain: "binary_sensor", suffix: "_door" },
	{ role: "online", domain: "binary_sensor", suffix: "_online" },
	{ role: "wifi_signal", domain: "sensor", suffix: "_wi_fi_signal" },
	{ role: "hms_errors", domain: "binary_sensor", suffix: "_hms_errors" },
	{ role: "print_error", domain: "binary_sensor", suffix: "_print_error" },
	{ role: "firmware_update", domain: "binary_sensor", suffix: "_firmware" },
	{ role: "timelapse", domain: "binary_sensor", suffix: "_timelapse" },

	// AMS unit (first AMS only for singleton roles; trays handled separately)
	{ role: "active_tray", domain: "sensor", suffix: "_active_tray" },
	{ role: "ams_humidity", domain: "sensor", suffix: "_ams_1_humidity" },
	{ role: "ams_temperature", domain: "sensor", suffix: "_ams_1_temperature" },
	{ role: "ams_drying", domain: "binary_sensor", suffix: "_ams_1_drying" },
	{
		role: "ams_remaining_drying_time",
		domain: "sensor",
		suffix: "_ams_1_remaining_drying_time",
	},
];

/** Rules pre-sorted longest-suffix-first for greedy most-specific matching. */
const ROLE_RULES_BY_SPECIFICITY = [...ROLE_RULES].sort(
	(a, b) => b.suffix.length - a.suffix.length,
);

/** entity_id -> object_id (strip the leading `domain.`). */
export function objectId(entityId: string): string {
	const dot = entityId.indexOf(".");
	return dot === -1 ? entityId : entityId.slice(dot + 1);
}

/** entity_id -> domain. */
function domainOf(entityId: string): string {
	const dot = entityId.indexOf(".");
	return dot === -1 ? "" : entityId.slice(0, dot);
}

/** Resolve the best role for an entity, or null if it plays no known role.
 *  `_ams_<n>_tray_<m>` (trays) and external spools are matched elsewhere. */
export function matchRole(entityId: string): EntityRole | null {
	const domain = domainOf(entityId);
	const oid = objectId(entityId);
	for (const rule of ROLE_RULES_BY_SPECIFICITY) {
		if (rule.domain === domain && oid.endsWith(rule.suffix)) {
			return rule.role;
		}
	}
	return null;
}

/** Matches AMS tray sensors: `<prefix>_ams_<unit>_tray_<slot>`. */
export const AMS_TRAY_RE = /_ams_(\d+)_tray_(\d+)$/;

/** Matches external spool sensors: `<prefix>_externalspool[N]_external_spool`. */
export const EXTERNAL_SPOOL_RE = /externalspool\d*_external_spool$/;
