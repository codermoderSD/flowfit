import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID details
webpush.setVapidDetails(
  'mailto:flowfit@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string,
);

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
    const body = (await request.json()) as { subscription: PushSub };
  const subscription: PushSub = body.subscription;

  // Use endpoint as unique identifier
  const userId = subscription.endpoint;
  subscriptions.set(userId, subscription);
    
    console.log('Subscription saved for:', userId);
    console.log('Total subscriptions:', subscriptions.size);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    totalSubscriptions: subscriptions.size,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY 
  });
}
