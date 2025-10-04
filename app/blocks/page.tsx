"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar, Trash2, Clock, Repeat } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  days?: string[];
}

export default function TimeBlocksPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [newBlock, setNewBlock] = useState({
    title: "",
    startTime: "",
    endTime: "",
    isRecurring: false,
    days: [] as string[],
  });

  const daysOfWeek = [
    { short: "Mon", full: "Monday" },
    { short: "Tue", full: "Tuesday" },
    { short: "Wed", full: "Wednesday" },
    { short: "Thu", full: "Thursday" },
    { short: "Fri", full: "Friday" },
    { short: "Sat", full: "Saturday" },
    { short: "Sun", full: "Sunday" },
  ];

  useEffect(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const hourAfter = new Date(nextHour);
    hourAfter.setHours(nextHour.getHours() + 1, 0, 0, 0);

    const formatTime = (date: Date) => {
      return `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    };

    setNewBlock((prev) => ({
      ...prev,
      startTime: formatTime(nextHour),
      endTime: formatTime(hourAfter),
    }));
  }, []);

  useEffect(() => {
    loadTimeBlocks();
  }, []);

  const loadTimeBlocks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUser(user);

    const { data: blocksData } = await supabase
      .from("time_blocks")
      .select("*")
      .eq("user_id", user.id);

    if (blocksData) {
      setTimeBlocks(
        blocksData.map((b) => ({
          id: b.id,
          title: b.title,
          startTime: b.start_time,
          endTime: b.end_time,
          isRecurring: b.is_recurring,
          days: b.recurring_days || [],
        }))
      );
    }
  };

  const toggleDay = (day: string) => {
    setNewBlock((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const addTimeBlock = async () => {
    if (!user) return;

    if (!newBlock.title || !newBlock.startTime || !newBlock.endTime) {
      toast("Please fill in all fields");
      return;
    }

    if (newBlock.isRecurring && newBlock.days.length === 0) {
      toast("Please select at least one day for recurring meetings");
      return;
    }

    const { error } = await supabase.from("time_blocks").insert({
      user_id: user.id,
      title: newBlock.title,
      start_time: newBlock.startTime,
      end_time: newBlock.endTime,
      is_recurring: newBlock.isRecurring,
      recurring_days: newBlock.isRecurring ? newBlock.days : null,
    });

    if (error) {
      console.error("Failed to add time block:", error);
      toast({ title: "Failed to add time block", description: error.message });
      return;
    }

    toast({ title: "Time block added!" });
    loadTimeBlocks();

    setNewBlock({
      title: "",
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      isRecurring: false,
      days: [],
    });
  };

  const deleteTimeBlock = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("time_blocks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to delete time block:", error);
      toast({
        title: "Failed to delete time block",
        description: error.message,
      });
      return;
    }

    toast({ title: "Time block deleted" });
    loadTimeBlocks();
  };

  const clearAllTimeBlocks = async () => {
    if (timeBlocks.length === 0 || !user) return;

    if (
      window.confirm(
        "Are you sure you want to delete all time blocks? This action cannot be undone."
      )
    ) {
      const { error } = await supabase
        .from("time_blocks")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to delete all time blocks:", error);
        toast({
          title: "Failed to delete all time blocks",
          description: error.message,
        });
        return;
      }

      toast({ title: "All time blocks deleted" });
      loadTimeBlocks();
    }
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isBlockActive = (block: TimeBlock) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    const isTimeMatch =
      currentTime >= block.startTime && currentTime <= block.endTime;

    if (block.isRecurring && block.days) {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[now.getDay()];
      return isTimeMatch && block.days.includes(currentDay);
    }

    return isTimeMatch;
  };

  const recurringBlocks = timeBlocks.filter((block) => block.isRecurring);
  const oneTimeBlocks = timeBlocks.filter((block) => !block.isRecurring);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5eead4] to-[#14b8a6] flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Calendar className="w-6 h-6 text-[#0a0a0a]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Time Blocks</h1>
              <p className="text-sm text-gray-400">
                Manage your meeting schedule
              </p>
            </div>
          </div>
          {/* Clear All Button */}
          {timeBlocks.length > 0 && (
            <Button
              onClick={clearAllTimeBlocks}
              variant="ghost"
              className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Add New Time Block */}
        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Add New Time Block
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">
                Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Team Meeting, Client Call"
                value={newBlock.title}
                onChange={(e) =>
                  setNewBlock({ ...newBlock, title: e.target.value })
                }
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-gray-300">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newBlock.startTime}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, startTime: e.target.value })
                  }
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-gray-300">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newBlock.endTime}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, endTime: e.target.value })
                  }
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={newBlock.isRecurring}
                onCheckedChange={(checked) =>
                  setNewBlock({ ...newBlock, isRecurring: checked as boolean })
                }
                className="border-[#2a2a2a] data-[state=checked]:bg-[#5eead4] data-[state=checked]:text-[#0a0a0a]"
              />
              <Label
                htmlFor="recurring"
                className="text-gray-300 cursor-pointer flex items-center gap-2"
              >
                <Repeat className="w-4 h-4" />
                Recurring meeting
              </Label>
            </div>

            {newBlock.isRecurring && (
              <div className="space-y-2">
                <Label className="text-gray-300">Select Days</Label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.short}
                      type="button"
                      onClick={() => toggleDay(day.short)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        newBlock.days.includes(day.short)
                          ? "bg-[#5eead4] text-[#0a0a0a] shadow-lg shadow-teal-500/20"
                          : "bg-[#0a0a0a] text-gray-400 border border-[#2a2a2a] hover:border-[#5eead4]/50"
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={addTimeBlock}
              className="w-full bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] font-semibold shadow-lg shadow-teal-500/20"
            >
              Add Time Block
            </Button>
          </CardContent>
        </Card>

        {/* Recurring Time Blocks */}
        {recurringBlocks.length > 0 && (
          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Repeat className="w-5 h-5 text-[#5eead4]" />
                Recurring Blocks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recurringBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isBlockActive(block)
                      ? "bg-[#5eead4]/10 border-[#5eead4]/30"
                      : "bg-[#0a0a0a] border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isBlockActive(block)
                          ? "bg-[#5eead4]/20"
                          : "bg-[#1f1f1f]"
                      }`}
                    >
                      <Repeat
                        className={`w-5 h-5 ${
                          isBlockActive(block)
                            ? "text-[#5eead4]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{block.title}</p>
                        {isBlockActive(block) && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#5eead4] text-[#0a0a0a] rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {block.days?.join(", ")} • {formatTime(block.startTime)}{" "}
                        - {formatTime(block.endTime)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTimeBlock(block.id)}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* One-Time Time Blocks */}
        {oneTimeBlocks.length > 0 && (
          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Today's Blocks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {oneTimeBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    isBlockActive(block)
                      ? "bg-[#5eead4]/10 border-[#5eead4]/30"
                      : "bg-[#0a0a0a] border-[#2a2a2a]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isBlockActive(block)
                          ? "bg-[#5eead4]/20"
                          : "bg-[#1f1f1f]"
                      }`}
                    >
                      <Clock
                        className={`w-5 h-5 ${
                          isBlockActive(block)
                            ? "text-[#5eead4]"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{block.title}</p>
                        {isBlockActive(block) && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#5eead4] text-[#0a0a0a] rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {formatTime(block.startTime)} -{" "}
                        {formatTime(block.endTime)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTimeBlock(block.id)}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {timeBlocks.length === 0 && (
          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-center">
                No time blocks yet. Add your meetings to prevent workout
                notifications during busy times.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
