"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cross, Lock, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Led } from "@/components/ui";

const BOOT_LINES = [
  "ESTABLISHING SECURE CHANNEL …",
  "EPHEMERAL KEY EXCHANGE — OK",
  "CHANNEL CIPHER: AES-256-GCM — LOCKED",
  "IDENTITY VERIFIED AGAINST GARRISON ROSTER",
  "SYNCING TCCC PROTOCOL LIBRARY — OK",
  "ACCESS GRANTED — WELCOME TO THE NET",
];

const TICKER = [
  "TCCC PROTOCOLS SYNCED — REV 2025.11",
  "AES-256-GCM AT REST · ZERO PLAINTEXT STORAGE",
  "OFFLINE CAPABLE — QUEUED TRANSMISSIONS AUTOSYNC",
  "FOB SABER COC NET — SATCOM LINK NOMINAL",
  "NIGHT OPTIMIZED — NVG / AMBER / NSG DISPLAY MODES",
];

function RadarMark() {
  return (
    <div className="relative h-40 w-40 sm:h-48 sm:w-48">
      <div className="absolute inset-0 rounded-full border border-line" />
      <div className="absolute inset-4 rounded-full border border-line" />
      <div className="absolute inset-9 rounded-full border border-line" />
      <div className="absolute inset-0 rounded-full border border-line-strong opacity-60" />
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div
          className="radar-sweep absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg, var(--acc) 0deg, transparent 70deg, transparent 360deg)",
            opacity: 0.22,
          }}
        />
      </div>
      <div className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 bg-acc" />
      <div className="absolute top-[28%] left-[62%] h-1.5 w-1.5 bg-danger shadow-[0_0_8px_var(--danger)]" />
      <div className="absolute top-[66%] left-[35%] h-1 w-1 bg-acc" />
      <div className="absolute top-[49%] left-[70%] h-1 w-1 bg-warn" />
      <div className="absolute top-1/2 right-0 left-0 h-px bg-line" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-line" />
      <Cross size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-acc" strokeWidth={2.5} />
    </div>
  );
}

