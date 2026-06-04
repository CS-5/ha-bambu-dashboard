/** Logical roles a Bambu entity can play in the dashboard. Discovery maps the
 *  integration's real entity_ids onto these roles so the UI never hard-codes IDs. */
export type EntityRole =
	// Print controls
	| "pause"
	| "resume"
	| "stop"
	// Environment controls
	| "chamber_light"
	| "printing_speed"
	| "airduct_mode"
	// Media
	| "camera"
	| "cover_image"
	| "pick_image"
	// Print job
	| "print_progress"
	| "current_layer"
	| "total_layers"
	| "remaining_time"
	| "print_status"
	| "current_stage"
	| "start_time"
	| "end_time"
	| "task_name"
	| "print_weight"
	| "print_length"
	| "printable_objects"
	| "skipped_objects"
	| "print_bed_type"
	// Machine / hardware
	| "total_usage"
	| "nozzle_size"
	| "nozzle_type"
	| "left_nozzle_size"
	| "left_nozzle_type"
	| "right_nozzle_size"
	| "right_nozzle_type"
	// Temperatures (single + dual-nozzle aware)
	| "nozzle_temp"
	| "nozzle_target"
	| "left_nozzle_temp"
	| "left_nozzle_target"
	| "right_nozzle_temp"
	| "right_nozzle_target"
	| "bed_temp"
	| "bed_target"
	| "chamber_temp"
	| "chamber_target"
	// Fans (read-only speeds)
	| "aux_fan_speed"
	| "chamber_fan_speed"
	| "cooling_fan_speed"
	| "heatbreak_fan_speed"
	// Diagnostics
	| "door"
	| "online"
	| "wifi_signal"
	| "hms_errors"
	| "print_error"
	| "firmware_update"
	| "timelapse"
	// AMS unit
	| "active_tray"
	| "ams_humidity"
	| "ams_temperature"
	| "ams_drying"
	| "ams_remaining_drying_time";

/** A registry-resolved entity for a given role. Only entities that are present
 *  (enabled) and not hidden in the HA entity registry are resolved here, which is
 *  exactly the control-gating rule: hide/disable in HA → no control rendered. */
export interface ResolvedEntity {
	entityId: string;
	hidden: boolean;
}

/** One AMS tray slot. */
export interface AmsTray {
	/** zero-based slot index within its AMS unit */
	index: number;
	entityId: string;
}

/** A discovered Bambu printer (one HA device). */
export interface Printer {
	/** HA device_id */
	id: string;
	/** Friendly device name, e.g. "X2D" */
	name: string;
	model: string | null;
	/** singleton roles -> resolved entity (present, enabled, not hidden) */
	roles: Partial<Record<EntityRole, ResolvedEntity>>;
	/** AMS tray slots, ordered */
	amsTrays: AmsTray[];
	/** external spool sensor entity_ids */
	externalSpools: string[];
}
