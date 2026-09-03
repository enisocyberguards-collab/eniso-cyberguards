"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const BOOT_LINES = [
  "initializing eniso-cyberguards secure gateway...",
  "loading kernel modules [ok]",
  "checking candidate integrity... [pending]",
  "access to /apply requires proof-of-skill (2 challenges)",
  "launching challenge module...",
];

type Stage = "boot" | "loading" | "stage1" | "stage2" | "success";

export default function GatePage() {
  const router = useRouter();
  const [bootedLines, setBootedLines] = useState<string[]>([]);
  const [bootDone, setBootDone] = useState(false);
  const [stage, setStage] = useState<Stage>("boot");

  const [flagHex, setFlagHex] = useState<string | null>(null);
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);

  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [checking, setChecking] = useState(false);
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [showHint1, setShowHint1] = useState(false);
  const [showHint2, setShowHint2] = useState(false);

  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  // Séquence de boot ligne par ligne
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setBootedLines(BOOT_LINES.slice(0, i));
      if (i >= BOOT_LINES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setBootDone(true);
          setStage("loading");
        }, 300);
      }
    }, 350);
    return () => clearInterval(interval);
  }, []);

  // Récupère les 2 challenges depuis le serveur une fois le boot terminé
  useEffect(() => {
    if (stage !== "loading") return;
    fetch("/api/ctf/challenge")
      .then((res) => res.json())
      .then((data) => {
        setFlagHex(data.flagHex);
        setHiddenKey(data.hiddenKey);
        setStage("stage1");
      })
      .catch(() => setError1("Impossible de charger le challenge. Recharge la page."));
  }, [stage]);

  useEffect(() => {
    if (stage === "stage1") input1Ref.current?.focus();
    if (stage === "stage2") input2Ref.current?.focus();
  }, [stage]);

  async function handleStage1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer1.trim() || checking) return;
    setChecking(true);
    setError1("");

    try {
      const res = await fetch("/api/ctf/verify-stage1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer1.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStage("stage2");
      } else {
        setError1(data.error || "Réponse incorrecte.");
      }
    } catch {
      setError1("Erreur réseau. Réessaie.");
    } finally {
      setChecking(false);
    }
  }

  async function handleStage2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer2.trim() || checking) return;
    setChecking(true);
    setError2("");

    try {
      const res = await fetch("/api/ctf/verify-stage2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer2.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStage("success");
        setTimeout(() => router.push("/apply"), 900);
      } else {
        setError2(data.error || "Réponse incorrecte.");
      }
    } catch {
      setError2("Erreur réseau. Réessaie.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 animate-flicker">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="ENISo CyberGuards" className="w-20 h-20 rounded-xl logo-glow mb-3" />
        </div>

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
                <h1 className="glitch-text text-xl sm:text-2xl font-bold mb-1">
                  ENISo CyberGuards
                </h1>
                <p className="text-text-dim mb-6">
                  2 challenges d&apos;accès — prouve que tu sais lire du code avant de coder pour
                  nous.
                </p>

                {/* Indicateur d'étapes */}
                <div className="flex items-center gap-2 mb-6 text-xs">
                  <span
                    className={`px-2 py-1 rounded border ${
                      stage === "stage1"
                        ? "border-mint text-mint"
                        : stage === "stage2" || stage === "success"
                        ? "border-mint-dim text-mint-dim"
                        : "border-border text-text-dim"
                    }`}
                  >
                    {stage === "stage2" || stage === "success" ? "✓" : "1."} décodage
                  </span>
                  <span className="text-text-dim">→</span>
                  <span
                    className={`px-2 py-1 rounded border ${
                      stage === "stage2"
                        ? "border-mint text-mint"
                        : stage === "success"
                        ? "border-mint-dim text-mint-dim"
                        : "border-border text-text-dim"
                    }`}
                  >
                    {stage === "success" ? "✓" : "2."} inspection
                  </span>
                </div>

                {stage === "loading" && (
                  <p className="text-text-dim animate-pulse">chargement du challenge...</p>
                )}

                {/* CTF 1 */}
                {stage === "stage1" && flagHex && (
                  <form onSubmit={handleStage1Submit} className="space-y-4">
                    <div>
                      <div className="text-text-dim mb-1"># chaîne interceptée (hex)</div>
                      <div className="bg-void border border-border rounded px-3 py-2 break-all text-mint select-all">
                        {flagHex}
                      </div>
                    </div>

                    <div className="text-text-dim text-xs space-y-1">
                      <p>
                        Décode cette chaîne hexadécimale en texte ASCII, puis colle directement
                        le texte obtenu (le flag complet, avec les accolades) ci-dessous.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowHint1((v) => !v)}
                        className="text-mint-dim hover:text-mint underline underline-offset-2"
                      >
                        {showHint1 ? "masquer l'indice" : "afficher un indice"}
                      </button>
                      {showHint1 && (
                        <p className="text-text-dim border-l-2 border-mint-dim pl-2">
                          Node.js : <code>Buffer.from(hex,&apos;hex&apos;).toString()</code>. En
                          ligne de commande :{" "}
                          <code>echo &quot;{"{hex}"}&quot; | xxd -r -p</code>. Ou un convertisseur
                          hex→texte en ligne (ex: CyberChef).
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        ref={input1Ref}
                        type="text"
                        value={answer1}
                        onChange={(e) => setAnswer1(e.target.value)}
                        placeholder="EnisoCyberGuards{...}"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 bg-void border border-border focus:border-mint outline-none rounded px-3 py-2 text-text placeholder:text-text-dim/50"
                      />
                      <button
                        type="submit"
                        disabled={checking}
                        className="bg-mint-dim/20 border border-mint text-mint hover:bg-mint hover:text-void transition-colors rounded px-5 py-2 font-bold disabled:opacity-50"
                      >
                        {checking ? "vérification..." : "valider →"}
                      </button>
                    </div>

                    {error1 && <p className="text-magenta text-xs">✕ {error1}</p>}
                  </form>
                )}

                {/* CTF 2 */}
                {stage === "stage2" && (
                  <form onSubmit={handleStage2Submit} className="space-y-4">
                    <p className="text-mint text-xs">
                      ✓ premier challenge résolu. Il reste une clé cachée à trouver.
                    </p>

                    <div className="text-text-dim text-xs space-y-1">
                      <p>
                        Une deuxième clé (format <code>ENISO-XXXXXX</code>) est cachée quelque
                        part dans le code de cette page — pas visible à l&apos;écran.
                      </p>
                      <p>
                        Ouvre l&apos;inspecteur de ton navigateur (touche <code>F12</code>, ou
                        clic droit → &quot;Inspecter&quot;), va dans l&apos;onglet{" "}
                        <code>Elements</code> / <code>Éléments</code>, et cherche un commentaire
                        HTML (<code>&lt;!-- ... --&gt;</code>) contenant la clé.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowHint2((v) => !v)}
                        className="text-mint-dim hover:text-mint underline underline-offset-2"
                      >
                        {showHint2 ? "masquer l'indice" : "afficher un indice"}
                      </button>
                      {showHint2 && (
                        <p className="text-text-dim border-l-2 border-mint-dim pl-2">
                          Le commentaire se trouve quelque part dans cette fenêtre de terminal.
                          Utilise Ctrl+F dans le panneau Elements de l&apos;inspecteur et cherche{" "}
                          <code>ENISO-</code>.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        ref={input2Ref}
                        type="text"
                        value={answer2}
                        onChange={(e) => setAnswer2(e.target.value)}
                        placeholder="ENISO-XXXXXX"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 bg-void border border-border focus:border-mint outline-none rounded px-3 py-2 text-text placeholder:text-text-dim/50 uppercase"
                      />
                      <button
                        type="submit"
                        disabled={checking}
                        className="bg-mint-dim/20 border border-mint text-mint hover:bg-mint hover:text-void transition-colors rounded px-5 py-2 font-bold disabled:opacity-50"
                      >
                        {checking ? "vérification..." : "déverrouiller →"}
                      </button>
                    </div>

                    {error2 && <p className="text-magenta text-xs">✕ {error2}</p>}

                    {/* La clé cachée du CTF 2 — visible uniquement via l'inspecteur */}
                    {hiddenKey && (
                      <div
                        style={{
                          position: "absolute",
                          width: 0,
                          height: 0,
                          overflow: "hidden",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `<!-- clé d'accès CyberGuards : ${hiddenKey} -->`,
                        }}
                      />
                    )}
                  </form>
                )}

                {stage === "success" && (
                  <div className="glitch-text">
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
