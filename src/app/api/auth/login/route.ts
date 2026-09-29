import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setSession } from "@/lib/crypto";
import { logEvent } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "BAD REQUEST" }, { status: 400 });
  }
  if (!body.userId) {
    return Response.json({ ok: false, error: "IDENTITY REQUIRED" }, { status: 400 });
  }
  const rows = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  const u = rows[0];
  if (!u || u.status !== "active") {
    return Response.json({ ok: false, error: "IDENTITY NOT RECOGNIZED" }, { status: 403 });
  }
  await setSession(u.id);
  await logEvent("auth", `${u.callSign} AUTHENTICATED ON SECURE TERMINAL`, null, u.callSign);
  return Response.json({
    ok: true,
    user: {
      id: u.id,
      callSign: u.callSign,
      rank: u.rank,
      role: u.role,
      unitCode: u.unitCode,
    },
  });
}
