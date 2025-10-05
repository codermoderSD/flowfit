"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2, Flame, TrendingUp, Target } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarHeatmap } from "@/components/calendar-heatmap"

interface ActivityLog {
  id: string
  activity_name: string
  calories: number
  body_area: string | null
  completed_at: string
}

export default function LogsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [todayLogs, setTodayLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  async function loadLogs() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

  // user is not consumed here; skip setting it to avoid unused-variable lint

    // Load all logs
    const { data: logsData } = await supabase
      .from("activity_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })

    if (logsData) {
      setLogs(logsData)

      // Filter today's logs
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayFiltered = logsData.filter((log) => {
        const logDate = new Date(log.completed_at)
        logDate.setHours(0, 0, 0, 0)
        return logDate.getTime() === today.getTime()
      })

      setTodayLogs(todayFiltered)
    }

    setIsLoading(false)
  }

  const calculateStats = () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000)

    const todayCal = logs
      .filter((log) => new Date(log.completed_at) >= todayStart)
      .reduce((sum, log) => sum + (log.calories || 0), 0)

    const weeklyCal = logs
      .filter((log) => new Date(log.completed_at) >= weekStart)
      .reduce((sum, log) => sum + (log.calories || 0), 0)

    const monthlyCal = logs
      .filter((log) => new Date(log.completed_at) >= monthStart)
      .reduce((sum, log) => sum + (log.calories || 0), 0)

    // Calculate streak
    const dateMap = new Map<string, number>()
    logs.forEach((log) => {
      const dateStr = new Date(log.completed_at).toDateString()
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
    })

    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toDateString()

      if (dateMap.has(dateStr)) {
        streak++
      } else {
        break
      }
    }

    return {
      todayCal,
      weeklyCal,
      monthlyCal,
      streak,
      completedToday: todayLogs.length,
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Activity Logs & Stats</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#ef4444]" />
                <CardTitle className="text-sm text-gray-400">Current Streak</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#5eead4]">{stats.streak} days</p>
            </CardContent>
          </Card>

          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#5eead4]" />
                <CardTitle className="text-sm text-gray-400">Today&apos;s Activities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#5eead4]">{stats.completedToday}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#151515] border-[#252525] shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#fbbf24]" />
                <CardTitle className="text-sm text-gray-400">Total Activities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[#5eead4]">{logs.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Calories */}
        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Calories Burned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-400 mb-1">Today</p>
                <p className="text-2xl font-bold text-[#5eead4]">{stats.todayCal}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">This Week</p>
                <p className="text-2xl font-bold text-[#5eead4]">{stats.weeklyCal}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">This Month</p>
                <p className="text-2xl font-bold text-[#5eead4]">{stats.monthlyCal}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Heatmap */}
        <CalendarHeatmap
          logs={logs.map((log) => ({
            activity: log.activity_name,
            status: "done",
            timestamp: new Date(log.completed_at).getTime(),
            calories: log.calories,
          }))}
        />

        {/* Today's Activity Log */}
        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Today&apos;s Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {todayLogs.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No activities logged today yet.</p>
              ) : (
                todayLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#5eead4]" />
                      <div>
                        <p className="text-sm text-white">{log.activity_name}</p>
                        {log.calories > 0 && <p className="text-xs text-gray-500">{log.calories} kcal burned</p>}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
