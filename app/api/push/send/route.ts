import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure VAPID details
webpush.setVapidDetails(
  "mailto:flowfit@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

// Access the shared subscriptions map in a type-safe way
type PushSub = webpush.PushSubscription;

declare global {
  interface GlobalThis {
    pushSubscriptions?: Map<string, PushSub>;
  }
}

type GlobalWithPush = { pushSubscriptions?: Map<string, PushSub> } & typeof globalThis;
const g = globalThis as GlobalWithPush;
if (!g.pushSubscriptions) {
  g.pushSubscriptions = new Map<string, PushSub>();
}
const subscriptions = g.pushSubscriptions as Map<string, PushSub>;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: string;
      body?: string;
      icon?: string;
      badge?: string;
      url?: string;
      subscription?: webpush.PushSubscription;
    };
    const { title, body: messageBody, icon, badge, url, subscription: targetSubscription } = body;

    console.log(
      "Send request received. Total subscriptions:",
      subscriptions.size
    );

    // Use provided subscription or send to all subscriptions
    const subsToSend: webpush.PushSubscription[] = [];

    if (targetSubscription) {
      subsToSend.push(targetSubscription);
    } else {
      // Send to all subscriptions
      subscriptions.forEach((sub) => subsToSend.push(sub));
    }

    if (subsToSend.length === 0) {
      return NextResponse.json(
        { success: false, message: "No push subscriptions found" },
        { status: 400 }
      );
    }

    const pushPayload = JSON.stringify({
      title: title || "FlowFit",
      body: messageBody || "Time to move!",
      icon: icon || "/icon-192.jpg",
      badge: badge || "/icon-192.jpg",
      url: url || "/",
    });

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subsToSend.map((sub) => webpush.sendNotification(sub, pushPayload))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `Push notifications sent: ${successful} successful, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Push notification sent to ${successful} devices`,
      details: { successful, failed, total: subsToSend.length },
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to send push notification",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
