// Web Push Notification Utilities

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function notificationUnsupported(): boolean {
  if (typeof window === "undefined") return true;

  let unsupported = false;
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("showNotification" in ServiceWorkerRegistration.prototype)
  ) {
    unsupported = true;
  }
  return unsupported;
}

export function checkPermissionStateAndAct(
  onSubscribe: (subs: PushSubscription | null) => void
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  const state: NotificationPermission = Notification.permission;
  switch (state) {
    case "denied":
      console.log("Notification permission denied");
      break;
    case "granted":
      registerAndSubscribe(onSubscribe);
      break;
    case "default":
      console.log("Notification permission not yet requested");
      break;
  }
}

const SERVICE_WORKER_FILE_PATH = "/service-worker.js";

export async function registerAndSubscribe(
  onSubscribe: (subs: PushSubscription | null) => void
): Promise<void> {
  try {
    console.log("Registering service worker...");
    await navigator.serviceWorker.register(SERVICE_WORKER_FILE_PATH);
    console.log("Service worker registered successfully");
    await subscribe(onSubscribe);
  } catch (e) {
    console.error("Failed to register service-worker: ", e);
    onSubscribe(null);
  }
}

async function subscribe(
  onSubscribe: (subs: PushSubscription | null) => void
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("Service worker ready, subscribing to push...");

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as BufferSource,
    });

    console.info("Created subscription Object: ", subscription.toJSON());

    // Submit subscription to server
    await submitSubscription(subscription);
    onSubscribe(subscription);
  } catch (e) {
    console.error("Failed to subscribe cause of: ", e);
    onSubscribe(null);
  }
}

async function submitSubscription(
  subscription: PushSubscription
): Promise<void> {
  const endpointUrl = "/api/push/subscribe";
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    const result = await res.json();
    console.log("Subscription submitted:", result);
  } catch (error) {
    console.error("Failed to submit subscription:", error);
  }
}

export async function sendTestNotification(message: string): Promise<void> {
  try {
    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "FlowFit Test",
        body: message || "This is a test notification",
        icon: "/icon-192.jpg",
        badge: "/icon-192.jpg",
      }),
    });
    const result = await res.json();
    console.log("Notification sent:", result);
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
