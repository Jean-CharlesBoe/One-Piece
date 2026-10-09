# Roadmap

Étape en cours : **J0 — Socle Android de Vivre Card** (C1 terminée ; J0 et M0 peuvent démarrer, C2 attend Q-R1, Q-R2, Q-R5 pour les textes des mémos)

Ordre conseillé : socle commun, puis **l'appli joueur d'abord** (proche de Sans Nom, livrable vite aux joueurs), puis l'appli MJ. Les deux branches peuvent avancer en parallèle après C1.

## Commun

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| C0 | Cadrage | Specs, décisions, questions | — | fait (v0.2) |
| C1 | Socle monorepo | workspaces npm, `packages/core` (caracs, races, classes, paliers, `Resource`, `TempBonus`), composants repris de Sans Nom (StatGrid, ResourceDiamond, TempBonuses, Sheet, NumberInput, back.ts), Vitest, `npm run check` | — | fait |
| C2 | Règles et mémos | `packages/core/src/rules` (stats, ressources bornées, ambition/race, transfert, xp) + `memos.ts` depuis REGLES_ONE_PIECE.md ; tests | Q-R1, Q-R2, Q-R5 (textes des mémos seulement) | à faire |

## Appli joueur

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| J0 | Socle Android | Capacitor, `appId`, SQLite + repository + repli web, accueil (liste), CI `joueur.yml`, APK debug, clé de signature | — | à faire |
| J1 | Onglet Fiche | identité, caracs, bonus temporaires, ressources (Vitalité, Endurance, Rêve, Ambition), ressources perso, XP, équipement, inventaire, modes jeu/édition, sauvegarde auto | — | à faire |
| J2 | Fruit du démon | bloc fruit (nom, type, description, éveil), lien vers ses techniques | — | à faire |
| J3 | Compétences | SkillList, coût en Endurance, origine + filtre | Q-J4 | à faire |
| J4 | Compagnons | liste + fiche compagnon | — | à faire |
| J5 | Mémos | boutons « i », aide-mémoire | Q-J5 | à faire |
| J6 | Sauvegarde | export/import JSON, rappel, test de mise à jour par-dessus | — | à faire |
| J7 | Finitions | mode sombre/clair, notice joueurs, icône, **1re release** | Q-T4 | à faire |

## Appli MJ

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| M0 | Socle Android | Capacitor, `appId`, schéma SQLite (migration 1), repository, repli web (jeep-sqlite), CI `mj.yml`, disposition 3 colonnes | — | à faire |
| M1 | Vérifications appareil | APK sur le Chromebook, **FTS5 disponible ?**, sélecteur de fichiers, écriture dans `media/` | Q-T3 | à faire |
| M2 | Fiches | registre des types, lecture (propriétés, Markdown rendu), édition (formulaire + CodeMirror, `[[`), liens et rétroliens, pages enfants, archives, changement de type, alias, avertissement de doublon, fusion, vue Doublons probables | — | à faire |
| M3 | Navigation et recherche | Ctrl+K, listes filtrées, épinglés, récents, arborescences, historique | Q-M1 | à faire |
| M4 | Sauvegarde `.opmj` | export zip + médias, restauration, rappel | Q-M6 | à faire |
| M5 | Import Notion | script `tools/notion-import`, table de synonymes, fixtures, rapport (doublons probables) ; import réel et vérification avec le MJ | Q-M7 | à faire |
| M6 | Documents | import image/PDF, visionneuse | — | à faire |
| M7 | Bloc de jeu PNJ | StatGrid, ressources, techniques, Haki, catégorie d'adversaire | — | à faire |
| M8 | Sessions | campagnes, sessions, écran Session en cours, journal, entrées automatiques, chronologie des fiches, fin de session, entrées Haki | Q-M2, Q-M3, Q-M5 | à faire |
| M9 | Finitions | raccourcis, thèmes, export Markdown, **1re release** | Q-M4 | à faire |

Remarque : l'import Notion (M5) arrive après les fiches et la sauvegarde pour pouvoir vérifier le résultat dans l'app ; on peut l'avancer juste après M4 pour travailler sur les vraies données le plus tôt possible.

## Journal des sessions

