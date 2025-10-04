"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ActivityLog {
  activity: string
  status: "done" | "skip"
  timestamp: number
  calories: number
}

interface CalendarHeatmapProps {
  logs: ActivityLog[]
}

export function CalendarHeatmap({ logs }: CalendarHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Get last 12 weeks of data
    const weeks = 12
    const days = weeks * 7
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create array of dates
    const dates = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date)
    }

    // Count activities per day
    const activityCounts = new Map<string, number>()
    logs.forEach((log) => {
      if (log.status === "done") {
        const date = new Date(log.timestamp)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split("T")[0]
        activityCounts.set(dateKey, (activityCounts.get(dateKey) || 0) + 1)
      }
    })

    // Map dates to activity counts
    return dates.map((date) => {
      const dateKey = date.toISOString().split("T")[0]
      return {
        date,
        count: activityCounts.get(dateKey) || 0,
      }
    })
  }, [logs])

  // Get intensity color based on activity count
  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-[#1a1a1a]"
    if (count === 1) return "bg-[#5eead4]/20"
    if (count === 2) return "bg-[#5eead4]/40"
    if (count === 3) return "bg-[#5eead4]/60"
    if (count >= 4) return "bg-[#5eead4]/80"
    return "bg-[#1a1a1a]"
  }

  // Group by weeks
  const weeks = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    let lastMonth = -1

    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]
      const month = firstDay.date.getMonth()

      if (month !== lastMonth) {
        labels.push({
          month: firstDay.date.toLocaleDateString("en-US", { month: "short" }),
          weekIndex,
        })
        lastMonth = month
      }
    })

    return labels
  }, [weeks])

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="bg-[#151515] border-[#252525] shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg text-white">Activity Heatmap</CardTitle>
        <p className="text-sm text-gray-400">Last 12 weeks of activity</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month labels */}
            <div className="flex gap-[2px] mb-2 ml-8">
              {monthLabels.map((label, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-400"
                  style={{
                    marginLeft:
                      index === 0 ? 0 : `${(label.weekIndex - (monthLabels[index - 1]?.weekIndex || 0)) * 14}px`,
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] mr-2">
                {dayLabels.map((day, index) => (
                  <div key={day} className="h-3 flex items-center">
                    {index % 2 === 1 && <span className="text-[10px] text-gray-500">{day}</span>}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(day.count)} hover:ring-1 hover:ring-[#5eead4] transition-all cursor-pointer`}
                      title={`${day.date.toLocaleDateString()}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
                <div className="w-3 h-3 rounded-sm bg-[#5eead4]/20" />
                <div className="w-3 h-3 rounded-sm bg-[#5eead4]/40" />
                <div className="w-3 h-3 rounded-sm bg-[#5eead4]/60" />
                <div className="w-3 h-3 rounded-sm bg-[#5eead4]/80" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
