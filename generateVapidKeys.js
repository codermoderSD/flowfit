const webPush = require("web-push");
const fs = require("fs");
const path = require("path");

const vapidKeys = webPush.generateVAPIDKeys();

const envPath = path.join(__dirname, ".env.local");
let existingEnv = "";

// Read existing .env.local if it exists
try {
  existingEnv = fs.readFileSync(envPath, "utf8");
} catch (e) {
  // File doesn't exist, that's okay
}

// Remove existing VAPID keys if present
existingEnv = existingEnv
  .split("\n")
  .filter(
    (line) =>
      !line.startsWith("NEXT_PUBLIC_VAPID_PUBLIC_KEY=") &&
      !line.startsWith("VAPID_PRIVATE_KEY=")
  )
  .join("\n");

// Add new VAPID keys
const vapidKeysEnv = `
# VAPID Keys for Web Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`;

const finalEnv = existingEnv.trim() + "\n" + vapidKeysEnv;

fs.writeFileSync(envPath, finalEnv.trim() + "\n", { flag: "w" });

console.log("✓ VAPID keys generated and saved to .env.local");
console.log("Public Key:", vapidKeys.publicKey);
