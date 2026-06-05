import { lazy, Suspense } from "react";
import { AmsPanel } from "@/components/AmsPanel";
import { CameraHero } from "@/components/CameraHero";
import { Card } from "@/components/Card";
import { Cockpit } from "@/components/Cockpit";
import { ConnectionScreen } from "@/components/ConnectionScreen";
import { ControlBar } from "@/components/ControlBar";
import { FanCard } from "@/components/FanCard";
import { JobCard } from "@/components/JobCard";
import { MachineCard } from "@/components/MachineCard";
import { PrinterSwitcher } from "@/components/PrinterSwitcher";
import { StatusBadges } from "@/components/StatusBadges";
import { TempCard } from "@/components/TempCard";
import { usePrinters } from "@/context/printers";
import { entityIdForRole, printerHasRole } from "@/lib/gating";
import { useReady } from "@/lib/ha";

// recharts is heavy; load the history chart only when the dashboard mounts.
const HistoryChart = lazy(() => import("@/components/HistoryChart"));

export default function App() {
	const ready = useReady();
	const { selected } = usePrinters();

	if (!selected) {
		return (
			<ConnectionScreen
				message={ready ? "No Bambu printers found" : "Loading…"}
				detail={
					ready
						? "Set up the Bambu Lab integration in Home Assistant, then reload."
						: undefined
				}
			/>
		);
	}

	const cameraId = entityIdForRole(selected, "camera");
	const hasControls =
		printerHasRole(selected, "pause") ||
		printerHasRole(selected, "resume") ||
		printerHasRole(selected, "stop");

	return (
		<div className="min-h-dvh bg-ink-950">
			<div className="mx-auto max-w-6xl space-y-4 px-3 py-4 pb-28 sm:px-4 lg:pb-6">
				<header className="flex flex-wrap items-center justify-between gap-3">
					<PrinterSwitcher />
					<StatusBadges printer={selected} />
				</header>

				{/* Two independent columns on desktop so each packs vertically with no
				    shared-row gaps. On mobile the wrappers collapse (display:contents)
				    and `order-*` interleaves the cards into a sensible single column:
				    camera, cockpit, job, temps, fans, machine, ams, history. */}
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start">
					<div className="contents lg:flex lg:min-w-0 lg:flex-[2] lg:flex-col lg:gap-4">
						{cameraId && <CameraHero entityId={cameraId} className="order-1" />}
						<JobCard printer={selected} className="order-3" />
						<Suspense
							fallback={
								<Card className="order-8 flex h-56 items-center justify-center text-ink-400 text-sm">
									Loading charts…
								</Card>
							}
						>
							<HistoryChart printer={selected} className="order-8" />
						</Suspense>
					</div>

					<div className="contents lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:gap-4">
						<Cockpit printer={selected} className="order-2" />
						<TempCard printer={selected} className="order-4" />
						<FanCard printer={selected} className="order-5" />
						<MachineCard printer={selected} className="order-6" />
						<AmsPanel printer={selected} className="order-7" />
					</div>
				</div>
			</div>

			{/* Sticky transport controls on mobile, where the cockpit bar is hidden. */}
			{hasControls && (
				<div
					className="fixed inset-x-0 bottom-0 z-30 border-ink-800 border-t bg-ink-950/95 px-3 py-3 backdrop-blur lg:hidden"
					style={{
						paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
					}}
				>
					<div className="mx-auto max-w-6xl">
						<ControlBar printer={selected} />
					</div>
				</div>
			)}
		</div>
	);
}
