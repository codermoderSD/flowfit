"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const validateEmail = (val: string) => /\S+@\S+\.\S+/.test(val);

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Name is required");
    if (!validateEmail(email)) return setError("Please enter a valid email");
    if (password.length < 6)
      return setError("Password must be at least 6 characters");

    setIsLoading(true);
    const supabase = createClient();

    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      // eslint-disable-next-line no-console
      console.log("supabase signUp response:", res);

      if (res.error) throw res.error;

      // signup succeeded - redirect to home (or show a check-your-email message)
      router.push("/");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during signup"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!validateEmail(email)) return setError("Please enter a valid email");
    if (password.length < 6)
      return setError("Password must be at least 6 characters");

    setIsLoading(true);
    const supabase = createClient();

    try {
      const res = await supabase.auth.signInWithPassword({ email, password });

      // eslint-disable-next-line no-console
      console.log("supabase signInWithPassword response:", res);

      if (res.error) throw res.error;

      router.push("/");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during signin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        <Card className="bg-[#151515] border-white/10">
          <CardHeader className="text-center">
            <Image
              src="/logo.png"
              alt="FlowFit Logo"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <CardTitle className="text-2xl text-white">
              Welcome to FlowFit
            </CardTitle>
            <CardDescription className="text-gray-400">
              Stay active and productive throughout your workday
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={mode === "signup" ? handleSignup : handleSignin}
            >
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
              >
                {isLoading
                  ? mode === "signup"
                    ? "Signing up..."
                    : "Signing in..."
                  : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
              </Button>

              <p className="text-center text-xs text-gray-500">
                {mode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setMode("signin")}
                    >
                      Sign in
                    </button>
                  </>
                ) : (
                  <>
                    New here?{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => setMode("signup")}
                    >
                      Create an account
                    </button>
                  </>
                )}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
