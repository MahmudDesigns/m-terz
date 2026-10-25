import "dotenv/config";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";
import { hashPassword } from "../lib/password";

const randomPassword = () => crypto.randomBytes(9).toString("base64url");

async function main() {
  const out: { callSign: string; role: string; password: string }[] = [];

  const rows = await db.select().from(users);
  for (const u of rows) {
    if (u.passwordHash) continue;
    const pw = randomPassword();
    await db.update(users).set({ passwordHash: hashPassword(pw) }).where(eq(users.id, u.id));
    out.push({ callSign: u.callSign, role: u.role, password: pw });
  }

  const adminExists = rows.some((u) => u.callSign === "ADMIN-1");
  if (!adminExists) {
    const pw = randomPassword();
    await db.insert(users).values({
      callSign: "ADMIN-1",
      fullName: "System Administrator",
      rank: "CIV",
      role: "admin",
      unitCode: "SABER-HQ",
      tcccLevel: "ALL",
      passwordHash: hashPassword(pw),
    });
    out.push({ callSign: "ADMIN-1", role: "admin", password: pw });
  }

  console.table(out);
  console.log("SAVE THESE NOW. They are only shown once.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});