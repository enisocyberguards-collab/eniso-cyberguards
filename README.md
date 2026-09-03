# ENISo CyberGuards — Formulaire de candidature

Site en 2 étapes :
1. **`/`** — Porte d'entrée avec 2 challenges d'accès successifs (voir section 5). Il faut les résoudre pour débloquer la suite.
2. **`/apply`** — Formulaire de candidature (nom, email, filière, motivation), protégé côté serveur — impossible d'y accéder sans avoir résolu le challenge. Les réponses partent dans un Google Sheet.

Stack : Next.js 14 (App Router) + TypeScript + Tailwind CSS.

---

## 1. Mettre en place Google Sheets

1. Crée un nouveau Google Sheet, renomme le premier onglet **`Candidatures`**.
2. Menu **Extensions > Apps Script**.
3. Supprime le code par défaut, colle le contenu du fichier `google-apps-script/Code.gs` (fourni dans ce projet).
4. Clique sur **Déployer > Nouveau déploiement**.
   - Type : **Application Web**
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
5. Autorise les permissions demandées (c'est ton propre script, Google va juste alerter que ce n'est pas vérifié — clique sur "Advanced" puis "Go to project (unsafe)").
6. Copie l'URL générée, qui ressemble à :
   `https://script.google.com/macros/s/AKfycb.../exec`
   → C'est ta variable `GOOGLE_SCRIPT_URL`.

⚠️ Si tu modifies le script plus tard, il faut faire **Déployer > Gérer les déploiements > Modifier** puis republier une nouvelle version, sinon les changements ne prennent pas effet.

---

## 2. Déployer sur Vercel

### Option A — via l'interface Vercel (recommandé pour débuter)
1. Pousse ce projet sur un dépôt GitHub (voir section 3 ci-dessous).
2. Va sur [vercel.com](https://vercel.com) → **Add New > Project**.
3. Importe le dépôt GitHub.
4. Vercel détecte automatiquement Next.js — ne change rien aux réglages de build.
5. Avant de cliquer sur "Deploy", va dans **Environment Variables** et ajoute :
   - `GOOGLE_SCRIPT_URL` = l'URL copiée à l'étape 1.6
   - `COOKIE_SECRET` = une chaîne aléatoire longue (génère-la avec `openssl rand -hex 32` dans un terminal, ou n'importe quelle chaîne complexe unique)
6. Clique sur **Deploy**.

### Option B — via la CLI Vercel
```bash
npm install -g vercel
vercel login
vercel
# Suis les instructions, puis configure les variables d'env :
vercel env add GOOGLE_SCRIPT_URL
vercel env add COOKIE_SECRET
vercel --prod
```

---

## 3. Pousser le projet sur GitHub (si pas déjà fait)

```bash
cd eniso-cyberguards
git init
git add .
git commit -m "Initial commit: ENISo CyberGuards application site"
git branch -M main
git remote add origin https://github.com/<ton-compte>/eniso-cyberguards.git
git push -u origin main
```

---

## 4. Développement local

```bash
npm install
cp .env.example .env.local
# Édite .env.local avec ta propre GOOGLE_SCRIPT_URL et COOKIE_SECRET
npm run dev
```
Ouvre [http://localhost:3000](http://localhost:3000).

---

## 5. Les 2 challenges CTF — comment ça marche

**CTF 1 — flag leetspeak rotatif**
- Le message de base (`You_will_be_called_for_an_interview`) vit dans `lib/challenge.ts`, jamais envoyé au client en clair.
- À chaque chargement de `/`, une variante leetspeak **aléatoire** est générée (`Y0u_will_b3_call3d...` diffère à chaque session), encodée en hex, et affichée.
- Le candidat décode le hex → obtient un flag lisible `EnisoCyberGuards{...}` → le colle directement (pas de hachage à calculer).
- Comme le flag change à chaque session, un candidat ne peut pas simplement copier la réponse d'un autre.

**CTF 2 — clé cachée dans l'inspecteur**
- Un code aléatoire (`ENISO-XXXXXX`, 6 caractères) est généré à chaque session et injecté dans le DOM sous forme de **commentaire HTML invisible** (`<!-- clé d'accès CyberGuards : ENISO-XXXXXX -->`).
- Le candidat doit ouvrir l'inspecteur du navigateur (F12 → onglet Elements) pour le trouver — aucune compétence technique avancée requise, volontairement accessible aux débutants.
- Ce challenge n'est proposé qu'après réussite du CTF 1.

**Sécurité commune aux deux :**
- Seuls des hashs (HMAC-SHA256, clé = `COOKIE_SECRET`) circulent dans un cookie de session httpOnly (`eniso_ctf_session`), jamais les réponses en clair.
- Vérification en temps constant (`crypto.timingSafeEqual`) pour éviter les attaques par timing.
- Une fois les 2 résolus, un second cookie signé (`eniso_ctf_solved`, 30 min) débloque `/apply` — vérifié côté serveur (composant serveur), impossible à contourner en modifiant le JS client.
- Rate limiting basique (anti brute-force) sur les 2 routes de vérification.

**Pour changer le message de base** (recommandé avant chaque nouvelle campagne) : modifie `BASE_MESSAGE` dans `lib/challenge.ts`. La rotation leetspeak et la clé cachée se régénèrent automatiquement à chaque session, sans rien à faire de plus.

---

## 6. Structure du projet

```
app/
  page.tsx                       → porte d'entrée, 2 CTF (client component)
  apply/page.tsx                 → formulaire, protégé (server component)
  api/
    ctf/challenge/route.ts       → génère et sert les 2 challenges (dynamique, jamais caché)
    ctf/verify-stage1/route.ts   → vérifie le flag leetspeak
    ctf/verify-stage2/route.ts   → vérifie la clé cachée, pose le cookie final
    apply/route.ts               → reçoit le formulaire, transmet à Google Sheets
  layout.tsx, globals.css
components/
  ApplicationForm.tsx             → UI du formulaire
lib/
  challenge.ts                     → logique des 2 CTF (jamais exposée en clair au client)
public/
  logo.jpg                          → logo du club
google-apps-script/
  Code.gs                             → script à coller dans Google Apps Script
```

---

## 7. Sécurité — ce qui est déjà en place

- Secret du CTF jamais exposé côté client (seulement sa version encodée).
- Vérification du hash en temps constant (`crypto.timingSafeEqual`).
- Cookie de déverrouillage **httpOnly + signé HMAC + expiration 30 min** — impossible à forger sans connaître `COOKIE_SECRET`.
- Accès à `/apply` vérifié côté serveur (pas juste une redirection JS côté client).
- Rate limiting basique sur la vérification CTF et validation stricte des champs du formulaire.
- Champ honeypot invisible sur le formulaire pour piéger les bots simples.

## 8. Limites à connaître

- Le rate limiting est en mémoire par instance serverless : suffisant pour filtrer les tentatives répétées d'un même candidat, pas conçu pour résister à une attaque distribuée sérieuse.
- Pense à changer `COOKIE_SECRET` et `SECRET_PHRASE` avant chaque nouvelle campagne si tu veux repartir sur un challenge inédit.
