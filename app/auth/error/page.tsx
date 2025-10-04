import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        <Card className="bg-[#151515] border-white/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-white">Authentication Error</CardTitle>
            <CardDescription className="text-gray-400">Something went wrong during authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-teal-500 hover:bg-teal-600">
              <Link href="/auth/login">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
