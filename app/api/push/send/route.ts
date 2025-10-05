import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

// Configure VAPID details
webpush.setVapidDetails(
  "mailto:flowfit@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Access the shared subscriptions map
let subscriptions: Map<string, webpush.PushSubscription>;
if (!(global as any).pushSubscriptions) {
  (global as any).pushSubscriptions = new Map();
}
subscriptions = (global as any).pushSubscriptions;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      body: messageBody,
      icon,
      badge,
      url,
      subscription: targetSubscription,
    } = body;

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
