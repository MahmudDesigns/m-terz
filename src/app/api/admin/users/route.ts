import crypto from "crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, units, netEvents } from "@/db/schema";
import { getAdmin } from "@/lib/admin";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ROLES = ["field", "medic", "command", "admin"];
const TCCC = ["ALL", "CLS", "CMC"];

const forbidden = () =>
  Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

export async function GET() {
  if (!(await getAdmin())) return forbidden();

  const rows = await db
    .select({
      id: users.id,
      callSign: users.callSign,
      fullName: users.fullName,
      rank: users.rank,
      role: users.role,
      unitCode: users.unitCode,
      status: users.status,
      lockedUntil: users.lockedUntil,
    })
    .from(users)
    .orderBy(asc(users.role), asc(users.callSign));

  const unitRows = await db
    .select({ code: units.code, name: units.name })
    .from(units)
    .orderBy(asc(units.code));

  return Response.json({ ok: true, users: rows, units: unitRows });
}

export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return forbidden();

  const b = await req.json().catch(() => null);
  const callSign = String(b?.callSign ?? "").trim().toUpperCase();
  const fullName = String(b?.fullName ?? "").trim();
  const rank = String(b?.rank ?? "").trim().toUpperCase();
  const role = String(b?.role ?? "");
  const unitCode = String(b?.unitCode ?? "");
  const tcccLevel = TCCC.includes(b?.tcccLevel) ? b.tcccLevel : "CLS";

  if (!callSign || !fullName || !rank || !ROLES.includes(role) || !unitCode) {
    return Response.json({ ok: false, error: "MISSING OR INVALID FIELDS" }, { status: 400 });
  }

  const [unit] = await db.select().from(units).where(eq(units.code, unitCode)).limit(1);
  if (!unit) {
    return Response.json({ ok: false, error: "UNKNOWN UNIT" }, { status: 400 });
  }

  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`upper(${users.callSign})`, callSign))
    .limit(1);
  if (dup) {
    return Response.json({ ok: false, error: "CALLSIGN ALREADY EXISTS" }, { status: 409 });
  }

  const password = crypto.randomBytes(9).toString("base64url");
  await db.insert(users).values({
    callSign,
    fullName,
    rank,
    role,
    unitCode,
    tcccLevel,
    passwordHash: hashPassword(password),
  });
  await db.insert(netEvents).values({
    kind: "auth",
    message: `${admin.callSign} created user ${callSign}`,
    actor: admin.callSign,
  });

  return Response.json({ ok: true, callSign, password });
}