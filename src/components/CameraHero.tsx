import { Camera, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useCam, useConnection } from "@/lib/ha";
import { useLiveVideo } from "@/lib/video";

/** Append a cache-busting token (only after a manual refresh) so the poster /
 *  MJPEG image re-fetches instead of reusing a stale connection. */
function bust(url: string, nonce: number): string {
	if (nonce === 0) {
		return url;
	}
	return `${url}${url.includes("?") ? "&" : "?"}_=${nonce}`;
}

/** Live camera: WebRTC when the camera advertises it (matching HA, sub-second
 *  latency), with hardened HLS + MJPEG + poster fallbacks. */
export function CameraHero({
	entityId,
	className,
}: {
	entityId: string;
	className?: string;
}) {
	const camera = useCam(entityId, { stream: true, poster: true });
	const connection = useConnection();
	const videoRef = useRef<HTMLVideoElement>(null);
	// Bumped by the refresh button to force-reconnect the stream.
	const [nonce, setNonce] = useState(0);

	const streamUrl = camera.stream.url;
	const useMjpeg = camera.mjpeg.shouldRenderMJPEG;
	const poster = camera.poster.url;
	const offline = camera.state === "unavailable";
	const canWebRtc = (camera.frontend_stream_types ?? []).includes("web_rtc");
	const useVideo = !offline && !useMjpeg && (canWebRtc || !!streamUrl);

	const status = useLiveVideo({
		videoRef,
		connection,
		entityId,
		streamUrl,
		canWebRtc,
		enabled: useVideo,
		nonce,
	});

	const live = useMjpeg || status === "playing";

	return (
		<div
			className={cn(
				"relative aspect-video w-full overflow-hidden rounded-2xl border border-ink-800 bg-black",
				className,
			)}
		>
			{offline ? (
				<Placeholder label="Camera offline" />
			) : useMjpeg && camera.mjpeg.url ? (
				<img
					src={bust(camera.mjpeg.url, nonce)}
					alt="Printer camera"
					className="h-full w-full object-cover"
				/>
			) : useVideo ? (
				<>
					<video
						ref={videoRef}
						poster={poster ? bust(poster, nonce) : undefined}
						muted
						playsInline
						autoPlay
						className="h-full w-full object-cover"
					/>
					{status !== "playing" && (
						<div className="absolute inset-0">
							<Placeholder
								label={
									status === "error" ? "Reconnecting…" : "Connecting camera…"
								}
							/>
						</div>
					)}
				</>
			) : poster ? (
				<img
					src={bust(poster, nonce)}
					alt="Printer camera"
					className="h-full w-full object-cover"
				/>
			) : (
				<Placeholder label="Connecting camera…" />
			)}

			{/* top gradient + refresh + live indicator */}
			{!offline && (
				<div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setNonce((n) => n + 1)}
						aria-label="Refresh camera stream"
						title="Refresh stream"
						className="pointer-events-auto size-7 rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 hover:text-white"
					>
						<RefreshCw />
					</Button>
					<span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 font-semibold text-[0.7rem] text-white backdrop-blur">
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								live ? "animate-pulse-ring bg-red-500" : "bg-ink-400",
							)}
						/>
						LIVE
					</span>
				</div>
			)}
		</div>
	);
}

function Placeholder({ label }: { label: string }) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-600">
			<Camera className="text-4xl" />
			<span className="text-ink-400 text-sm">{label}</span>
		</div>
	);
}
