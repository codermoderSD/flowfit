"use client";

import Link from "next/link";
import { Calendar, Dumbbell, Settings, Zap, Play, Pause } from "lucide-react";
import React from "react";

interface Props {
  pushSubscription: PushSubscription | null;
  notificationsUnsupported: boolean;
  onEnableNotifications: () => Promise<void> | void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export default function MobileBottomNav({
  pushSubscription,
  notificationsUnsupported,
  onEnableNotifications,
  isPaused,
  onTogglePause,
}: Props) {
  return (
    <nav className="sm:hidden fixed bottom-5 left-1/2 transform -translate-x-1/2 w-[94%] max-w-2xl bg-[#071011]/70 backdrop-blur-md border border-[#1b1b1b]/60 rounded-2xl shadow-xl z-50 animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/blocks">
            <div className="text-gray-300 hover:text-white">
              <Calendar className="w-6 h-6" />
            </div>
          </Link>
          <Link href="/activities">
            <div className="text-gray-300 hover:text-white">
              <Dumbbell className="w-6 h-6" />
            </div>
          </Link>
        </div>

        <div className="relative -mt-6">
          <button
            onClick={onTogglePause}
            aria-label={isPaused ? "Resume" : "Pause"}
            className="bg-gradient-to-r from-[#5eead4] to-[#14b8a6] p-3.5 rounded-full shadow-2xl transform hover:scale-105 transition-all"
            style={{ boxShadow: "0 8px 20px rgba(20,176,166,0.18)" }}
          >
            {isPaused ? (
              <Play className="w-5 h-5 text-black" />
            ) : (
              <Pause className="w-5 h-5 text-black" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings">
            <div className="text-gray-300 hover:text-white">
              <Settings className="w-6 h-6" />
            </div>
          </Link>
          <button
            onClick={() => onEnableNotifications()}
            className="text-gray-300 hover:text-white"
            disabled={!!pushSubscription || notificationsUnsupported}
            aria-label="Enable notifications"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(12px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 280ms cubic-bezier(0.2, 0.9, 0.3, 1);
        }
      `}</style>
    </nav>
  );
}
