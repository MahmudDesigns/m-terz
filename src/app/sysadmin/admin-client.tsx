"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type U = {
  id: string;
  callSign: string;
  fullName: string;
  rank: string;
  role: string;
  unitCode: string;
  status: string;
  lockedUntil: string | null;
};
type Unit = { code: string; name: string };

const inputCls =
  "font-data w-full border border-line bg-panel2/60 px-3 py-2 text-sm text-ink outline-none focus:border-acc";
const btnCls =
  "font-data border border-line px-2.5 py-1 text-[10px] tracking-[0.15em] text-dim hover:border-acc hover:text-acc";

export default function AdminClient({ me }: { me: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<U[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    callSign: "",
    fullName: "",
    rank: "",
    role: "field",
    unitCode: "",
    tcccLevel: "CLS",
  });

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/users");
    const d = await r.json();
    if (!r.ok || !d.ok) {
      router.replace("/login");
      return;
    }
    setUsers(d.users);
    setUnits(d.units);
    setForm((f) => (f.unitCode ? f : { ...f, unitCode: d.units[0]?.code ?? "" }));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setNotice(null);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) return setError(d.error ?? "FAILED");
    setNotice(`USER ${d.callSign} CREATED. PASSWORD: ${d.password} (SHOWN ONCE, COPY IT NOW)`);
    setForm({ ...form, callSign: "", fullName: "", rank: "" });
    load();
  };

    const act = async (u: U, action: "reset" | "suspend" | "activate") => {
    setError(null);
    setNotice(null);
    if (action === "reset" && !confirm(`Reset the password for ${u.callSign}?`)) return;
    if (action === "suspend" && !confirm(`Suspend ${u.callSign}?`)) return;
    try {
      const r = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) {
        setError(d.error ?? "FAILED");
      } else if (action === "reset") {
        setNotice(`NEW PASSWORD FOR ${u.callSign}: ${d.password} (SHOWN ONCE, COPY IT NOW)`);
      }
    } catch {
      setError("REQUEST FAILED. CHECK THE TERMINAL FOR ERRORS.");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    load();
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between border border-line bg-panel/70 px-4 py-3">
        <div>
          <div className="font-data text-[10px] tracking-[0.3em] text-faint">M-TERS ADMINISTRATION</div>
          <h1 className="font-disp text-2xl font-bold tracking-[0.06em] text-ink">USER MANAGEMENT</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-data text-[11px] tracking-[0.15em] text-acc">{me}</span>
          <button onClick={signOut} className={btnCls}>SIGN OUT</button>
        </div>
      </div>

      {notice && (
        <div className="font-data border border-acc bg-acc/10 px-4 py-3 text-sm tracking-[0.08em] break-all text-acc">
          {notice}
        </div>
      )}
      {error && (
        <div className="font-data border border-danger px-4 py-3 text-sm tracking-[0.08em] text-danger">
          {error}
        </div>
      )}

      <section className="border border-line bg-panel/70 p-4">
        <h2 className="font-disp mb-3 text-lg font-bold tracking-[0.08em] text-ink">CREATE USER</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={`${inputCls} uppercase`} placeholder="CALLSIGN" value={form.callSign} onChange={(e) => set("callSign", e.target.value)} />
          <input className={inputCls} placeholder="Full name" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
          <input className={`${inputCls} uppercase`} placeholder="RANK (e.g. SGT)" value={form.rank} onChange={(e) => set("rank", e.target.value)} />
          <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="field">field</option>
            <option value="medic">medic</option>
            <option value="command">command</option>
            <option value="admin">admin</option>
          </select>
          <select className={inputCls} value={form.unitCode} onChange={(e) => set("unitCode", e.target.value)}>
            {units.map((u) => (
              <option key={u.code} value={u.code}>{u.code} — {u.name}</option>
            ))}
          </select>
          <select className={inputCls} value={form.tcccLevel} onChange={(e) => set("tcccLevel", e.target.value)}>
            <option value="ALL">TCCC: ALL</option>
            <option value="CLS">TCCC: CLS</option>
            <option value="CMC">TCCC: CMC</option>
          </select>
        </div>
        <button onClick={create} className="font-disp mt-4 border border-acc bg-acc px-5 py-2 font-bold tracking-[0.15em] text-bg0 hover:bg-acc2">
          CREATE
        </button>
      </section>

      <section className="overflow-x-auto border border-line bg-panel/70">
        <table className="w-full text-left">
          <thead>
            <tr className="font-data border-b border-line text-[10px] tracking-[0.2em] text-faint">
              <th className="px-3 py-2">CALLSIGN</th>
              <th className="px-3 py-2">NAME</th>
              <th className="px-3 py-2">ROLE</th>
              <th className="px-3 py-2">UNIT</th>
              <th className="px-3 py-2">STATUS</th>
              <th className="px-3 py-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
              return (
                <tr key={u.id} className="border-b border-line/50 text-sm text-ink">
                  <td className="font-data px-3 py-2 tracking-[0.08em]">{u.rank} {u.callSign}</td>
                  <td className="px-3 py-2">{u.fullName}</td>
                  <td className="font-data px-3 py-2 text-[11px] tracking-[0.12em] uppercase">{u.role}</td>
                  <td className="font-data px-3 py-2 text-[11px]">{u.unitCode}</td>
                  <td className={`font-data px-3 py-2 text-[11px] tracking-[0.12em] uppercase ${u.status === "active" ? "text-acc" : "text-danger"}`}>
                    {u.status}{locked ? " · LOCKED" : ""}
                  </td>
                  <td className="space-x-2 px-3 py-2 whitespace-nowrap">
                    <button className={btnCls} onClick={() => act(u, "reset")}>RESET PASSWORD</button>
                    {u.status === "active" ? (
                      <button className={btnCls} onClick={() => act(u, "suspend")} disabled={u.callSign === me}>SUSPEND</button>
                    ) : (
                      <button className={btnCls} onClick={() => act(u, "activate")}>ACTIVATE</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}