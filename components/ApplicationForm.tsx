"use client";

import { useState } from "react";

type FormState = {
  nom: string;
  email: string;
  filiere: string;
  motivation: string;
  site_web: string; // honeypot
};

const INITIAL_STATE: FormState = {
  nom: "",
  email: "",
  filiere: "",
  motivation: "",
  site_web: "",
};

export default function ApplicationForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Une erreur est survenue.");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMsg("Erreur réseau. Réessaie dans un instant.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 animate-flicker">
      <div className="w-full max-w-2xl">
        <div className="terminal-window rounded-lg overflow-hidden relative">
          <div className="scan-beam absolute w-full animate-scan" />

          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
            <span className="w-3 h-3 rounded-full bg-magenta/70" />
            <span className="w-3 h-3 rounded-full bg-mint-dim" />
            <span className="w-3 h-3 rounded-full bg-mint/70" />
            <span className="ml-3 text-xs text-text-dim">
              root@eniso-cyberguards:~/candidature
            </span>
          </div>

          <div className="p-6 sm:p-8 text-sm">
            <h1 className="text-mint glow-text text-xl sm:text-2xl font-bold mb-1">
              ✓ accès accordé
            </h1>
            <p className="text-text-dim mb-6">
              Bienvenue. Remplis ce formulaire pour candidater au club ENISo CyberGuards.
            </p>

            {status === "sent" ? (
              <div className="text-mint glow-text">
                ✓ candidature enregistrée. on te recontacte bientôt
                <span className="animate-blink">_</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot anti-spam — caché visuellement, jamais rempli par un humain */}
                <div className="absolute -left-[9999px]" aria-hidden="true">
                  <label htmlFor="site_web">Site web</label>
                  <input
                    id="site_web"
                    name="site_web"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.site_web}
                    onChange={(e) => update("site_web", e.target.value)}
                  />
                </div>

                <Field label="nom_complet">
                  <input
                    required
                    type="text"
                    value={form.nom}
                    onChange={(e) => update("nom", e.target.value)}
                    placeholder="Ex: Ahmed Ben Salah"
                    className="field-input"
                  />
                </Field>

                <Field label="email">
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="prenom.nom@eniso.u-sousse.tn"
                    className="field-input"
                  />
                </Field>

                <Field label="filiere">
                  <input
                    required
                    type="text"
                    value={form.filiere}
                    onChange={(e) => update("filiere", e.target.value)}
                    placeholder="Ex: GL2, RT3, IIA1..."
                    className="field-input"
                  />
                </Field>

                <Field label="motivation">
                  <textarea
                    required
                    rows={5}
                    minLength={20}
                    value={form.motivation}
                    onChange={(e) => update("motivation", e.target.value)}
                    placeholder="Pourquoi veux-tu rejoindre CyberGuards ? Qu'est-ce qui t'intéresse en cybersécurité ?"
                    className="field-input resize-none"
                  />
                </Field>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full bg-mint-dim/20 border border-mint text-mint hover:bg-mint hover:text-void transition-colors rounded px-5 py-2.5 font-bold disabled:opacity-50"
                >
                  {status === "sending" ? "envoi en cours..." : "envoyer la candidature →"}
                </button>

                {status === "error" && <p className="text-magenta text-xs">✕ {errorMsg}</p>}
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-text-dim text-xs mt-4">
          ENISo CyberGuards CyberSecurity Club — École Nationale d&apos;Ingénieurs de Sousse
        </p>
      </div>

      <style jsx global>{`
        .field-input {
          width: 100%;
          background: #0a0f0c;
          border: 1px solid #1c2b22;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          color: #c9e8d4;
          outline: none;
        }
        .field-input:focus {
          border-color: #4dff9e;
        }
        .field-input::placeholder {
          color: #5f7a6b80;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-text-dim mb-1 text-xs">
        <span className="text-mint">$</span> {label} =
      </label>
      {children}
    </div>
  );
}
