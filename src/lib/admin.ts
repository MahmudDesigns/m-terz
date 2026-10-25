import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/crypto";

export async function getAdmin() {
  const id = await getSessionUserId();
  if (!id) return null;
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u || u.role !== "admin" || u.status !== "active") return null;
  return u;
}