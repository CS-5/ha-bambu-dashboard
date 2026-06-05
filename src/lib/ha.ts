import {
	type CameraEntityExtended,
	type HistoryOptions,
	useCamera,
	useEntity,
	useHass,
	useHistory,
} from "@hakit/core";

/** hakit types entity ids as a generated literal union. This dashboard resolves
 *  ids dynamically from the registry, so we cast strings to the expected param
 *  types. Runtime behavior is unchanged. */
type EntityNameParam = Parameters<typeof useEntity>[0];
type CameraNameParam = Parameters<typeof useCamera>[0];

/** Sentinel used when a role is unresolved/hidden, so hooks can still run
 *  unconditionally. hakit returns null for an unknown id (returnNullIfNotFound). */
const NONE_ENTITY = "sensor.__bambu_dashboard_none__";

/** Reactive entity that returns null when missing or when id is null/hidden. */
export function useEnt(
	entityId: string | null | undefined,
	historyOptions?: HistoryOptions,
) {
	return useEntity((entityId || NONE_ENTITY) as EntityNameParam, {
		returnNullIfNotFound: true,
		historyOptions,
	});
}

export function useCam(
	entityId: string,
	options?: Parameters<typeof useCamera>[1],
): CameraEntityExtended {
	return useCamera(entityId as CameraNameParam, options);
}

export function useHist(
	entityId: string | null | undefined,
	options?: HistoryOptions,
) {
	return useHistory((entityId || NONE_ENTITY) as EntityNameParam, options);
}

/** The websocket service caller from the hakit store. */
export type CallService = ReturnType<typeof useCallService>;
export function useCallService() {
	return useHass((s) => s.helpers.callService);
}

/** Raw home-assistant-js-websocket connection (for low-level commands like
 *  WebRTC signaling that the hakit hooks don't expose). Null until connected. */
export function useConnection() {
	return useHass((s) => s.connection);
}
export type HaConnection = NonNullable<ReturnType<typeof useConnection>>;

/** Whether HA is connected & ready (drives the offline overlay). */
export function useReady() {
	return useHass((s) => s.ready && s.connectionStatus === "connected");
}

/** Joins a relative HA path (e.g. an entity_picture) to the configured hassUrl,
 *  so proxied images resolve correctly in dev (cross-origin) and in production. */
export function useJoinHassUrl() {
	return useHass((s) => s.helpers.joinHassUrl);
}

/* ---- thin service action helpers (kept domain-correct, ids cast loosely) ---- */

export function pressButton(call: CallService, entityId: string) {
	call({ domain: "button", service: "press", target: { entity_id: entityId } });
}

export function toggleLight(call: CallService, entityId: string) {
	call({ domain: "light", service: "toggle", target: { entity_id: entityId } });
}

export function selectOption(
	call: CallService,
	entityId: string,
	option: string,
) {
	call({
		domain: "select",
		service: "select_option",
		target: { entity_id: entityId },
		serviceData: { option } as never,
	});
}
