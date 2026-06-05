import Hls from "hls.js";
import { type RefObject, useEffect, useState } from "react";
import type { HaConnection } from "@/lib/ha";

/** A running stream we can tear down. */
interface StreamHandle {
	stop: () => void;
}

export type VideoStatus = "connecting" | "playing" | "error";

/* ------------------------------------------------------------------ WebRTC */

interface WebRtcClientConfig {
	configuration?: RTCConfiguration;
	/** go2rtc asks for a data channel to be opened before the offer. */
	dataChannel?: string;
	/** Some providers want the offer SDP to already contain all ICE candidates. */
	getCandidatesUpfront?: boolean;
}

type OfferMessage =
	| { type: "id"; session_id: string }
	| { type: "answer"; answer: string }
	| { type: "candidate"; candidate: string | RTCIceCandidateInit }
	| { type: "error"; code?: string; message?: string };

/** Wait until ICE gathering finishes (or a short timeout) and return the SDP
 *  with all candidates embedded — needed by providers that don't trickle. */
function gatherCompleteSdp(pc: RTCPeerConnection): Promise<string> {
	return new Promise((resolve) => {
		const finish = () => {
			clearTimeout(timer);
			pc.removeEventListener("icegatheringstatechange", check);
			resolve(pc.localDescription?.sdp ?? "");
		};
		const check = () => {
			if (pc.iceGatheringState === "complete") {
				finish();
			}
		};
		if (pc.iceGatheringState === "complete") {
			resolve(pc.localDescription?.sdp ?? "");
			return;
		}
		const timer = setTimeout(finish, 2000);
		pc.addEventListener("icegatheringstatechange", check);
	});
}

/** Negotiate a WebRTC stream the same way the Home Assistant frontend does
 *  (`camera/webrtc/offer` signaling over the websocket), attaching the remote
 *  track to `video`. Sub-second latency vs HLS. Reports "playing"/"error". */
