"use client";

import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Settings {
  work_start: string;
  work_end: string;
  interval: number;
  major_break_interval: number;
  major_break_duration: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<Settings>({
    work_start: "09:00",
    work_end: "17:00",
    interval: 60,
    major_break_interval: 4,
    major_break_duration: 15,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    setUser(user);

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

    setIsLoading(false);
  };

  const saveSettings = async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          work_start: settings.work_start,
          work_end: settings.work_end,
          interval: settings.interval,
          major_break_interval: settings.major_break_interval,
          major_break_duration: settings.major_break_duration,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      setIsSaving(false);

      if (error) {
        console.error("Failed to save settings:", error);
        toast({ title: "Failed to save settings", description: error.message });
        return;
      }

      // Persist to localStorage so Home can pick it up immediately
      try {
        localStorage.setItem("flowFitSettings", JSON.stringify(settings));
      } catch (e) {
        // ignore
      }

      // Request notification permission if not granted
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      toast({ title: "Settings saved successfully!" });

      // Go back to home where the timer will use the updated settings
      router.push("/");
    } catch (err) {
      setIsSaving(false);
      console.error(err);
      toast({ title: "An unexpected error occurred while saving settings." });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Settings</h1>
        </div>

        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Work Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workStart" className="text-gray-300">
                  Start Time
                </Label>
                <Input
                  id="workStart"
                  type="time"
                  value={settings.work_start}
                  onChange={(e) =>
                    setSettings({ ...settings, work_start: e.target.value })
                  }
                  className="bg-[#0a0a0a] border-[#2a2a2a] focus:border-[#5eead4] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workEnd" className="text-gray-300">
                  End Time
                </Label>
                <Input
                  id="workEnd"
                  type="time"
                  value={settings.work_end}
                  onChange={(e) =>
                    setSettings({ ...settings, work_end: e.target.value })
                  }
                  className="bg-[#0a0a0a] border-[#2a2a2a] focus:border-[#5eead4] text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Reminder Interval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Work Interval</Label>
                <span className="text-lg font-semibold text-[#5eead4]">
                  {settings.interval} minutes
                </span>
              </div>
              <Slider
                value={[settings.interval]}
                onValueChange={(value) =>
                  setSettings({ ...settings, interval: value[0] })
                }
                min={15}
                max={120}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>15 min</span>
                <span>120 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Major Break Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Major Break After</Label>
                <span className="text-lg font-semibold text-[#5eead4]">
                  {settings.major_break_interval}{" "}
                  {settings.major_break_interval === 1 ? "cycle" : "cycles"}
                </span>
              </div>
              <Slider
                value={[settings.major_break_interval]}
                onValueChange={(value) =>
                  setSettings({ ...settings, major_break_interval: value[0] })
                }
                min={2}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>2 cycles</span>
                <span>10 cycles</span>
              </div>
              <p className="text-xs text-gray-500">
                After every {settings.major_break_interval} work cycles, you'll
                get a longer break
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Major Break Duration</Label>
                <span className="text-lg font-semibold text-[#5eead4]">
                  {settings.major_break_duration} minutes
                </span>
              </div>
              <Slider
                value={[settings.major_break_duration]}
                onValueChange={(value) =>
                  setSettings({ ...settings, major_break_duration: value[0] })
                }
                min={10}
                max={30}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10 min</span>
                <span>30 min</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] font-semibold shadow-lg shadow-teal-500/20"
          size="lg"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