### Session 0 · 2026-10-09 (cadrage, sur claude.ai)
- Analyse de l'espace Notion « One Piece » : règles, bases Persos / Groupes / Lieux / Races / Classes / Fruits / Événements, Textes importants, Scénario 1, 4 PJ.
- Analyse du dépôt Sans Nom (v0.3.0) : même système de caracs → décision de reprendre sa stack et ses composants (D-T1).
- Rédaction : CLAUDE.md, ARCHITECTURE, REGLES_ONE_PIECE, DECISIONS, QUESTIONS, cahiers des charges joueur et MJ, modèle de données MJ, procédure d'import Notion.
- Reste à faire : trancher les questions ouvertes (surtout Q-T1, Q-T2, Q-R3, Q-J1), puis démarrer C1 dans Claude Code.
- Point d'attention : la requête SQL multi-bases du connecteur Notion demande le plan Business ; sans incidence puisque la migration passe par l'export officiel.

### Session 0 bis · 2026-10-09 (réponses du MJ)
- Q-T1 : « Vivre Card » (joueur) et « One Piece » (MJ). Q-T2 : dépôt public. Q-J1 : une classe au départ, modèle en liste.
- Q-R3 : Anges = Skypiéens. Le MJ explique que l'éparpillement des noms dans Notion est l'une des raisons de la migration → nouvelle décision D-M8 (nom de référence, alias, fusion, doublons probables, table de synonymes à l'import).
- Q-R4 : règle du Haki précisée (5 meilleurs résultats pour Observation/Armement, un 1–5 pour Rois, sinon entraînement ; ensuite compétences à coût fixe ou usage à volonté). REGLES §7, D-J6 et cahier joueur §4.5 réécrits.
- Nouvelles questions : Q-R6 (Lunariens), Q-M8 (relevé des jets de Haki dans le journal MJ).
- Prochaine étape : C1 dans Claude Code.

### Session 0 ter · 2026-10-09 (réponses du MJ)
- Haki retiré de Vivre Card : règle propre au MJ ; le joueur ajoute seulement une compétence d'origine Haki quand le MJ annonce la maîtrise. Pas de bouton Épuisement (D-J6 révisée).
- Q-R6 : Lunariens non jouables → liste des races de Vivre Card fermée à 5 (Humain, Homme-Poisson, Skypiéen, Tontata, Mink).
- Q-M8 : relevé des jets de Haki par une entrée « Haki » du journal de session (D-M9).

### Session 1 · 2026-10-09 (C1 — socle monorepo, Claude Code)
- Fait : workspaces npm (`packages/*`, `apps/*`, `tools/*`), `.gitignore` (Android, clés, contenu du monde).
- `packages/core` (`@onepiece/core`, consommé depuis les sources, sans build, D-T7) :
  - `model/` : 8 caracs (`STATS`, `Stat`, `TempBonus`, `emptyStats`), `Resource`, races jouables avec bases et alias (Anges → Skypiéen, `findRace`), tribus, 11 classes avec avantages, paliers D10/D20/D100 et leurs critiques, types de fruit, origines de compétence, gardes `is*`.
  - `rules/` : `numbers` (LIMITS, clampInt, parseIntInput), `stats` (caracs, avantages, bonus temporaires, valeur finale), `resources` (bornes 0..max, régénération), repris de Sans Nom car les composants en dépendent. Ambition/race, transfert, XP et mémos restent pour C2.
  - `ui/` : `Sheet`, `NumberInput`, `back.ts`, `StatGrid`, `ResourceDiamond`, `TempBonuses`, `theme.css` (couleurs `--vitalite`, `--endurance`, `--reve`, `--ambition`, `--perso`). Identifiants HTML uniques par instance (`$props.id()`) pour pouvoir afficher PJ et compagnon sur le même écran.
  - 18 tests Vitest (caracs, bonus, ressources, listes fermées, bouton retour).
- Coquilles `apps/joueur` (banc d'essai des composants, rien n'est enregistré) et `apps/mj` (page d'attente), sans Capacitor. Vérifiées dans le navigateur (360 × 780 pour le joueur) et en build de production.
- `npm run check` et `npm test` verts. `.claude/launch.json` : serveurs de dev `joueur` (5173) et `mj` (5174).
- Point d'attention : un **npm 6.13.4** traîne dans `C:\node_modules` (2019). npm ajoute les `node_modules/.bin` parents au PATH des scripts : tout `npm run` imbriqué tombe sur ce vieux npm, qui ignore `--workspaces` et relance le script racine en boucle. Les scripts racine appellent donc directement `vite`, `svelte-check`, `tsc` et `vitest`. À garder pour les futurs scripts (`android:joueur`…), ou supprimer `C:\node_modules` si rien ne s'en sert.
- Avantages dans le détail d'une carac : libellé neutre « Avantages » (Sans Nom disait « relances ») tant que Q-R1 est ouverte.
- Reste à faire : J0 (Capacitor, `appId`, SQLite + repository + repli web, accueil, CI `joueur.yml`) ; dépôt git à initialiser et premier commit.
