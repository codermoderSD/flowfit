"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface WorkoutState {
  currentActivity: string | null;
  workoutPhaseStartTime: number | null;
  nextWorkoutTime: number | null;
  lastCompletedTime: number | null;
  missedLastWorkout: boolean;
  isPaused: boolean;
  pausedAt: number | null;
  pausedTimeRemaining: number | null;
  completedCycles: number;
  isMajorBreak: boolean;
  isTimeBlockPaused: boolean;
  activeTimeBlock: TimeBlock | null;
}

interface UserSettings {
  work_start: string;
  work_end: string;
  interval: number;
  major_break_interval: number;
  major_break_duration: number;
}

interface TimeBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days: string[];
}

interface TimerContextType {
  user: any;
  settings: UserSettings;
  activities: string[];
  timeBlocks: TimeBlock[];
  workoutState: WorkoutState;
  timeRemaining: number;
  isWithinWorkHours: () => boolean;
  isInTimeBlock: () => TimeBlock | null;
  startNewWorkout: () => void;
  handleDoneWorkout: () => Promise<void>;
  handleSkipWorkout: () => void;
  handlePauseWorkout: () => void;
  handleResumeWorkout: () => void;
  handleSkipWorkTimer: () => void;
  loadUserData: () => Promise<void>;
  setSettings: (settings: UserSettings) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    work_start: "09:00",
    work_end: "17:00",
    interval: 30,
    major_break_interval: 4,
    major_break_duration: 15,
  });
  const [activities, setActivities] = useState<string[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    currentActivity: null,
    workoutPhaseStartTime: null,
    nextWorkoutTime: null,
    lastCompletedTime: null,
    missedLastWorkout: false,
    isPaused: false,
    pausedAt: null,
    pausedTimeRemaining: null,
    completedCycles: 0,
    isMajorBreak: false,
    isTimeBlockPaused: false,
    activeTimeBlock: null,
  });
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Use refs to keep stable references for interval logic
  const workoutStateRef = useRef(workoutState);
  const settingsRef = useRef(settings);
  const timeBlocksRef = useRef(timeBlocks);
  const activitiesRef = useRef(activities);

  // Sync refs with state
  useEffect(() => {
    workoutStateRef.current = workoutState;
  }, [workoutState]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    timeBlocksRef.current = timeBlocks;
  }, [timeBlocks]);

  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  // Helper function to send web push notifications
  const showNotification = async (title: string, body: string) => {
    try {
      // Try to send via web push API (works even when page is in background)
      await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          icon: "/icon-192.jpg",
          badge: "/icon-192.jpg",
        }),
      });
      console.log("Push notification sent via API");
    } catch (error) {
      console.error("Failed to send push notification:", error);

      // Fallback to local notification API
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          const notification = new Notification(title, {
            body,
            icon: "/icon-192.jpg",
            badge: "/icon-192.jpg",
            tag: `flowfit-${Date.now()}`,
            requireInteraction: false,
            silent: false,
          });

          // Auto-close after 8 seconds
          setTimeout(() => notification.close(), 8000);
        } catch (e) {
          console.error("Local notification error:", e);
        }
      }
    }
  };

  const loadUserData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    setUser(user);

    // Load cached settings
    try {
      const cached = localStorage.getItem("flowFitSettings");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.work_start) {
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      // ignore
    }

    // Load settings from Supabase
    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsData) {
      setSettings({
        work_start: settingsData.work_start,
        work_end: settingsData.work_end,
        interval: settingsData.interval,
        major_break_interval: settingsData.major_break_interval || 4,
        major_break_duration: settingsData.major_break_duration || 15,
      });
    }

    // Load activities
    const { data: activitiesData } = await supabase
      .from("activities")
      .select("name")
      .eq("user_id", user.id);

    if (activitiesData) {
      setActivities(activitiesData.map((a) => a.name));
    }

    // Load time blocks
    const { data: blocksData } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("user_id", user.id);

    if (blocksData) {
      setTimeBlocks(blocksData);
    }

    // Load workout state from localStorage
    const savedWorkoutState = localStorage.getItem("flowFitWorkoutState");
    if (savedWorkoutState) {
      const parsedState = JSON.parse(savedWorkoutState);

      // Load completed cycles from separate storage for persistence
      const savedCycles = localStorage.getItem("flowFitCompletedCycles");
      if (savedCycles) {
        parsedState.completedCycles = parseInt(savedCycles, 10) || 0;
      }

      setWorkoutState(parsedState);

      // Immediately compute timeRemaining
      const now = Date.now();
      if (parsedState.isPaused && parsedState.pausedTimeRemaining !== null) {
        setTimeRemaining(parsedState.pausedTimeRemaining);
      } else if (
        parsedState.workoutPhaseStartTime &&
        parsedState.currentActivity
      ) {
        const elapsed = now - parsedState.workoutPhaseStartTime;
        const remaining = Math.max(0, 300000 - elapsed);
        setTimeRemaining(remaining);
      } else if (
        parsedState.workoutPhaseStartTime &&
        !parsedState.currentActivity
      ) {
        const elapsed = now - parsedState.workoutPhaseStartTime;
        const remaining = Math.max(0, 300000 - elapsed);
        setTimeRemaining(remaining);
      } else if (parsedState.nextWorkoutTime) {
        const remaining = Math.max(0, parsedState.nextWorkoutTime - now);
        setTimeRemaining(remaining);
      }
    }
  }, [supabase]);

  // Save workout state to localStorage
  useEffect(() => {
    localStorage.setItem("flowFitWorkoutState", JSON.stringify(workoutState));
  }, [workoutState]);

  // Timer countdown with stable interval reference
  useEffect(() => {
    const interval = setInterval(() => {
      const state = workoutStateRef.current;
      const currentSettings = settingsRef.current;
      const blocks = timeBlocksRef.current;

      // Check if we're in a time block
      const activeBlock = isInTimeBlock();

      // If entering a time block, pause the timer
      if (activeBlock && !state.isTimeBlockPaused) {
        setWorkoutState((prev) => ({
          ...prev,
          isTimeBlockPaused: true,
          activeTimeBlock: activeBlock,
          isPaused: true,
          pausedAt: Date.now(),
          pausedTimeRemaining: timeRemaining,
        }));

        // Notification for time block start
        showNotification(
          `🌿 ${activeBlock.title}`,
          `Time block started. Timer paused. Enjoy your ${activeBlock.title.toLowerCase()}!`
        );
        return;
      }

      // If exiting a time block, resume the timer
      if (!activeBlock && state.isTimeBlockPaused) {
        const now = Date.now();
        const remaining = state.pausedTimeRemaining || 0;

        // Resume based on current phase
        if (state.currentActivity || state.workoutPhaseStartTime) {
          setWorkoutState((prev) => ({
            ...prev,
            isTimeBlockPaused: false,
            activeTimeBlock: null,
            isPaused: false,
            pausedAt: null,
            pausedTimeRemaining: null,
            workoutPhaseStartTime: state.workoutPhaseStartTime
              ? now - (300000 - remaining)
              : null,
          }));
        } else if (state.nextWorkoutTime) {
          setWorkoutState((prev) => ({
            ...prev,
            isTimeBlockPaused: false,
            activeTimeBlock: null,
            isPaused: false,
            pausedAt: null,
            pausedTimeRemaining: null,
            nextWorkoutTime: now + remaining,
          }));
        }

        // Notification for time block end
        showNotification(
          "⏰ Timer Resumed",
          "Time block ended. Back to your regular schedule!"
        );
        return;
      }

      if (state.isPaused) {
        if (state.pausedTimeRemaining !== null) {
          setTimeRemaining(state.pausedTimeRemaining);
        }
        return;
      }

      const now = Date.now();

      if (state.workoutPhaseStartTime && state.currentActivity) {
        // Workout timer (5 minutes) - user is doing the activity
        const elapsed = now - state.workoutPhaseStartTime;
        const remaining = Math.max(0, 300000 - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          // Increment completed cycles
          const newCycleCount = state.completedCycles + 1;

          // Check if it's time for a major break
          const shouldTakeMajorBreak =
            newCycleCount >= currentSettings.major_break_interval;

          if (shouldTakeMajorBreak) {
            // Start major break
            const majorBreakMs =
              currentSettings.major_break_duration * 60 * 1000;
            setWorkoutState((prev) => ({
              ...prev,
              currentActivity: null,
              workoutPhaseStartTime: null,
              nextWorkoutTime: now + majorBreakMs,
              missedLastWorkout: false,
              completedCycles: 0, // Reset cycle count
              isMajorBreak: true,
            }));

            // Save cycle count to localStorage
            localStorage.setItem("flowFitCompletedCycles", "0");

            // Notification for major break
            showNotification(
              "🎉 Major Break Time!",
              `Great work! You've completed ${currentSettings.major_break_interval} cycles. Take a ${currentSettings.major_break_duration}-minute break to recharge!`
            );
          } else {
            // Regular work timer
            const intervalMs = currentSettings.interval * 60 * 1000;
            setWorkoutState((prev) => ({
              ...prev,
              currentActivity: null,
              workoutPhaseStartTime: null,
              nextWorkoutTime: now + intervalMs,
              missedLastWorkout: false,
              completedCycles: newCycleCount,
            }));

            // Save cycle count to localStorage
            localStorage.setItem(
              "flowFitCompletedCycles",
              newCycleCount.toString()
            );

            // Notification for work mode
            showNotification(
              "🎯 Focus Mode Started",
              `Workout time ended. Focus on work for ${currentSettings.interval} minutes. (Cycle ${newCycleCount}/${currentSettings.major_break_interval})`
            );
          }
        }
      } else if (state.workoutPhaseStartTime && !state.currentActivity) {
        // Post-done relax/recover period (still within the 5-minute workout window)
        const elapsed = now - state.workoutPhaseStartTime;
        const remaining = Math.max(0, 300000 - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          // Increment completed cycles
          const newCycleCount = state.completedCycles + 1;

          // Check if it's time for a major break
          const shouldTakeMajorBreak =
            newCycleCount >= currentSettings.major_break_interval;

          if (shouldTakeMajorBreak) {
            // Start major break
            const majorBreakMs =
              currentSettings.major_break_duration * 60 * 1000;
            setWorkoutState((prev) => ({
              ...prev,
              workoutPhaseStartTime: null,
              nextWorkoutTime: now + majorBreakMs,
              completedCycles: 0, // Reset cycle count
              isMajorBreak: true,
            }));

            // Save cycle count to localStorage
            localStorage.setItem("flowFitCompletedCycles", "0");

            // Notification for major break
            showNotification(
              "🎉 Major Break Time!",
              `Excellent! You've completed ${currentSettings.major_break_interval} cycles. Enjoy your ${currentSettings.major_break_duration}-minute major break!`
            );
          } else {
            // Regular work timer
            const intervalMs = currentSettings.interval * 60 * 1000;
            setWorkoutState((prev) => ({
              ...prev,
              workoutPhaseStartTime: null,
              nextWorkoutTime: now + intervalMs,
              completedCycles: newCycleCount,
            }));

            // Save cycle count to localStorage
            localStorage.setItem(
              "flowFitCompletedCycles",
              newCycleCount.toString()
            );

            // Notify user focus mode started
            showNotification(
              "🎯 Focus Mode Started",
              `Relaxation over. Focus on work for ${currentSettings.interval} minutes. (Cycle ${newCycleCount}/${currentSettings.major_break_interval})`
            );
          }
        }
      } else if (state.nextWorkoutTime) {
        // Work timer (interval period) or Major break
        const remaining = Math.max(0, state.nextWorkoutTime - now);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          const currentActivities = activitiesRef.current;
          const randomActivity =
            currentActivities[
              Math.floor(Math.random() * currentActivities.length)
            ];

          setWorkoutState((prev) => ({
            ...prev,
            currentActivity: randomActivity,
            workoutPhaseStartTime: now,
            nextWorkoutTime: null,
            lastCompletedTime: null,
            missedLastWorkout: false,
            isPaused: false,
            pausedAt: null,
            pausedTimeRemaining: null,
            isMajorBreak: false, // End major break
          }));

          // Notification
          const message = state.isMajorBreak
            ? `Major break over! Let's get back to it: ${randomActivity}`
            : `Let's do: ${randomActivity}`;

          showNotification(
            "⏰ Time to Move!",
            `${message}\n\n5 minutes to boost your energy and focus!`
          );
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const isWithinWorkHours = useCallback((): boolean => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    return (
      currentTime >= settingsRef.current.work_start &&
      currentTime < settingsRef.current.work_end
    );
  }, []);

  const isInTimeBlock = useCallback((): TimeBlock | null => {
    const now = new Date();
    const currentDay = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][now.getDay()];
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    for (const block of timeBlocksRef.current) {
      const [startHours, startMinutes] = block.start_time
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = block.end_time.split(":").map(Number);

      const startTime = `${startHours
        .toString()
        .padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutes
        .toString()
        .padStart(2, "0")}`;

      if (block.is_recurring && block.recurring_days?.includes(currentDay)) {
        if (currentTime >= startTime && currentTime <= endTime) {
          return block;
        }
      }
    }

    return null;
  }, []);

  const startNewWorkout = useCallback(() => {
    if (!isWithinWorkHours()) {
      return;
    }

    const activeBlock = isInTimeBlock();
    if (activeBlock) {
      return;
    }

    const randomActivity =
      activitiesRef.current[
        Math.floor(Math.random() * activitiesRef.current.length)
      ];

    setWorkoutState({
      currentActivity: randomActivity,
      workoutPhaseStartTime: Date.now(),
      nextWorkoutTime: null,
      lastCompletedTime: null,
      missedLastWorkout: false,
      isPaused: false,
      pausedAt: null,
      pausedTimeRemaining: null,
      completedCycles: workoutStateRef.current.completedCycles,
      isMajorBreak: false,
      isTimeBlockPaused: false,
      activeTimeBlock: null,
    });

    showNotification(
      "⏰ Time to Move!",
      `Let's do: ${randomActivity}\n\n5 minutes to boost your energy and focus!`
    );
  }, [isWithinWorkHours, isInTimeBlock]);

  const handleDoneWorkout = useCallback(async () => {
    if (!workoutStateRef.current.currentActivity || !user) return;

    const activity = workoutStateRef.current.currentActivity;
    const now = Date.now();

    // Log to Supabase but DO NOT end the workout early.
    // The workout timer (5 minutes) should continue to run regardless of Done.
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      activity_name: activity,
      calories: 10,
      body_area: null,
      completed_at: new Date().toISOString(),
    });

    // Mark lastCompletedTime but keep currentActivity and workoutPhaseStartTime
    // Transition UI to 'relax and recover' (break) by clearing currentActivity
    // but preserve workoutPhaseStartTime so remaining time continues until 5 minutes.
    setWorkoutState((prev) => ({
      ...prev,
      currentActivity: null,
      lastCompletedTime: now,
      missedLastWorkout: false,
    }));
  }, [supabase, user]);

  const handleSkipWorkout = useCallback(() => {
    const now = Date.now();
    const intervalMs = settingsRef.current.interval * 60 * 1000;

    // Start work timer immediately (no separate break)
    setWorkoutState((prev) => ({
      ...prev,
      currentActivity: null,
      workoutPhaseStartTime: null,
      nextWorkoutTime: now + intervalMs,
      missedLastWorkout: true,
    }));

    // Notification for work mode
    showNotification(
      "🎯 Focus Mode Started",
      `Back to work! Focus for ${settingsRef.current.interval} minutes.`
    );
  }, []);

  const handlePauseWorkout = useCallback(() => {
    setWorkoutState((prev) => ({
      ...prev,
      isPaused: true,
      pausedAt: Date.now(),
      pausedTimeRemaining: timeRemaining,
    }));
  }, [timeRemaining]);

  const handleResumeWorkout = useCallback(() => {
    const now = Date.now();
    const state = workoutStateRef.current;

    if (!state.isPaused) return;

    // If user paused during workout phase (currentActivity present),
    // restore workoutPhaseStartTime so elapsed/remaining are correct.
    if (state.currentActivity && state.workoutPhaseStartTime) {
      if (state.pausedTimeRemaining != null) {
        const remainingMs = state.pausedTimeRemaining;
        setWorkoutState((prev) => ({
          ...prev,
          isPaused: false,
          pausedAt: null,
          pausedTimeRemaining: null,
          // Set workoutPhaseStartTime so that (now - start) yields correct elapsed
          workoutPhaseStartTime: now - (300000 - remainingMs),
        }));
        return;
      }
    }

    // If user paused during work timer (nextWorkoutTime present),
    // restore nextWorkoutTime relative to now using pausedTimeRemaining.
    if (state.nextWorkoutTime) {
      if (state.pausedTimeRemaining != null) {
        const remainingMs = state.pausedTimeRemaining;
        setWorkoutState((prev) => ({
          ...prev,
          isPaused: false,
          pausedAt: null,
          pausedTimeRemaining: null,
          nextWorkoutTime: now + remainingMs,
        }));
        return;
      }
    }

    // Fallback: just unpause
    setWorkoutState((prev) => ({
      ...prev,
      isPaused: false,
      pausedAt: null,
      pausedTimeRemaining: null,
    }));
  }, []);

  const handleSkipWorkTimer = useCallback(() => {
    const now = Date.now();
    const currentActivities = activitiesRef.current;
    const randomActivity =
      currentActivities[Math.floor(Math.random() * currentActivities.length)];

    // Start workout immediately
    setWorkoutState({
      currentActivity: randomActivity,
      workoutPhaseStartTime: now,
      nextWorkoutTime: null,
      lastCompletedTime: null,
      missedLastWorkout: false,
      isPaused: false,
      pausedAt: null,
      pausedTimeRemaining: null,
      completedCycles: workoutStateRef.current.completedCycles,
      isMajorBreak: false,
      isTimeBlockPaused: false,
      activeTimeBlock: null,
    });

    // Send workout notification
    showNotification(
      "⏰ Time to Move!",
      `Let's do: ${randomActivity}\n\n5 minutes to boost your energy and focus!`
    );
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const value: TimerContextType = {
    user,
    settings,
    activities,
    timeBlocks,
    workoutState,
    timeRemaining,
    isWithinWorkHours,
    isInTimeBlock,
    startNewWorkout,
    handleDoneWorkout,
    handleSkipWorkout,
    handlePauseWorkout,
    handleResumeWorkout,
    handleSkipWorkTimer,
    loadUserData,
    setSettings,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
