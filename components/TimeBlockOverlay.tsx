"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, UtensilsCrossed, Moon, Sparkles } from "lucide-react";

interface TimeBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days: string[];
}

interface TimeBlockOverlayProps {
  timeBlock: TimeBlock;
}

export default function TimeBlockOverlay({ timeBlock }: TimeBlockOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const [endHours, endMinutes] = timeBlock.end_time.split(":").map(Number);

      const endTime = new Date();
      endTime.setHours(endHours, endMinutes, 0, 0);

      const diff = endTime.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      } else {
        setTimeRemaining("Ending soon");
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [timeBlock.end_time]);

  // Select icon based on title
  const getIcon = () => {
    const title = timeBlock.title.toLowerCase();
    if (title.includes("lunch") || title.includes("meal")) {
      return (
        <UtensilsCrossed className="w-12 h-12 sm:w-16 sm:h-16 text-[#5eead4]" />
      );
    }
    if (title.includes("break") || title.includes("coffee")) {
      return <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-[#5eead4]" />;
    }
    if (title.includes("rest") || title.includes("sleep")) {
      return <Moon className="w-12 h-12 sm:w-16 sm:h-16 text-[#5eead4]" />;
    }
    return <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-[#5eead4]" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d1f1a] to-[#0a0a0a] flex items-center justify-center p-4 sm:p-6">
      <Card className="bg-[#151515]/80 backdrop-blur-xl border-[#252525] shadow-2xl max-w-2xl w-full">
        <CardContent className="p-6 sm:p-12">
          <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
            {/* Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#5eead4]/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#5eead4]/10 to-[#14b8a6]/10 border-2 border-[#5eead4]/30 flex items-center justify-center">
                {getIcon()}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5eead4]/10 border border-[#5eead4]/20">
                <div className="w-2 h-2 rounded-full bg-[#5eead4] animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-[#5eead4] uppercase tracking-wider">
                  Time Block Active
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-white mt-4">
                {timeBlock.title}
              </h1>
            </div>

            {/* Time Remaining */}
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-wider">
                Time Remaining
              </p>
              <div className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[#5eead4] to-[#14b8a6] bg-clip-text text-transparent tabular-nums">
                {timeRemaining}
              </div>
            </div>

            {/* Message */}
            <div className="max-w-md space-y-4 pt-4">
              <p className="text-sm sm:text-lg text-gray-300 leading-relaxed px-4">
                Take this time to disconnect and recharge. Your timer is paused
                and will automatically resume when this block ends.
              </p>

              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                <span>Ends at {timeBlock.end_time}</span>
              </div>
            </div>

            {/* Calming Animation */}
            <div className="relative w-full h-2 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#5eead4] to-[#14b8a6] rounded-full"
                style={{
                  animation: "breathe 4s ease-in-out infinite",
                  width: "40%",
                }}
              />
            </div>

            {/* Suggestions */}
            <div className="w-full pt-6 border-t border-[#252525]">
              <p className="text-xs sm:text-sm font-medium text-gray-400 mb-4">
                Suggestions for your {timeBlock.title.toLowerCase()}:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a]/50 border border-[#252525]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                  <span>Stretch your body</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a]/50 border border-[#252525]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                  <span>Rest your eyes</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a]/50 border border-[#252525]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                  <span>Hydrate yourself</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a]/50 border border-[#252525]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                  <span>Take deep breaths</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes breathe {
          0%,
          100% {
            width: 30%;
            opacity: 0.6;
          }
          50% {
            width: 70%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
