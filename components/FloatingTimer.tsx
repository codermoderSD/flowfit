"use client";

import { useTimer } from "@/contexts/TimerContext";
import { usePathname, useRouter } from "next/navigation";
import { Timer, Play, Pause } from "lucide-react";

export default function FloatingTimer() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    workoutState,
    timeRemaining,
    handlePauseWorkout,
    handleResumeWorkout,
  } = useTimer();

  // Don't show on home page or auth pages
  if (pathname === "/" || pathname?.startsWith("/auth")) {
    return null;
  }

  const isWorkoutPhase =
    workoutState.workoutPhaseStartTime !== null &&
    workoutState.currentActivity !== null;
  const isBreakPhase =
    workoutState.workoutPhaseStartTime !== null &&
    workoutState.currentActivity === null;
  const isWaitingPhase =
    workoutState.nextWorkoutTime !== null &&
    !workoutState.workoutPhaseStartTime;

  // Only show if there's an active timer
  if (!isWorkoutPhase && !isBreakPhase && !isWaitingPhase) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (isWorkoutPhase) return "from-red-500 to-orange-500";
    if (isBreakPhase) return "from-teal-400 to-teal-600";
    return "from-blue-400 to-blue-600";
  };

  const getTimerLabel = () => {
    if (isWorkoutPhase) return workoutState.currentActivity || "Workout Time";
    if (isBreakPhase) return "Break Time";
    return "Focus Mode";
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 cursor-pointer"
      onClick={() => router.push("/")}
    >
      <div
        className={`bg-gradient-to-br ${getTimerColor()} rounded-2xl shadow-2xl p-4 min-w-[160px] hover:scale-105 transition-transform duration-200`}
      >
        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-white" />
          <div className="flex-1">
            <div className="text-xs text-white/80 font-medium uppercase tracking-wider">
              {getTimerLabel()}
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {formatTime(timeRemaining)}
            </div>
          </div>
          {isWorkoutPhase && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (workoutState.isPaused) {
                  handleResumeWorkout();
                } else {
                  handlePauseWorkout();
                }
              }}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              {workoutState.isPaused ? (
                <Play className="w-4 h-4 text-white" />
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
