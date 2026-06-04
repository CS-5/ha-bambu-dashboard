import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useCam } from "@/lib/ha";
import { CameraIcon } from "./icons";

/** Live camera with HLS (hls.js / native) and an MJPEG + poster fallback. */
export function CameraHero({
	entityId,
	className,
}: {
	entityId: string;
	className?: string;
}) {
	const camera = useCam(entityId, { stream: true, poster: true });
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);

	const streamUrl = camera.stream.url;
	const useMjpeg = camera.mjpeg.shouldRenderMJPEG;
	const poster = camera.poster.url;
	const offline = camera.state === "unavailable";

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !streamUrl || useMjpeg) {
			return;
		}
		setPlaying(false);

		// Safari / iOS play HLS natively.
		if (video.canPlayType("application/vnd.apple.mpegurl")) {
			video.src = streamUrl;
			const onLoaded = () => setPlaying(true);
			video.addEventListener("loadeddata", onLoaded);
			void video.play().catch(() => undefined);
			return () => video.removeEventListener("loadeddata", onLoaded);
		}

		if (Hls.isSupported()) {
			const hls = new Hls({ lowLatencyMode: true, backBufferLength: 10 });
			hls.loadSource(streamUrl);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				setPlaying(true);
				void video.play().catch(() => undefined);
			});
			return () => hls.destroy();
		}
	}, [streamUrl, useMjpeg]);

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
					src={camera.mjpeg.url}
					alt="Printer camera"
					className="h-full w-full object-cover"
				/>
			) : streamUrl ? (
				<video
					ref={videoRef}
					poster={poster}
					muted
					playsInline
					autoPlay
					className="h-full w-full object-cover"
				/>
			) : poster ? (
				<img
					src={poster}
					alt="Printer camera"
					className="h-full w-full object-cover"
				/>
			) : (
				<Placeholder label="Connecting camera…" />
			)}

			{/* top gradient + live indicator */}
			{!offline && (
				<div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end bg-gradient-to-b from-black/50 to-transparent p-3">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 font-semibold text-[0.7rem] text-white backdrop-blur">
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								playing || useMjpeg
									? "animate-pulse-ring bg-red-500"
									: "bg-ink-400",
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
			<CameraIcon className="text-4xl" />
			<span className="text-ink-400 text-sm">{label}</span>
		</div>
	);
}
