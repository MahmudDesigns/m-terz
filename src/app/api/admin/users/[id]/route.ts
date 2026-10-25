import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, netEvents } from "@/db/schema";
import { getAdmin } from "@/lib/admin";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdmin();
  if (!admin) return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

  const { id } = await params;
  const b = await req.json().catch(() => null);
  const action = String(b?.action ?? "");

  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return Response.json({ ok: false, error: "USER NOT FOUND" }, { status: 404 });

  if (action === "reset") {
    const password = crypto.randomBytes(9).toString("base64url");
    await db
      .update(users)
      .set({ passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null })
      .where(eq(users.id, id));
    await db.insert(netEvents).values({
      kind: "auth",
      message: `${admin.callSign} reset password for ${target.callSign}`,
      actor: admin.callSign,
    });
    return Response.json({ ok: true, password });
  }

  if (action === "suspend" || action === "activate") {
    if (action === "suspend" && target.id === admin.id) {
      return Response.json({ ok: false, error: "YOU CANNOT SUSPEND YOURSELF" }, { status: 400 });
    }
    const status = action === "suspend" ? "suspended" : "active";
    await db.update(users).set({ status }).where(eq(users.id, id));
    await db.insert(netEvents).values({
      kind: "auth",
      message: `${admin.callSign} ${status === "suspended" ? "suspended" : "reactivated"} ${target.callSign}`,
      actor: admin.callSign,
    });
    return Response.json({ ok: true });
  }

  return Response.json({ ok: false, error: "UNKNOWN ACTION" }, { status: 400 });
}