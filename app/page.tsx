"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/contexts/TimerContext";
import TimeBlockOverlay from "@/components/TimeBlockOverlay";
import {
  notificationUnsupported,
  checkPermissionStateAndAct,
  registerAndSubscribe,
} from "@/lib/push-notifications";
import {
  Activity,
  Settings,
  FileText,
  Dumbbell,
  Pause,
  Play,
  Calendar,
  SkipForward,
  Flame,
  TrendingUp,
  Target,
  LogOut,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MobileBottomNav from "@/components/mobile-bottom-nav";

const MOTIVATIONAL_QUOTES = [
  "Movement is medicine for creating change.",
  "Your body is your most priceless possession. Take care of it.",
  "The only bad workout is the one that didn't happen.",
  "Take care of your body. It&apos;s the only place you have to live.",
  "Physical fitness is the first requisite of happiness.",
  "A healthy outside starts from the inside.",
];

const HEALTH_WARNINGS = [
  "Not moving daily increases the risk of heart disease by 35%.",
  "Sitting for long periods can reduce life expectancy.",
  "Regular movement reduces stress and improves mental health.",
  "Physical inactivity is linked to increased risk of chronic diseases.",
  "Just 5 minutes of movement can boost your energy and focus.",
];

const WORK_FOCUS_MESSAGES = [
  "Stay focused. Deep work creates extraordinary results.",
  "Eliminate distractions. Your best work happens in flow state.",
  "One task at a time. Multitasking is a myth.",
  "Take a deep breath. Calm mind, productive work.",
  "You&apos;re doing great. Keep the momentum going.",
  "Focus on progress, not perfection.",
  "This is your time to create something amazing.",
  "Block out the noise. Your work matters.",
  "Stay present. Quality over quantity.",
  "You&apos;ve got this. Trust the process.",
];

interface ActivityLog {
  activity_name: string;
  calories: number;
  body_area: string | null;
  completed_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  // Use global timer context
  const {
    user,
    settings,
    workoutState,
    timeRemaining,
    isWithinWorkHours,
    startNewWorkout,
    handleDoneWorkout,
    handleSkipWorkout,
    handlePauseWorkout,
    handleResumeWorkout,
    handleSkipWorkTimer,
    // removed unused helpers that caused lint errors in this file
  } = useTimer();

  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");
  const [healthWarning, setHealthWarning] = useState<string>("");
  const [workFocusMessage, setWorkFocusMessage] = useState<string>("");
  const [pushSubscription, setPushSubscription] =
    useState<PushSubscription | null>(null);
  const [notificationsUnsupported, setNotificationsUnsupported] =
    useState(false);

  // Avoid rendering mobile-only nav during server render to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    loadPageData();

    // Check if web push is supported
    const unsupported = notificationUnsupported();
    setNotificationsUnsupported(unsupported);

    if (unsupported) {
      console.warn("Web push notifications are not supported in this browser");
      return;
    }

    // Auto-register if permission already granted
    checkPermissionStateAndAct(setPushSubscription);
  }, []);

  const loadPageData = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUserName(
      user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );

    // Load today's logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logsData } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString());

    if (logsData) {
      setTodayLogs(logsData);
    }
    // Set logs (messages will be set from client-only effect to avoid
    // SSR/CSR markup mismatch due to Math.random)
  };

  // Only set random messages on the client to avoid hydration mismatches
  useEffect(() => {
    setMotivationalQuote(
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ]
    );
    setHealthWarning(
      HEALTH_WARNINGS[Math.floor(Math.random() * HEALTH_WARNINGS.length)]
    );
    setWorkFocusMessage(
      WORK_FOCUS_MESSAGES[
        Math.floor(Math.random() * WORK_FOCUS_MESSAGES.length)
      ]
    );
  }, []);

  // Wrapper functions that reload logs after done/skip
  const handleDone = async () => {
    await handleDoneWorkout();
    loadPageData(); // Reload today's logs and quotes
  };

  const handleSkip = async () => {
    handleSkipWorkout();
    loadPageData(); // Reload quotes
  };

  // notificationPermission and some helpers removed — they are unused in this file

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getDailyStats = () => {
    const workoutsCompleted = todayLogs.length;
    const caloriesBurned = todayLogs.reduce(
      (sum, log) => sum + (log.calories || 0),
      0
    );

    const bodyAreas = new Set<string>();
    todayLogs.forEach((log) => {
      if (log.body_area) bodyAreas.add(log.body_area);
    });

    return {
      workoutsCompleted,
      caloriesBurned,
      bodyAreas: Array.from(bodyAreas),
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const requestNotificationPermission = async () => {
    if (notificationsUnsupported) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn&apos;t support web push notifications",
      });
      return;
    }

    try {
      // Register service worker and subscribe to push notifications
      await registerAndSubscribe((subscription) => {
        if (subscription) {
          setPushSubscription(subscription);
          // notification permission recorded by browser; state handled elsewhere

          toast({
            title: "Notifications enabled!",
            description:
              "You&apos;ll now receive activity reminders even when FlowFit is in the background",
          });

          console.log("Push subscription successful:", subscription.toJSON());
        } else {
          toast({
            title: "Subscription failed",
            description: "Could not subscribe to push notifications",
          });
        }
      });
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
      });
    }
  };

  const isWorkoutPhase =
    workoutState.workoutPhaseStartTime !== null &&
    workoutState.currentActivity !== null;
  const isBreakPhase =
    workoutState.workoutPhaseStartTime !== null &&
    workoutState.currentActivity === null;
  const isWaitingPhase =
    workoutState.nextWorkoutTime !== null &&
    !workoutState.workoutPhaseStartTime;

  // Check if in time block
  const activeTimeBlock = workoutState.activeTimeBlock;

  return (
    <>
      {/* Show Time Block Overlay when active */}
      {activeTimeBlock && <TimeBlockOverlay timeBlock={activeTimeBlock} />}

      {/* Regular UI when no time block */}
      {!activeTimeBlock && (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5eead4] to-[#14b8a6] flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Activity className="w-6 h-6 text-[#0a0a0a]" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-white">
                    FlowFit
                  </h1>
                  {userName && (
                    <p className="text-xs sm:text-sm text-gray-400">
                      Welcome back, {userName}
                    </p>
                  )}
                </div>
              </div>

              <div className="gap-1.5 sm:gap-2 flex-wrap hidden sm:flex">
                {/* Notification status indicator */}
                {!pushSubscription && !notificationsUnsupported && (
                  <Button
                    onClick={requestNotificationPermission}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-xs whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">
                      Enable Notifications
                    </span>
                    <span className="sm:hidden">Notify</span>
                  </Button>
                )}

                <Link href="/blocks">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
                  >
                    <Calendar className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/activities">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
                  >
                    <Dumbbell className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/logs">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
                  >
                    <FileText className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Main Timer Circle or After-Hours UI */}
            {!isWorkoutPhase &&
            !isBreakPhase &&
            !isWaitingPhase &&
            !isWithinWorkHours() ? (
              <div className="space-y-6">
                <Card className="bg-[#151515] border-[#252525] shadow-xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-0">
                      {/* Left side - Image */}
                      <div className="relative h-64 md:h-auto">
                        <Image
                          src="/relaxation.jpg"
                          alt="Relaxation"
                          fill
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#151515] md:opacity-100 opacity-50" />
                      </div>

                      {/* Right side - Motivational text */}
                      <div className="p-8 flex flex-col justify-center space-y-4">
                        <div className="inline-flex items-center gap-2 text-[#5eead4] mb-2">
                          <div className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse" />
                          <span className="text-sm font-medium uppercase tracking-wider">
                            Work Day Complete
                          </span>
                        </div>

                        <h2 className="text-3xl font-bold text-white leading-tight">
                          Time to Disconnect & Recharge
                        </h2>

                        <p className="text-gray-300 leading-relaxed">
                          You&apos;ve done great work today! Remember, mental
                          health is just as important as physical health. Step
                          away from the screen and enjoy your evening.
                        </p>

                        <div className="space-y-2 pt-4">
                          <p className="text-sm font-medium text-gray-400">
                            Evening suggestions:
                          </p>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                              Take a walk in nature
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                              Spend quality time with loved ones
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                              Pursue a hobby or passion
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                              Practice mindfulness or meditation
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Daily Stats */}
                <Card className="bg-[#151515] border-[#252525] shadow-xl">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#5eead4]" />
                      Today&apos;s Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Workouts Completed */}
                      <div className="bg-[#0a0a0a] rounded-xl p-6 border border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#5eead4]/10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-[#5eead4]" />
                          </div>
                          <span className="text-3xl font-bold text-white">
                            {getDailyStats().workoutsCompleted}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Workouts Completed
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getDailyStats().workoutsCompleted > 0
                            ? "Great job staying active!"
                            : "No workouts yet today"}
                        </p>
                      </div>

                      {/* Calories Burned */}
                      <div className="bg-[#0a0a0a] rounded-xl p-6 border border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ef4444]/10 flex items-center justify-center">
                            <Flame className="w-5 h-5 text-[#ef4444]" />
                          </div>
                          <span className="text-3xl font-bold text-white">
                            {getDailyStats().caloriesBurned}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">Calories Burned</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getDailyStats().caloriesBurned > 0
                            ? "Keep up the momentum!"
                            : "Start moving to burn calories"}
                        </p>
                      </div>

                      {/* Body Areas */}
                      <div className="bg-[#0a0a0a] rounded-xl p-6 border border-[#2a2a2a]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-[#8b5cf6]" />
                          </div>
                          <span className="text-3xl font-bold text-white">
                            {getDailyStats().bodyAreas.length}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Body Areas Worked
                        </p>
                        {getDailyStats().bodyAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {getDailyStats().bodyAreas.map((area) => (
                              <span
                                key={area}
                                className="text-xs px-2 py-0.5 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            No areas targeted yet
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-[#151515] to-[#0d1915] border-[#252525] p-8 shadow-2xl relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5eead4]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#14b8a6]/5 rounded-full blur-3xl" />

                <CardContent className="flex flex-col items-center justify-center space-y-8 p-0 relative z-10">
                  {/* Cycle Progress Indicator */}
                  {isWaitingPhase && !workoutState.isMajorBreak && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#5eead4]/10 border border-[#5eead4]/20">
                      <Zap className="w-4 h-4 text-[#5eead4]" />
                      <span className="text-sm font-medium text-[#5eead4]">
                        Cycle {workoutState.completedCycles}/
                        {settings.major_break_interval}
                      </span>
                    </div>
                  )}

                  {/* Major Break Badge */}
                  {workoutState.isMajorBreak && (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#5eead4]/20 to-[#14b8a6]/20 border-2 border-[#5eead4]/30 animate-pulse">
                      <Sparkles className="w-5 h-5 text-[#5eead4]" />
                      <span className="text-lg font-bold text-[#5eead4] uppercase tracking-wider">
                        Major Break
                      </span>
                      <Sparkles className="w-5 h-5 text-[#5eead4]" />
                    </div>
                  )}

                  {/* Enhanced Circle Timer */}
                  <div className="relative w-full max-w-[20rem] sm:max-w-[22rem] mx-auto aspect-square">
                    {/* Outer glow ring */}
                    <div
                      className={`absolute inset-0 rounded-full ${
                        isWorkoutPhase
                          ? "bg-gradient-to-tr from-[#ef4444]/20 to-[#f87171]/10"
                          : "bg-gradient-to-tr from-[#5eead4]/20 to-[#14b8a6]/10"
                      } blur-xl`}
                    />

                    <svg
                      className="w-full h-full transform -rotate-90 relative z-10"
                      viewBox="0 0 320 320"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Background circle */}
                      <circle
                        cx="160"
                        cy="160"
                        r="150"
                        stroke="url(#bgGradient)"
                        strokeWidth="3"
                        fill="none"
                        opacity="0.2"
                      />

                      {/* Progress circle */}
                      <circle
                        cx="160"
                        cy="160"
                        r="150"
                        stroke={`url(${
                          isWorkoutPhase ? "#workoutGradient" : "#focusGradient"
                        })`}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 150}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          150 *
                          (1 -
                            (isWorkoutPhase || isBreakPhase
                              ? (300000 - timeRemaining) / 300000
                              : isWaitingPhase
                              ? workoutState.isMajorBreak
                                ? 1 -
                                  timeRemaining /
                                    ((settings.major_break_duration || 15) *
                                      60 *
                                      1000)
                                : 1 -
                                  timeRemaining /
                                    ((settings.interval || 60) * 60 * 1000)
                              : 0))
                        }`}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                        style={{
                          filter: isWorkoutPhase
                            ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.4)) drop-shadow(0 0 16px rgba(239, 68, 68, 0.1))"
                            : "drop-shadow(0 0 8px rgba(94, 234, 212, 0.4)) drop-shadow(0 0 16px rgba(94, 234, 212, 0.1))",
                        }}
                      />

                      {/* Gradient definitions */}
                      <defs>
                        <linearGradient
                          id="bgGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#5eead4" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                        <linearGradient
                          id="workoutGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#f87171" />
                        </linearGradient>
                        <linearGradient
                          id="focusGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#5eead4" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-8">
                      {isWorkoutPhase && (
                        <>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 mb-3 sm:mb-4">
                            <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                            <p className="text-xs uppercase tracking-wider text-[#ef4444] font-bold">
                              {workoutState.isPaused
                                ? "Paused"
                                : "Workout Active"}
                            </p>
                          </div>
                          <p className="text-lg sm:text-2xl text-white font-bold mb-4 sm:mb-6 text-center leading-tight max-w-[200px] sm:max-w-[250px]">
                            {workoutState.currentActivity}
                          </p>
                          <p className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[#ef4444] to-[#f87171] bg-clip-text text-transparent tabular-nums">
                            {formatTime(timeRemaining)}
                          </p>
                          <p className="text-xs text-gray-500 mt-3 sm:mt-4 uppercase tracking-wider">
                            Keep Moving
                          </p>
                        </>
                      )}

                      {isWaitingPhase && (
                        <>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5eead4]/10 border border-[#5eead4]/20 mb-2 sm:mb-3">
                            <div className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse" />
                            <p className="text-xs uppercase tracking-wider text-[#5eead4] font-bold">
                              {workoutState.isPaused
                                ? "Paused"
                                : workoutState.isMajorBreak
                                ? "Major Break"
                                : "Focus Mode"}
                            </p>
                          </div>
                          <p className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-[#5eead4] to-[#14b8a6] bg-clip-text text-transparent tabular-nums mb-2">
                            {formatTime(timeRemaining)}
                          </p>
                          {!workoutState.isPaused &&
                            !workoutState.isMajorBreak && (
                              <p className="text-xs sm:text-sm text-gray-300 mt-4 sm:mt-6 text-center italic leading-relaxed max-w-xs px-4">
                                {workFocusMessage}
                              </p>
                            )}
                          {workoutState.isMajorBreak && (
                            <p className="text-xs sm:text-sm text-gray-300 mt-4 sm:mt-6 text-center leading-relaxed max-w-xs px-4">
                              Take a longer break. You&apos;ve earned it! 🎉
                            </p>
                          )}
                        </>
                      )}

                      {isBreakPhase && (
                        <>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5eead4]/10 border border-[#5eead4]/20 mb-2 sm:mb-3">
                            <div className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse" />
                            <p className="text-xs uppercase tracking-wider text-[#5eead4] font-bold">
                              {workoutState.isPaused ? "Paused" : "Recovery"}
                            </p>
                          </div>
                          <p className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-[#5eead4] to-[#14b8a6] bg-clip-text text-transparent tabular-nums mb-2">
                            {formatTime(timeRemaining)}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4 uppercase tracking-wider">
                            Relax & Recover
                          </p>
                        </>
                      )}

                      {!isWorkoutPhase &&
                        !isBreakPhase &&
                        !isWaitingPhase &&
                        !isWithinWorkHours() && (
                          <>
                            <div className="text-center space-y-4">
                              <p className="text-2xl font-bold bg-gradient-to-r from-[#5eead4] to-[#14b8a6] bg-clip-text text-transparent">
                                Work Day Complete!
                              </p>
                              <p className="text-sm text-gray-300 leading-relaxed max-w-sm">
                                Great job today! Remember, mental health is just
                                as important as physical health. Consider going
                                for a walk, spending time with loved ones, or
                                enjoying a hobby. Too much screen time
                                isn&apos;t good for you.
                              </p>
                              <p className="text-xs text-gray-500 italic">
                                See you tomorrow!
                              </p>
                            </div>
                          </>
                        )}

                      {!isWorkoutPhase &&
                        !isBreakPhase &&
                        !isWaitingPhase &&
                        isWithinWorkHours() && (
                          <>
                            <p className="text-sm text-gray-400 mb-6 uppercase tracking-wider">
                              Ready to begin
                            </p>
                            <Button
                              onClick={startNewWorkout}
                              className="mt-4 bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] font-bold shadow-lg shadow-teal-500/30 px-8 py-6 text-lg transition-all hover:scale-105 z-[1000] cursor-pointer"
                            >
                              Start Workout
                            </Button>
                          </>
                        )}
                    </div>
                  </div>

                  {(isWorkoutPhase || isBreakPhase || isWaitingPhase) && (
                    <Button
                      onClick={
                        workoutState.isPaused
                          ? handleResumeWorkout
                          : handlePauseWorkout
                      }
                      variant="outline"
                      size="icon"
                      className="rounded-full border-[#2a2a2a] hover:bg-white/5 bg-transparent text-gray-300 w-12 h-12"
                    >
                      {workoutState.isPaused ? (
                        <Play className="w-5 h-5" />
                      ) : (
                        <Pause className="w-5 h-5" />
                      )}
                    </Button>
                  )}

                  {/* Action Buttons */}
                  {isWorkoutPhase && !workoutState.isPaused && (
                    <div className="flex gap-4 w-full max-w-md">
                      <Button
                        onClick={handleDone}
                        className="flex-1 bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] font-semibold shadow-lg shadow-teal-500/20"
                        size="lg"
                      >
                        Done
                      </Button>
                      <Button
                        onClick={handleSkip}
                        variant="outline"
                        className="flex-1 border-[#2a2a2a] hover:bg-white/5 bg-transparent text-gray-300"
                        size="lg"
                      >
                        Skip
                      </Button>
                    </div>
                  )}

                  {isWaitingPhase && !workoutState.isPaused && (
                    <Button
                      onClick={handleSkipWorkTimer}
                      variant="outline"
                      className="border-[#2a2a2a] hover:bg-white/5 bg-transparent text-gray-300 gap-2"
                      size="lg"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip to Workout
                    </Button>
                  )}

                  {/* Motivational Quote or Health Warning */}
                  {!isWorkoutPhase && workoutState.lastCompletedTime && (
                    <div className="text-center max-w-md">
                      <p className="text-sm text-[#5eead4] italic leading-relaxed">
                        {motivationalQuote}
                      </p>
                    </div>
                  )}

                  {!isWorkoutPhase &&
                    workoutState.missedLastWorkout &&
                    !workoutState.lastCompletedTime && (
                      <div className="text-center max-w-md">
                        <p className="text-sm text-[#ef4444] italic leading-relaxed">
                          {healthWarning}
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      {mounted && (
        <MobileBottomNav
          pushSubscription={pushSubscription}
          notificationsUnsupported={notificationsUnsupported}
          onEnableNotifications={requestNotificationPermission}
          isPaused={workoutState.isPaused}
          onTogglePause={
            workoutState.isPaused ? handleResumeWorkout : handlePauseWorkout
          }
        />
      )}
    </>
  );
}

// MobileBottomNav is implemented in components/mobile-bottom-nav.tsx
