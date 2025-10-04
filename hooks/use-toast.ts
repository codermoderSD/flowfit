"use client";

import { toast as hotToast } from "react-hot-toast";

// Lightweight wrapper keeping the original API surface (toast, useToast)
// so other files can keep calling `toast(...)`.

function toast(
  opts: { title?: string; description?: string; duration?: number } | string
) {
  if (typeof opts === "string") {
    return hotToast(opts);
  }

  const msg = opts.title
    ? `${opts.title}${opts.description ? ` — ${opts.description}` : ""}`
    : opts.description || "";
  return hotToast(msg, { duration: opts.duration ?? 4000 });
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => {
      if (id) hotToast.dismiss(id);
      else hotToast.dismiss();
    },
  };
}

export { useToast, toast };