export async function startWebRtcStream(
	connection: HaConnection,
	entityId: string,
	video: HTMLVideoElement,
	onState: (state: "playing" | "error") => void,
): Promise<StreamHandle> {
	let stopped = false;
	let unsub: (() => void) | null = null;
	let pc: RTCPeerConnection | null = null;
	let sessionId: string | undefined;
	let remoteSet = false;
	const pendingLocal: RTCIceCandidate[] = [];
	const pendingRemote: RTCIceCandidateInit[] = [];

	const stop = () => {
		stopped = true;
		unsub?.();
		unsub = null;
		if (pc) {
			pc.ontrack = null;
			pc.onicecandidate = null;
			pc.onconnectionstatechange = null;
			pc.close();
			pc = null;
		}
		if (video.srcObject) {
			video.srcObject = null;
		}
	};

	// ICE servers from HA (go2rtc/STUN). Older cores lack this command — tolerate.
	let cfg: WebRtcClientConfig = {};
	try {
		cfg = await connection.sendMessagePromise<WebRtcClientConfig>({
			type: "camera/webrtc/get_client_config",
			entity_id: entityId,
		});
	} catch {
		cfg = {};
	}
	if (stopped) {
		return { stop };
	}

	pc = new RTCPeerConnection(cfg.configuration ?? { iceServers: [] });
	if (cfg.dataChannel) {
		pc.createDataChannel(cfg.dataChannel);
	}
	pc.addTransceiver("video", { direction: "recvonly" });
	pc.addTransceiver("audio", { direction: "recvonly" });

	pc.ontrack = (event) => {
		if (video.srcObject !== event.streams[0]) {
			video.srcObject = event.streams[0];
		}
	};

	const sendLocalCandidate = (candidate: RTCIceCandidate | null) => {
		if (!sessionId) {
			return;
		}
		connection
			.sendMessagePromise({
				type: "camera/webrtc/candidate",
				entity_id: entityId,
				session_id: sessionId,
				candidate: candidate ? candidate.toJSON() : { candidate: "" },
			})
			.catch(() => undefined);
	};

	pc.onicecandidate = (event) => {
		if (!sessionId) {
			if (event.candidate) {
				pendingLocal.push(event.candidate);
			}
			return;
		}
		sendLocalCandidate(event.candidate);
	};

	pc.onconnectionstatechange = () => {
		if (!pc || stopped) {
			return;
		}
		const state = pc.connectionState;
		if (state === "connected") {
			void video.play().catch(() => undefined);
			onState("playing");
		} else if (
			state === "failed" ||
			state === "disconnected" ||
			state === "closed"
		) {
			onState("error");
		}
	};

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	if (stopped) {
		return { stop };
	}
	const offerSdp = cfg.getCandidatesUpfront
		? await gatherCompleteSdp(pc)
		: (offer.sdp ?? "");
	if (stopped) {
		return { stop };
	}

	const handle = (msg: OfferMessage) => {
		if (stopped || !pc) {
			return;
		}
		if (msg.type === "id") {
			sessionId = msg.session_id;
			for (const candidate of pendingLocal) {
				sendLocalCandidate(candidate);
			}
			pendingLocal.length = 0;
		} else if (msg.type === "answer") {
			void pc
				.setRemoteDescription({ type: "answer", sdp: msg.answer })
				.then(() => {
					remoteSet = true;
					for (const candidate of pendingRemote) {
						pc?.addIceCandidate(candidate).catch(() => undefined);
					}
					pendingRemote.length = 0;
				})
				.catch(() => onState("error"));
		} else if (msg.type === "candidate") {
			const init =
				typeof msg.candidate === "string"
					? { candidate: msg.candidate }
					: msg.candidate;
			if (remoteSet) {
				pc.addIceCandidate(init).catch(() => undefined);
			} else {
				pendingRemote.push(init);
			}
		} else if (msg.type === "error") {
			onState("error");
		}
	};

	unsub = await connection.subscribeMessage<OfferMessage>(handle, {
		type: "camera/webrtc/offer",
		entity_id: entityId,
		offer: offerSdp,
	});
	if (stopped) {
		unsub?.();
		unsub = null;
	}

	return { stop };
}

/* --------------------------------------------------------------------- HLS */

/** Play an HLS stream into `video` with the resilience the bare hls.js setup
 *  lacked: fatal network/media-error recovery and a stall watchdog that
 *  reloads when playback freezes. HA serves standard (not low-latency) HLS,
 *  so `lowLatencyMode` stays OFF — enabling it makes hls.js chase a live edge
 *  that doesn't exist and stall constantly. */
export function startHlsStream(
	url: string,
	video: HTMLVideoElement,
	onState: (state: "playing" | "error") => void,
): StreamHandle {
	// Safari / iOS play HLS natively.
	if (video.canPlayType("application/vnd.apple.mpegurl")) {
		const onLoaded = () => onState("playing");
		const onError = () => onState("error");
		video.src = url;
		video.addEventListener("loadeddata", onLoaded);
		video.addEventListener("error", onError);
		void video.play().catch(() => undefined);
		return {
			stop: () => {
				video.removeEventListener("loadeddata", onLoaded);
				video.removeEventListener("error", onError);
				video.removeAttribute("src");
				video.load();
			},
		};
	}

	if (!Hls.isSupported()) {
		onState("error");
		return { stop: () => undefined };
	}

	let stopped = false;
	let stalls = 0;
	let lastTime = -1;

	const hls = new Hls({
		lowLatencyMode: false,
		backBufferLength: 10,
		liveSyncDurationCount: 3,
		liveMaxLatencyDurationCount: 10,
		maxLiveSyncPlaybackRate: 1.5,
		fragLoadingMaxRetry: 6,
		levelLoadingMaxRetry: 6,
		manifestLoadingMaxRetry: 6,
	});

	hls.on(Hls.Events.MANIFEST_PARSED, () => {
		onState("playing");
		void video.play().catch(() => undefined);
	});

	hls.on(Hls.Events.ERROR, (_event, data) => {
		if (!data.fatal) {
			return;
		}
		if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
			hls.startLoad();
		} else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
			hls.recoverMediaError();
		} else {
			onState("error");
		}
	});

	hls.loadSource(url);
	hls.attachMedia(video);

	// If currentTime stops advancing while we should be live, nudge the loader;
	// after repeated stalls, surface an error so the caller can reconnect.
	const watchdog = setInterval(() => {
		if (stopped || video.paused) {
			return;
		}
		if (video.currentTime === lastTime) {
			stalls += 1;
			if (stalls >= 3) {
				stalls = 0;
				hls.stopLoad();
				hls.startLoad();
			}
		} else {
			stalls = 0;
			lastTime = video.currentTime;
		}
	}, 2000);

	return {
		stop: () => {
			stopped = true;
			clearInterval(watchdog);
			hls.destroy();
		},
	};
}

