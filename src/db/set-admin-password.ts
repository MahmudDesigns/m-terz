import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../lib/password";

const callSign = process.argv[2];
const password = process.argv[3];

async function main() {
  if (!callSign || !password) {
    console.log('Usage: npx tsx src/db/set-admin-password.ts CALLSIGN "NewPassword"');
    process.exit(1);
  }
  if (password.length < 10) {
    console.log("Password must be at least 10 characters.");
    process.exit(1);
  }
  const res = await db
    .update(users)
    .set({ passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null })
    .where(eq(users.callSign, callSign.toUpperCase()))
    .returning({ callSign: users.callSign });
  console.log(res.length ? `Password updated for ${res[0].callSign}` : "User not found");
  process.exit(0);
}

main();