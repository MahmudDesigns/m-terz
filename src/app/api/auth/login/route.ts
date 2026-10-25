import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, netEvents } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { setSession } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const callSign = String(body?.callSign ?? "").trim().toUpperCase();
  const password = String(body?.password ?? "");

  const fail = () =>
    Response.json({ ok: false, error: "INVALID CALLSIGN OR PASSCODE" }, { status: 401 });

  if (!callSign || !password) return fail();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(sql`upper(${users.callSign})`, callSign))
    .limit(1);

  if (!user || user.status !== "active" || !user.passwordHash) return fail();

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return Response.json(
      { ok: false, error: "ACCOUNT LOCKED. TRY AGAIN IN 15 MINUTES" },
      { status: 429 },
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    const fails = user.failedLogins + 1;
    await db
      .update(users)
      .set({
        failedLogins: fails >= MAX_FAILS ? 0 : fails,
        lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MS) : null,
      })
      .where(eq(users.id, user.id));
    return fail();
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await db.insert(netEvents).values({
    kind: "auth",
    message: `${user.callSign} authenticated`,
    actor: user.callSign,
  });
  await setSession(user.id);

  return Response.json({ ok: true, role: user.role });
}