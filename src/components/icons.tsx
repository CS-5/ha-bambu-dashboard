import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Stroke-style base for line icons. */
function Line({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.8}
			strokeLinecap="round"
			strokeLinejoin="round"
			width="1em"
			height="1em"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

/** Solid base for the primary transport controls. */
function Solid({ children, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="currentColor"
			width="1em"
			height="1em"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

export const PauseIcon = (p: IconProps) => (
	<Solid {...p}>
		<rect x="6" y="5" width="4" height="14" rx="1.2" />
		<rect x="14" y="5" width="4" height="14" rx="1.2" />
	</Solid>
);

export const PlayIcon = (p: IconProps) => (
	<Solid {...p}>
		<path d="M8 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 8 5.5Z" />
	</Solid>
);

export const StopIcon = (p: IconProps) => (
	<Solid {...p}>
		<rect x="6" y="6" width="12" height="12" rx="2" />
	</Solid>
);

export const LightIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M9 18h6" />
		<path d="M10 21h4" />
		<path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
	</Line>
);

export const SpeedIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M4.5 16a8 8 0 1 1 15 0" />
		<path d="M12 14l3.5-3.5" />
		<circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none" />
	</Line>
);

export const ThermoIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0Z" />
		<path d="M12 9v5.5" />
	</Line>
);

// A real fan (mdi:fan) — four blades around a hub, not "wind".
export const FanIcon = (p: IconProps) => (
	<Solid {...p}>
		<path d="M12 11a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1m.5-9C17 2 17.11 5.57 14.75 6.75c-.99.49-1.43 1.54-1.62 2.47.48.2.9.51 1.22.91C18.05 8.13 22.03 8.92 22.03 12.5c0 4.5-3.57 4.6-4.75 2.23-.5-.99-1.56-1.43-2.49-1.62-.2.48-.51.89-.91 1.23 1.99 3.69 1.2 7.66-2.38 7.66-4.5 0-4.59-3.57-2.23-4.75.99-.49 1.44-1.55 1.62-2.49-.48-.2-.89-.5-1.22-.9C6.97 15.85 3 15.07 3 11.5 3 7 6.56 6.89 7.74 9.26c.5.99 1.55 1.43 2.48 1.62.19-.48.51-.91.92-1.23C8.14 5.96 8.92 2 12.5 2Z" />
	</Solid>
);

export const DoorIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M6 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
		<path d="M4 21h16" />
		<circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
	</Line>
);

export const WifiIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M5 12.5a10 10 0 0 1 14 0" />
		<path d="M8 15.5a6 6 0 0 1 8 0" />
		<path d="M11 18.5a2 2 0 0 1 2 0" />
	</Line>
);

export const CameraIcon = (p: IconProps) => (
	<Line {...p}>
		<rect x="3" y="6.5" width="18" height="12" rx="2.5" />
		<circle cx="12" cy="12.5" r="3" />
		<path d="M8.5 6.5l1.2-2h4.6l1.2 2" />
	</Line>
);

export const SpoolIcon = (p: IconProps) => (
	<Line {...p}>
		<circle cx="12" cy="12" r="8" />
		<circle cx="12" cy="12" r="2.4" />
		<path d="M12 4v2.4M12 17.6V20M4 12h2.4M17.6 12H20" />
	</Line>
);

export const AlertIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M12 4.5 2.8 20a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 4.5Z" />
		<path d="M12 10v4.5" />
		<circle cx="12" cy="17.6" r="0.9" fill="currentColor" stroke="none" />
	</Line>
);

export const PrinterIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M5 9.5 12 5l7 4.5v5L12 19l-7-4.5v-5Z" />
		<path d="M12 5v14M5 9.5 12 14l7-4.5" />
	</Line>
);

export const ChevronDownIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="m6 9 6 6 6-6" />
	</Line>
);

export const RefreshIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M20 11a8 8 0 1 0-.6 4" />
		<path d="M20 4v5h-5" />
	</Line>
);

export const LayersIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="m12 3 9 5-9 5-9-5 9-5Z" />
		<path d="m3 13 9 5 9-5" />
	</Line>
);

export const ClockIcon = (p: IconProps) => (
	<Line {...p}>
		<circle cx="12" cy="12" r="8.5" />
		<path d="M12 7.5V12l3 2" />
	</Line>
);

export const DropIcon = (p: IconProps) => (
	<Line {...p}>
		<path d="M12 3.5c3 3.8 5 6.6 5 9.3a5 5 0 1 1-10 0c0-2.7 2-5.5 5-9.3Z" />
	</Line>
);
