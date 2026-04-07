# DEPENDENCY_RESOLUTION.md — Compatibilite des Dependances ZIP Omega vs Core
# kiltikonet.fr — ITER.56 Phase 2.1
# Date : 2026-04-07

## Analyse Comparative

### Dependances Critiques

| Dependance | Version CORE | Version ZIP Omega | Conflit | Resolution |
|---|---|---|---|---|
| **react** | ^19.0.0 | 19.0.0 | AUCUN | Identique |
| **react-dom** | ^19.0.0 | 19.0.0 | AUCUN | Identique |
| **tailwindcss** | ^3.4.17 (via PostCSS) | ^4.1.14 (via Vite plugin) | **CRITIQUE** | Garder TW3 cote Core. Traduire les classes TW4 du ZIP en TW3+CSS custom |
| **motion** | Non installe | ^12.38.0 (motion/react) | AJOUT | Installer `motion` (successeur de framer-motion). Compatible React 19 |
| **lucide-react** | ^0.507.0 | ^0.546.0 | MINEUR | Upgrader vers 0.546.0 (pas de breaking change) |
| **react-router-dom** | ^7.5.1 | ^7.14.0 | MINEUR | Garder 7.5.1, compatible |
| **typescript** | Non utilise (JSX) | ~5.8.2 | **STRATEGIE** | Le core est en JSX pur. Les composants Omega sont en TSX. Voir ci-dessous. |
| **vite** | Non utilise (CRA/Craco) | ^6.2.0 | NON APPLICABLE | Le core utilise create-react-app + craco. Vite est ignore. |
| **react-markdown** | Non installe | ^10.0.0 (dans BrainChat) | AJOUT | Installer pour le chat Brain |
| **remark-gfm** | Non installe | ^4.0.1 (dans BrainChat) | AJOUT | Installer pour le markdown GFM |
| **react-syntax-highlighter** | Non installe | ^15.6.1 (dans BrainChat) | AJOUT | Installer pour la coloration syntaxique |

### Dependances Existantes dans Core mais Absentes du ZIP
- `@radix-ui/*` (shadcn) — garder, pas de conflit
- `recharts` — garder
- `three` / `@react-three/*` — garder (mais bloque React 19)
- `html5-qrcode` — garder pour le scan
- `sonner` — garder pour les toasts
- `axios` — garder (le ZIP utilise fetch natif, pas de conflit)

## Resolution Detaille par Conflit

### 1. TAILWINDCSS — TW4 vs TW3 (CRITIQUE)

**Probleme** : TW4 utilise une syntaxe CSS-first radicalement differente :
- TW4 : `@import "tailwindcss"` + `@theme { --color-gold: #f2ca50; }`
- TW3 : `tailwind.config.js` + `@apply` + `postcss.config.js`

**Impact** : Les classes custom du ZIP (`bg-bg`, `text-gold`, `border-gold`, `font-headline`, `font-label`, `glass`, `animate-orbit`, `animate-counter-orbit`) ne fonctionnent pas en TW3.

**Resolution** :
1. **NE PAS migrer vers TW4** — risque de casser tout le site existant
2. **Ajouter les variables CSS custom** dans le `tailwind.config.js` existant du Core :
   ```js
   // tailwind.config.js
   theme: {
     extend: {
       colors: {
         gold: '#f2ca50',
         'gold-dim': '#d4af37',
         bg: '#0e0e0e',
         surface: '#1c1b1b',
       },
       fontFamily: {
         headline: ['"Noto Serif"', 'serif'],
         label: ['"Space Grotesk"', 'sans-serif'],
       },
     },
   },
   ```
3. **Copier les animations custom** (orbit, counter-orbit, shimmer) et la classe `.glass` dans `index.css` existant du Core.

### 2. TYPESCRIPT vs JSX (STRATEGIE)

**Probleme** : Le Core est 100% JSX (pas de TypeScript). Le ZIP Omega est 100% TSX.

**Options** :
| Option | Avantage | Inconvenient |
|---|---|---|
| A. Convertir TSX → JSX | Coherent avec le Core | Perte de typage, travail manuel |
| B. Ajouter TS au Core CRA | Garder les types | Config craco delicate, risque de casser le build |
| C. Renommer .tsx → .jsx et retirer les types | Rapide | Types perdus, mais fonctionnel |

**Recommandation** : Option C — Renommer en .jsx et retirer les annotations TypeScript. Le Core n'a pas de tsconfig, pas de build TypeScript, et ajouter TS a un projet CRA existant est risque. Les types seront documentes dans `omega.ts` pour reference mais pas utilises en runtime.

### 3. MOTION (nouveau)

**Probleme** : Le ZIP utilise `motion/react` (v12+), le successeur de `framer-motion`.

**Resolution** :
```bash
yarn add motion
```
Les imports `from "motion/react"` sont directement compatibles. C'est un drop-in replacement. L'ancien `framer-motion` n'est pas utilise dans le Core, donc pas de conflit.

### 4. LUCIDE-REACT

**Probleme mineur** : ZIP utilise 0.546.0, Core a 0.507.0. Certaines icones du ZIP pourraient ne pas exister dans 0.507.0.

**Resolution** : Mettre a jour `yarn add lucide-react@latest`. Pas de breaking change.

### 5. REACT-MARKDOWN + SYNTAX HIGHLIGHTING (nouveau)

**Requis pour** : Le BrainChat Omega avec rendu Markdown.

**Resolution** :
```bash
yarn add react-markdown remark-gfm react-syntax-highlighter
```

## Dependances a Installer pour iter.57

```bash
yarn add motion react-markdown remark-gfm react-syntax-highlighter
yarn add lucide-react@latest
```

## Dependances a NE PAS installer
- `@tailwindcss/vite` (TW4 only, pas compatible avec CRA)
- `vite` (le Core utilise CRA/Craco)
- `typescript` (le Core est en JSX pur)
