"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  // Use react-hot-toast's built-in Toaster for notifications. The project
  // uses a lightweight wrapper `use-toast` that delegates to react-hot-toast.
  return <HotToaster position="top-right" />;
}