export default function LoginPage() {
    const router = useRouter();
  const [callSign, setCallSign] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"idle" | "boot" | "deny">("idle");
  const [bootLine, setBootLine] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [online] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 2600);
    return () => clearInterval(iv);
  }, []);

  const canSubmit = callSign.trim().length > 0 && password.length > 0;

  const authenticate = async () => {
    if (!canSubmit || phase === "boot") return;
    setPhase("boot");
    setBootLine(0);
    setError(null);
    for (let i = 0; i < BOOT_LINES.length; i++) {
      setBootLine(i);
      await new Promise((r) => setTimeout(r, i === BOOT_LINES.length - 1 ? 400 : 340));
    }
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callSign, password }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.error ?? "AUTH FAILED");
            router.replace(d.role === "admin" ? "/sysadmin" : "/");
    } catch (e) {
      setPhase("deny");
      setError(e instanceof Error ? e.message : "AUTH FAILED");
      setPassword("");
      setTimeout(() => setPhase("idle"), 2200);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* classification bars */}
      <div className="border-b border-line bg-panel px-4 py-1.5 text-center font-data text-[10px] tracking-[0.4em] text-acc">
        FOUO — GARRISON TRAINING NETWORK
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2 lg:gap-10">
        {/* ---------- brand panel ----------------------------------- */}
        <section className="relative flex flex-col justify-between gap-8 overflow-hidden border border-line bg-panel/70 p-6 sm:p-8">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <Led tone="ok" />
              <span className="font-data text-[10px] tracking-[0.3em] text-acc">SATCOM LINK SECURE</span>
              <Lock size={10} className="text-faint" />
            </div>
            <h1 className="mt-6 font-disp text-6xl leading-[0.9] font-bold tracking-[0.02em] text-ink sm:text-7xl">
              M-TERS
            </h1>
            <div className="mt-2 font-disp text-sm font-semibold tracking-[0.3em] text-acc">
              MILITARY TACTICAL EMERGENCY RESPONSE SYSTEM
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-dim">
              Replaces the radio-only 9-line, paper TCCC cards and the COC
              whiteboard. Encrypted casualty evacuation, hazard reporting and
              hands-free combat casualty care — built for the worst ten minutes
              of a bad day, readable under night vision, functional without a
              network.
            </p>
            <ul className="mt-6 space-y-1.5 font-data text-[11px] tracking-[0.12em] text-dim">
              {["▸ 9-LINE MEDEVAC WITH AUTO MGRS GRID", "▸ HANDS-FREE TCCC, PHASE-SORTED", "▸ IED / ENEMY / UXO HAZARD NET", "▸ LIVE DIGITAL COMMAND LOGBOOK"].map((l, i) => (
                <motion.li
                  key={l}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                >
                  {l}
                </motion.li>
              ))}
            </ul>
          </div>
          <div className="relative mt-8 flex items-end justify-between gap-4">
            <RadarMark />
            <div className="hidden flex-col items-end gap-1 text-right sm:flex">
              <span className="font-data text-[10px] tracking-[0.25em] text-faint">FOB SABER</span>
              <span className="font-data text-[10px] tracking-[0.25em] text-faint">2-16 IN GARRISON</span>
              <span className="font-data mt-2 text-[10px] tracking-[0.25em] text-acc">REV 4.2.1</span>
            </div>
          </div>
        </section>

        {/* ---------- auth panel ------------------------------------- */}
        <section className="flex flex-col border border-line bg-panel/70">
          <div className="border-b border-line px-6 py-4">
            <div className="font-data text-[10px] tracking-[0.3em] text-faint">SECURE TERMINAL ACCESS</div>
            <h2 className="mt-1 font-disp text-2xl font-bold tracking-[0.06em] text-ink">
              IDENTIFY YOURSELF
            </h2>
            <div className="mt-1 flex items-center gap-2 font-data text-[10px] tracking-[0.15em] text-dim">
              {online ? <Wifi size={10} /> : <WifiOff size={10} />} ENTER CALLSIGN AND PASSCODE — SESSION IS HMAC-SIGNED, 12H TTL
            </div>
          </div>

                    <div className="grid-bg flex-1 space-y-5 p-6">
            <div>
              <label className="font-data mb-2 block text-[10px] tracking-[0.3em] text-faint">
                CALLSIGN
              </label>
              <input
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                autoComplete="username"
                autoCapitalize="characters"
                placeholder="e.g. SABER-6"
                className="font-data w-full border border-line bg-panel2/60 px-3 py-3 text-sm tracking-[0.1em] text-ink uppercase outline-none focus:border-acc"
              />
            </div>
            <div>
              <label className="font-data mb-2 block text-[10px] tracking-[0.3em] text-faint">
                PASSCODE
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && authenticate()}
                autoComplete="current-password"
                className="font-data w-full border border-line bg-panel2/60 px-3 py-3 text-sm tracking-[0.1em] text-ink outline-none focus:border-acc"
              />
            </div>
          </div>

          <div className="border-t border-line p-6">
                        <button
              onClick={authenticate}
              disabled={!canSubmit || phase === "boot"}
              className={`glow-pulse font-disp flex w-full items-center justify-center gap-2 border py-3.5 text-lg font-bold tracking-[0.15em] transition-colors ${
                canSubmit
                  ? "border-acc bg-acc text-bg0 hover:bg-acc2"
                  : "cursor-not-allowed border-line bg-panel2 text-faint"
              }`}
            >
              <ShieldCheck size={18} />
              {phase === "boot" ? "AUTHENTICATING …" : "AUTHENTICATE"}
            </button>
            <div className="mt-3 text-center font-data text-[9px] tracking-[0.25em] text-faint">
              UNAUTHORIZED ACCESS IS PROHIBITED · ALL SESSIONS LOGGED
            </div>
          </div>
        </section>
      </div>

      {/* ticker */}
      <div className="overflow-hidden border-t border-line bg-panel px-4 py-1.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tick % TICKER.length}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-center font-data text-[10px] tracking-[0.3em] text-dim"
          >
            {TICKER[tick % TICKER.length]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* boot overlay */}
      <AnimatePresence>
        {phase !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-bg0/95 p-6 backdrop-blur-sm"
          >
            <div className="t-corners w-full max-w-md border border-line bg-panel p-6">
              <div className="font-data text-[10px] tracking-[0.3em] text-faint">
                {phase === "deny" ? "ACCESS CONTROL" : "HANDSHAKE IN PROGRESS"}
              </div>
              <div className="mt-4 space-y-2">
                {phase === "deny" ? (
                  <div className="font-data text-sm tracking-[0.1em] text-danger">
                    ACCESS DENIED — {error}
                    <div className="mt-2 text-[11px] text-dim">TERMINAL SESSION REJECTED BY COC. RETRY OR REPORT.</div>
                  </div>
                ) : (
                  BOOT_LINES.slice(0, bootLine + 1).map((l, i) => (
                    <motion.div
                      key={l}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`font-data text-[12px] tracking-[0.08em] ${i === bootLine ? "text-acc" : "text-dim"}`}
                    >
                      {l}
                      {i === bootLine && <span className="led ml-1 text-acc">▊</span>}
                    </motion.div>
                  ))
                )}
              </div>
              <div className="mt-5 h-1 w-full border border-line bg-bg1">
                <motion.div
                  className={`h-full ${phase === "deny" ? "bg-danger" : "bg-acc"}`}
                  initial={{ width: "4%" }}
                  animate={{ width: phase === "deny" ? "100%" : `${((bootLine + 1) / BOOT_LINES.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
