"use client";

import { useState } from "react";

type FormState = { nom: string; email: string; telephone: string; filiere: string; pourquoi: string; motivation: string; site_web: string };
const INITIAL_STATE: FormState = { nom: "", email: "", telephone: "", filiere: "", pourquoi: "", motivation: "", site_web: "" };

export default function ApplicationForm() {
  const [form, setForm] = useState(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const update = (key: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setStatus("sending"); setErrorMsg("");
    try {
      const res = await fetch("/api/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setStatus("error"); setErrorMsg(data.error || "Une erreur est survenue."); return; }
      setStatus("sent");
    } catch { setStatus("error"); setErrorMsg("Network error. Please try again in a moment."); }
  }
  return <main className="min-h-screen flex items-center justify-center px-4 py-12 sm:py-16">
    <div className="w-full max-w-3xl">
      <div className="flex items-center gap-3 mb-6"><img src="/logo.jpg" alt="ENISo CyberGuards" className="size-14 rounded-xl logo-glow" /><div><p className="text-xs text-cyan">ENISo CYBERGUARDS</p><p className="text-xs text-slate-400">secure recruitment channel</p></div></div>
      <div className="terminal-window rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-900/70"><span className="size-2.5 rounded-full bg-pink-400" /><span className="size-2.5 rounded-full bg-amber-300" /><span className="size-2.5 rounded-full bg-emerald-400" /><span className="ml-3 text-xs text-slate-400">recruitment / candidate-profile</span></div>
        <div className="p-6 sm:p-9"><h1 className="glitch-text text-2xl sm:text-3xl font-bold">access granted<span className="text-cyan">.</span></h1><p className="text-slate-400 mt-2 mb-7 max-w-xl">Final step: introduce yourself to the team. Your answers will be sent to our recruitment team.</p>
          {status === "sent" ? <div className="rounded-xl border border-cyan/50 bg-cyan/10 p-6 text-cyan">✓ Application submitted. The team will contact you soon.<span className="animate-blink">_</span></div> : <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <input className="field-input" required placeholder="Full name" value={form.nom} onChange={(e) => update("nom", e.target.value)} />
            <input className="field-input" required type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <input className="field-input" required type="tel" placeholder="Phone number" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
            <input className="field-input" required placeholder="Major / Section" value={form.filiere} onChange={(e) => update("filiere", e.target.value)} />
            <textarea className="field-input resize-none sm:col-span-2" required minLength={15} rows={3} placeholder="Why didn&apos;t you join the team during the first call?" value={form.pourquoi} onChange={(e) => update("pourquoi", e.target.value)} />
            <textarea className="field-input resize-none sm:col-span-2" required minLength={20} rows={5} placeholder="Why do you want to join ENISo CyberGuards?" value={form.motivation} onChange={(e) => update("motivation", e.target.value)} />
            <button className="sm:col-span-2 rounded-lg border border-cyan bg-cyan/10 px-5 py-3 font-bold text-cyan transition hover:bg-cyan hover:text-slate-950 disabled:opacity-50" disabled={status === "sending"}>{status === "sending" ? "submitting..." : "submit application →"}</button>
            {status === "error" && <p className="sm:col-span-2 text-pink-400 text-sm">✕ {errorMsg}</p>}
          </form>}
        </div>
      </div><p className="text-center text-xs text-slate-500 mt-4">ENISo CyberGuards — National Engineering School of Sousse</p>
    </div>
  </main>;
}
