# Architecture technique

> Statut : **v0.1** (2026-10-09) — stack validée (D-T1), organisation du dépôt et détails **proposés**.

## 1. Stack

Identique à Sans Nom (D-T1), pour réutiliser une chaîne déjà éprouvée (APK signé, mises à jour sans perte, sauvegarde par feuille de partage) :

| Brique | Choix | Remarque |
|---|---|---|
| Interface | **Vite + TypeScript + Svelte 5** | runes (`$state`, `$derived`) |
| App Android | **Capacitor 8** | une app Android par application, installée par APK |
| Base de données | **@capacitor-community/sqlite** | fichier SQLite natif dans l'app |
| Fichiers (images, PDF) | **@capacitor/filesystem** | dossier privé de l'app (`Directory.Data`) |
| Partage / sauvegarde | **@capacitor/share** + filesystem | comme Sans Nom (D8 de Sans Nom) |
| Bouton retour Android | **@capacitor/app** | pile `back.ts` reprise de Sans Nom |
| Tests | **Vitest** | règles, normalisation, formats de sauvegarde, import Notion |
| Éditeur Markdown (MJ) | **CodeMirror 6** | voir D-M3 |
| Rendu Markdown (MJ) | **markdown-it** + plugin maison `[[lien]]` | sortie assainie (DOMPurify) |
| Archive de sauvegarde (MJ) | **fflate** (zip) | base + médias dans un seul fichier |
| Recherche (MJ) | **SQLite FTS5** | à vérifier sur appareil à l'étape M1 ; repli FTS4 / `LIKE` |

Aucune dépendance réseau à l'exécution : polices embarquées, pas de CDN.

### Le Chromebook

**Changement (D-M18, 2026-10-16)** : l'appli MJ n'est plus une app Android. C'est une **appli web installable** (PWA) publiée sur GitHub Pages, ouverte dans Chrome sur le Chromebook (session) et sur le PC (préparation), hors ligne grâce à un service worker. Base SQLite en WebAssembly (sql.js) dans IndexedDB, stockage persistant, sauvegarde automatique `.opmj` dans un dossier Google Drive qui sert aussi de relais entre les deux appareils. Les mentions de Capacitor, d'APK et de SQLite natif ci-dessus ne valent plus que pour Vivre Card ; ce document sera revu à l'étape M1. Conséquences pour l'interface :

- Mise en page **paysage, grand écran** (≥ 1280 px), souris et clavier : raccourcis clavier, survol, clic droit facultatif. Pas de version téléphone, mais repli en 2 puis 1 colonne si la fenêtre rétrécit (D-M10).
- Le WebView Android du Chromebook est à jour (Chrome) : pas de contrainte de compatibilité particulière.
- Les fichiers à importer (images, PDF) sont choisis via le sélecteur de fichiers Android, qui donne accès aux dossiers « Mes fichiers » / Google Drive du Chromebook.

## 2. Organisation du dépôt (monorepo, D-T2 et D-T7)

```
one-piece-jdr/
  package.json                  workspaces npm : apps/*, packages/*, tools/*
  packages/
    core/                       code partagé, sans dépendance à Capacitor
      src/model/                caracs, races, classes, paliers de dés (listes fermées)
      src/rules/                règles pures + textes des mémos (source unique)
      src/ui/                   composants Svelte réutilisés : StatGrid, ResourceDiamond,
                                TempBonuses, Sheet, NumberInput, InfoMemo, back.ts, theme.css
      src/index.ts              point d'entrée : import { … } from '@onepiece/core'
                                composants : import StatGrid from '@onepiece/core/ui/StatGrid.svelte'
  apps/
    joueur/                     appli joueur (téléphone)
      src/ … android/ … capacitor.config.ts
    mj/                         appli MJ (Chromebook)
      src/ … android/ … capacitor.config.ts
  tools/
    notion-import/              script Node de migration unique (voir docs/mj/IMPORT_NOTION.md)
  .github/workflows/
    joueur.yml                  CI + APK de l'appli joueur (tags joueur-vX.Y.Z)
    mj.yml                      CI + APK de l'appli MJ (tags mj-vX.Y.Z)
  docs/
```

**Pourquoi un monorepo** : les deux apps partagent les 8 caracs, les races, les classes, les ressources, les règles et plusieurs composants (grille de caracs, losanges). Un seul endroit pour les règles = pas de divergence entre ce que voit le joueur et ce que voit le MJ. Les apps restent **indépendantes à l'exécution** (aucun échange de données).