/* ------------------------------------------------------------- orchestrator */

interface LiveVideoOptions {
	videoRef: RefObject<HTMLVideoElement | null>;
	connection: HaConnection | null;
	entityId: string;
	streamUrl: string | undefined;
	/** Camera advertises `web_rtc` in its frontend stream types. */
	canWebRtc: boolean;
	/** False when the camera is offline or rendering via MJPEG. */
	enabled: boolean;
	/** Bumped to force a manual reconnect. */
	nonce: number;
}

/** Drives the <video> element: prefers WebRTC (like HA), falls back to hardened
 *  HLS, and reconnects when the tab regains focus (backgrounded streams freeze).
 *  Returns the current playback status for overlay/LIVE-dot rendering. */
export function useLiveVideo(opts: LiveVideoOptions): VideoStatus {
	const {
		videoRef,
		connection,
		entityId,
		streamUrl,
		canWebRtc,
		enabled,
		nonce,
	} = opts;
	const [status, setStatus] = useState<VideoStatus>("connecting");

	// Reconnect whenever the tab becomes visible again.
	const [focusTick, setFocusTick] = useState(0);
	useEffect(() => {
		const onVisible = () => {
			if (document.visibilityState === "visible") {
				setFocusTick((t) => t + 1);
			}
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, []);

	// `nonce` (manual refresh) and `focusTick` (tab refocus) are intentional
	// reconnect triggers — they're in the dep list to re-run the effect, not
	// read inside it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reconnect triggers
	useEffect(() => {
		const video = videoRef.current;
		if (!enabled || !video) {
			return;
		}

		let active = true;
		let current: StreamHandle | null = null;
		let fellBack = false;
		setStatus("connecting");

		const report = (state: "playing" | "error") => {
			if (active) {
				setStatus(state);
			}
		};

		const startHls = () => {
			if (!active || fellBack) {
				return;
			}
			fellBack = true;
			current?.stop();
			current = streamUrl ? startHlsStream(streamUrl, video, report) : null;
			if (!streamUrl) {
				report("error");
			}
		};

		if (canWebRtc && connection) {
			startWebRtcStream(connection, entityId, video, (state) => {
				if (!active) {
					return;
				}
				// WebRTC dropped — fall back to HLS rather than going dark.
				if (state === "error") {
					startHls();
				} else {
					report(state);
				}
			})
				.then((handle) => {
					if (!active || fellBack) {
						handle.stop();
						return;
					}
					current = handle;
				})
				.catch(() => startHls());
		} else if (streamUrl) {
			current = startHlsStream(streamUrl, video, report);
		} else {
			report("error");
		}

		return () => {
			active = false;
			current?.stop();
		};
	}, [
		videoRef,
		connection,
		entityId,
		streamUrl,
		canWebRtc,
		enabled,
		nonce,
		focusTick,
	]);

	return status;
}
