import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID details
webpush.setVapidDetails(
  'mailto:flowfit@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// In-memory storage for subscriptions (use database in production)
// We use a singleton pattern to share state across API routes
let subscriptions: Map<string, webpush.PushSubscription>;

// Initialize subscriptions map
if (!(global as any).pushSubscriptions) {
  (global as any).pushSubscriptions = new Map();
}
subscriptions = (global as any).pushSubscriptions;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subscription = body.subscription;
    
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
