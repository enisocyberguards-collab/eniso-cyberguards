"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BOOT_LINES = [
  "initializing eniso-cyberguards secure gateway...",
  "loading kernel modules [ok]",
  "checking candidate integrity... [pending]",
  "access to /apply requires proof-of-skill",
  "launching challenge module...",
];

export default function GatePage() {
  const router = useRouter();
  const [bootedLines, setBootedLines] = useState<string[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [encoded, setEncoded] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Séquence de boot ligne par ligne
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setBootedLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => setBootDone(true), 300);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  // Récupère la chaîne encodée depuis le serveur une fois le boot terminé
  useEffect(() => {
    if (!bootDone) return;
    fetch("/api/ctf/challenge")
      .then((res) => res.json())
      .then((data) => setEncoded(data.encoded))
      .catch(() => setEncoded(null));
  }, [bootDone]);

  useEffect(() => {
    if (encoded) inputRef.current?.focus();
  }, [encoded]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || status === "checking") return;

    setStatus("checking");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ctf/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setStatus("success");
        setTimeout(() => router.push("/apply"), 900);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Hash incorrect.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Erreur réseau. Réessaie.");
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
              root@eniso-cyberguards:~/access-gate
            </span>
          </div>

          <div className="p-6 sm:p-8 text-sm leading-relaxed">
            {bootedLines.map((line, idx) => (
              <div key={idx} className="text-text-dim">
                <span className="text-mint">$</span> {line}
              </div>
            ))}

            {bootDone && (
              <div className="mt-6">
                <h1 className="text-mint glow-text text-xl sm:text-2xl font-bold mb-1">
                  ENISo CyberGuards
                </h1>
                <p className="text-text-dim mb-6">
                  Challenge d&apos;accès — prouve que tu sais lire du code avant de coder pour
                  nous.
                </p>

                {encoded === null && (
                  <p className="text-text-dim animate-pulse">chargement du challenge...</p>
                )}

                {encoded && status !== "success" && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <div className="text-text-dim mb-1"># chaîne interceptée (hex)</div>
                      <div className="bg-void border border-border rounded px-3 py-2 break-all text-mint select-all">
                        {encoded}
                      </div>
                    </div>

                    <div className="text-text-dim text-xs space-y-1">
                      <p>
                        1. Décode cette chaîne hexadécimale en texte ASCII.
                        <br />
                        2. Calcule le hash SHA-256 de ce texte (encodage UTF-8, sortie en
                        hexadécimal minuscule).
                        <br />
                        3. Colle le hash ci-dessous.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowHint((v) => !v)}
                        className="text-mint-dim hover:text-mint underline underline-offset-2"
                      >
                        {showHint ? "masquer l'indice" : "afficher un indice"}
                      </button>
                      {showHint && (
                        <p className="text-text-dim border-l-2 border-mint-dim pl-2">
                          Node.js : <code>Buffer.from(hex,&apos;hex&apos;).toString()</code> puis{" "}
                          <code>crypto.createHash(&apos;sha256&apos;)...</code>. En ligne de
                          commande : <code>echo -n &quot;texte&quot; | sha256sum</code>. Ce
                          challenge est propre à ce site — inutile de le chercher ailleurs.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="sha256 hash..."
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 bg-void border border-border focus:border-mint outline-none rounded px-3 py-2 text-text placeholder:text-text-dim/50"
                      />
                      <button
                        type="submit"
                        disabled={status === "checking"}
                        className="bg-mint-dim/20 border border-mint text-mint hover:bg-mint hover:text-void transition-colors rounded px-5 py-2 font-bold disabled:opacity-50"
                      >
                        {status === "checking" ? "vérification..." : "déverrouiller →"}
                      </button>
                    </div>

                    {status === "error" && <p className="text-magenta text-xs">✕ {errorMsg}</p>}
                  </form>
                )}

                {status === "success" && (
                  <div className="text-mint glow-text">
                    ✓ accès accordé. redirection vers /apply
                    <span className="animate-blink">_</span>
                  </div>
                )}
              </div>
            )}

            <span
              className={`inline-block w-2 h-4 bg-mint ml-1 ${
                bootDone ? "hidden" : "animate-blink"
              }`}
            />
          </div>
        </div>

        <p className="text-center text-text-dim text-xs mt-4">
          ENISo CyberGuards CyberSecurity Club — École Nationale d&apos;Ingénieurs de Sousse
        </p>
      </div>
    </main>
  );
}
