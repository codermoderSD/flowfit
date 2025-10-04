"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const DEFAULT_ACTIVITIES = [
  "10 pushups",
  "15 squats",
  "30-second plank",
  "Drink a glass of water",
  "Neck rolls (10 each direction)",
  "Walk around the house for 2 minutes",
  "20 calf raises",
  "10 lunges (each leg)",
  "15 jumping jacks",
  "Stretch your arms overhead for 30 seconds",
]

export default function ActivitiesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [activities, setActivities] = useState<Array<{ id: string; name: string }>>([])
  const [newActivity, setNewActivity] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    setUser(user)

    // Load activities from Supabase
    const { data: activitiesData } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (activitiesData && activitiesData.length > 0) {
      setActivities(activitiesData)
    } else {
      // Initialize with default activities
      const defaultActivitiesData = DEFAULT_ACTIVITIES.map((name) => ({
        user_id: user.id,
        name,
      }))

      const { data: insertedData } = await supabase.from("activities").insert(defaultActivitiesData).select()

      if (insertedData) {
        setActivities(insertedData)
      }
    }

    setIsLoading(false)
  }

  const addActivity = async () => {
    if (!user || !newActivity.trim()) return

    const { data, error } = await supabase
      .from("activities")
      .insert({ user_id: user.id, name: newActivity.trim() })
      .select()
      .single()

    if (data && !error) {
      setActivities([...activities, data])
      setNewActivity("")
    }
  }

  const removeActivity = async (id: string) => {
    if (!user) return

    const { error } = await supabase.from("activities").delete().eq("id", id).eq("user_id", user.id)

    if (!error) {
      setActivities(activities.filter((a) => a.id !== id))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5 text-gray-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-white">Manage Activities</h1>
        </div>

        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Add Custom Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 20 burpees"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addActivity()}
                className="bg-[#0a0a0a] border-[#2a2a2a] focus:border-[#5eead4] text-white placeholder:text-gray-500"
              />
              <Button
                onClick={addActivity}
                className="bg-gradient-to-r from-[#5eead4] to-[#14b8a6] hover:from-[#4dd4bf] hover:to-[#0d9488] text-[#0a0a0a] shadow-lg shadow-teal-500/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#151515] border-[#252525] shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">All Activities ({activities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                >
                  <span className="text-sm text-white">{activity.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActivity(activity.id)}
                    className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400 text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