**Point de départ** : copier depuis Sans Nom les fichiers génériques (`back.ts`, `Sheet.svelte`, `NumberInput.svelte`, `StatGrid`, `ResourceDiamond`, `TempBonuses`, `SkillList`, `BackupPanel`, `share.ts`, le squelette du repository SQLite, le workflow CI, la procédure de signature) puis les adapter. Ne pas créer de dépendance vers le dépôt Sans Nom.

## 3. Stockage

### Appli joueur
Repris tel quel de Sans Nom : table `characters (id, nom, updated_at, data JSON)` + table `meta`. Un personnage complet (avec ses compagnons) = un document JSON. Détails : [joueur/CAHIER_DES_CHARGES.md §6](joueur/CAHIER_DES_CHARGES.md).

### Appli MJ
Modèle **relationnel** (fiches, liens, sessions, journal, médias) + index plein texte, car la recherche globale et les liens entre fiches sont le cœur de l'app. Détails : [mj/MODELE_DONNEES.md](mj/MODELE_DONNEES.md).

Médias (images, PDF) : fichiers dans `Directory.Data/media/<id>.<ext>`, référencés par la table `assets`. Jamais de blob en base.

### Développement dans le navigateur
- Joueur : repli `localStorage` comme Sans Nom.
- MJ : SQLite compilé en WebAssembly (**sql.js**), même SQL que sur l'appareil, base gardée dans `IndexedDB` après chaque écriture (`apps/mj/src/lib/storage/webDb.ts`, D-M17). Réservé au développement ; jamais utilisé en production. Le fichier `sql-wasm-browser.wasm` est servi par le serveur de dev seulement (`apps/mj/vite.config.ts`) et n'entre pas dans l'APK. sql.js n'a pas FTS5 : l'index de recherche y est en FTS4 (D-M11).
- Le repository MJ repose sur une petite interface SQL (`apps/mj/src/lib/storage/db.ts`) : plugin natif sur l'appareil, sql.js dans le navigateur (`sqlJsDb.ts`), le même adaptateur sql.js dans les tests Vitest (schéma et repository testés sur une vraie base).

### Migrations
Comme Sans Nom : liste `MIGRATIONS` ordonnée, version dans `meta.schema_version`, une migration publiée n'est jamais modifiée. L'appli MJ refuse d'ouvrir une base d'un schéma plus récent qu'elle. Autre particularité côté MJ : l'index plein texte `search_index`, donnée dérivée, est créé hors migrations avec le meilleur moteur disponible (D-M11).

## 4. Sauvegarde

| | Appli joueur | Appli MJ |
|---|---|---|
| Format | JSON `onepiece-joueur-sauvegarde` v1, tous les persos | archive zip `.opmj` : `manifest.json` + `data.json` (toutes les tables) + `media/` |
| Envoi | feuille de partage Android (Drive, mail, WhatsApp) | feuille de partage, ou enregistrement dans « Mes fichiers » du Chromebook |
| Rappel | rouge à l'accueil si modifications et ≥ 7 jours | idem, sur l'accueil MJ |
| Import | par perso : Remplacer / Garder les deux / Ignorer | restauration complète (remplace tout, après confirmation) |
| Backup Android | `allowBackup` actif | `allowBackup` actif, mais médias probablement > 25 Mo (Q-M6) : la sauvegarde `.opmj` est indispensable |

L'import Notion produit **un fichier `.opmj`** que l'appli MJ restaure : un seul chemin d'entrée des données à tester (D-M5).

## 5. CI et distribution

Repris de Sans Nom (D6 de Sans Nom) :
- GitHub Actions : `check`, `test`, APK debug en artefact sur chaque push ; APK **signé** + Release sur tag.
- Un workflow par app, déclenché par son préfixe de tag (`joueur-v1.2.0`, `mj-v0.3.0`) et par les chemins modifiés (`apps/joueur/**`, `packages/core/**`…).
- **Une seule clé de signature** peut signer les deux apps (les `appId` diffèrent). La sauvegarder hors de GitHub.
- Noms affichés : **Vivre Card** (joueur) et **One Piece** (MJ). `appId` (définitifs après la 1re release, D-T5) : `fr.onepiecejdr.joueur` et `fr.onepiecejdr.mj`.
- Dépôt **public** (D-T6) : `.gitignore` exclut `tools/notion-import/input/`, `*.opmj`, `rapport-import.md` et tout export Notion.

## 6. Qualité

- Tests Vitest obligatoires pour : `packages/core/src/rules`, chaque `normalize*`, les formats de sauvegarde (aller-retour), le convertisseur Notion (sur un mini-export de test versionné dans `tools/notion-import/fixtures/`).
- `npm run check` et `npm test` verts avant chaque commit.
- Vérification visuelle dans le navigateur au format cible : 360 × 780 (joueur), 1366 × 768 (MJ).
