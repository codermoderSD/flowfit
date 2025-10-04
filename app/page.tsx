"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useTimer } from "@/contexts/TimerContext";
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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MOTIVATIONAL_QUOTES = [
  "Movement is medicine for creating change.",
  "Your body is your most priceless possession. Take care of it.",
  "The only bad workout is the one that didn't happen.",
  "Take care of your body. It's the only place you have to live.",
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
  "You're doing great. Keep the momentum going.",
  "Focus on progress, not perfection.",
  "This is your time to create something amazing.",
  "Block out the noise. Your work matters.",
  "Stay present. Quality over quantity.",
  "You've got this. Trust the process.",
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
    loadUserData,
  } = useTimer();

  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [motivationalQuote, setMotivationalQuote] = useState<string>("");
  const [healthWarning, setHealthWarning] = useState<string>("");
  const [workFocusMessage, setWorkFocusMessage] = useState<string>("");
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    loadPageData();
    requestNotificationPermission();
  }, [user]);

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

    // Set random messages
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
  };

  // Wrapper functions that reload logs after done/skip
  const handleDone = async () => {
    await handleDoneWorkout();
    loadPageData(); // Reload today's logs and quotes
  };

  const handleSkip = async () => {
    handleSkipWorkout();
    loadPageData(); // Reload quotes
  };

  const estimateCalories = (activity: string): number => {
    const lower = activity.toLowerCase();
    if (lower.includes("pushup")) return 7;
    if (lower.includes("squat")) return 10;
    if (lower.includes("plank")) return 3;
    if (lower.includes("jumping jack")) return 8;
    if (lower.includes("lunge")) return 6;
    if (lower.includes("calf raise")) return 4;
    if (lower.includes("walk")) return 15;
    return 5;
  };

  const getBodyArea = (activity: string): string | null => {
    const lower = activity.toLowerCase();
    if (lower.includes("pushup") || lower.includes("plank"))
      return "Chest & Core";
    if (lower.includes("squat") || lower.includes("lunge")) return "Legs";
    if (lower.includes("jumping jack")) return "Cardio";
    if (lower.includes("calf")) return "Calves";
    if (lower.includes("walk")) return "Full Body";
    return null;
  };

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
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      console.log("Notification permission:", permission);

      if (permission === "granted") {
        // Test notification
        new Notification("FlowFit Notifications Enabled", {
          body: "You'll receive reminders to stay active throughout your workday",
          icon: "/logo.png",
          badge: "/logo.png",
        });
      }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5eead4] to-[#14b8a6] flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-[#0a0a0a]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">FlowFit</h1>
              {userName && (
                <p className="text-sm text-gray-400">
                  Welcome back, {userName}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {/* Notification status indicator */}
            {notificationPermission !== "granted" && (
              <Button
                onClick={requestNotificationPermission}
                variant="outline"
                size="sm"
                className="border-yellow-500/20 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 text-xs"
              >
                Enable Notifications
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
                      You've done great work today! Remember, mental health is
                      just as important as physical health. Step away from the
                      screen and enjoy your evening.
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
                  Today's Summary
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
                    <p className="text-sm text-gray-400">Workouts Completed</p>
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
                    <p className="text-sm text-gray-400">Body Areas Worked</p>
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
          <Card className="bg-[#151515] border-[#252525] p-8 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center space-y-6 p-0">
              {/* Circle Timer */}
              <div className="relative w-72 h-72">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r="136"
                    stroke="#1f1f1f"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="144"
                    cy="144"
                    r="136"
                    stroke={isWorkoutPhase ? "#ef4444" : "#5eead4"}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 136}`}
                    strokeDashoffset={`${
                      2 *
                      Math.PI *
                      136 *
                      (1 -
                        (isWorkoutPhase || isBreakPhase
                          ? (300000 - timeRemaining) / 300000
                          : isWaitingPhase
                          ? 1 -
                            timeRemaining /
                              ((settings.interval || 60) * 60 * 1000)
                          : 0))
                    }`}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                    style={{
                      filter: isWorkoutPhase
                        ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))"
                        : "drop-shadow(0 0 8px rgba(94, 234, 212, 0.5))",
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
                  {isWorkoutPhase && (
                    <>
                      <p className="text-sm uppercase tracking-wider text-[#ef4444] mb-3 font-semibold">
                        {workoutState.isPaused
                          ? "Workout Paused"
                          : "Workout Time"}
                      </p>
                      <p className="text-xl text-white font-bold mb-4 text-center leading-tight">
                        {workoutState.currentActivity}
                      </p>
                      <p className="text-5xl font-bold text-[#ef4444] tabular-nums">
                        {formatTime(timeRemaining)}
                      </p>
                    </>
                  )}

                  {isWaitingPhase && (
                    <>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                        {workoutState.isPaused ? "Paused" : "Focus Mode"}
                      </p>
                      <p className="text-6xl font-bold text-[#5eead4] tabular-nums">
                        {formatTime(timeRemaining)}
                      </p>
                      {!workoutState.isPaused && (
                        <p className="text-sm text-[#5eead4] mt-6 text-center italic leading-relaxed max-w-xs">
                          {workFocusMessage}
                        </p>
                      )}
                    </>
                  )}

                  {isBreakPhase && (
                    <>
                      <p className="text-xs uppercase tracking-wider text-[#5eead4] mb-2">
                        {workoutState.isPaused ? "Paused" : "Break Time"}
                      </p>
                      <p className="text-6xl font-bold text-[#5eead4] tabular-nums">
                        {formatTime(timeRemaining)}
                      </p>
                      <p className="text-sm text-gray-400 mt-4">
                        Relax and recover
                      </p>
                    </>
                  )}

                  {!isWorkoutPhase &&
                    !isBreakPhase &&
                    !isWaitingPhase &&
                    !isWithinWorkHours() && (
                      <>
                        <div className="text-center space-y-4">
                          <p className="text-lg font-semibold text-[#5eead4]">
                            Work Day Complete!
                          </p>
                          <p className="text-sm text-gray-300 leading-relaxed max-w-sm">
                            Great job today! Remember, mental health is just as
                            important as physical health. Consider going for a
                            walk, spending time with loved ones, or enjoying a
                            hobby. Too much screen time isn't good for you.
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
                        <p className="text-sm text-gray-400 mb-4">
                          Ready to start
                        </p>
                        <Button
                          onClick={startNewWorkout}
                          className="mt-4 bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] font-semibold shadow-lg shadow-teal-500/20"
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
                    "{motivationalQuote}"
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
  );
}
