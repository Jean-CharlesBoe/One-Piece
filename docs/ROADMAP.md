# Roadmap

Étape en cours : **J2 — Fruit du démon** (code fait, à essayer sur téléphone). Ensuite : J3 (compétences), bloquée par Q-J4. C2 attend Q-R1, Q-R2, Q-R5 pour les textes des mémos.

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
| J0 | Socle Android | Capacitor, `appId`, SQLite + repository + repli web, accueil (liste), CI `joueur.yml`, APK debug, clé de signature | — | fait |
| J1 | Onglet Fiche | identité, caracs, bonus temporaires, ressources (Vitalité, Endurance, Rêve, Ambition), ressources perso, XP, équipement, inventaire, modes jeu/édition, sauvegarde auto | — | fait |
| J2 | Fruit du démon | bloc fruit (nom, type, description, éveil), lien vers ses techniques | — | en cours (code fait, test téléphone à faire) |
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

### Session 2 · 2026-10-09 (D-M10, J0 — socle Android de Vivre Card)
- D-M10 validée : appli MJ pensée pour le Chromebook, pas de version mobile ; repli 3 → 2 → 1 colonne selon la largeur de fenêtre (1280 / 900 px). Cahier MJ §2-§3 et ARCHITECTURE à jour.
- `packages/core` : type `Skill` partagé (coût en Endurance, origine), briques `normalize*` (caracs, bonus, ressources, compétences) et lecteurs `read.*`, réutilisables pour les PNJ (M7). Caracs à 0 par défaut (D-J10, proposée).
- `apps/joueur` : Capacitor 8 (`fr.onepiecejdr.joueur`, « Vivre Card »), modèle `Character` (§6 du cahier, sans prime/berries ni Transfert en attendant Q-J2/Q-J3), `normalizeCharacter` + tests, repository SQLite (migration 1) et repli `localStorage`, accueil (liste avec « Race · Classe », créer, ouvrir, supprimer en deux temps, version), écran personnage provisoire, bouton retour Android.
- Projet `apps/joueur/android` généré ; `build.gradle` repris de Sans Nom (signature par variables d'environnement ou `keystore.properties`, version depuis le tag).
- CI `.github/workflows/joueur.yml` : check + tests du monorepo, APK debug en artefact ; tag `joueur-vX.Y.Z` → APK signé + Release (vérifie que le tag = version de `apps/joueur/package.json`). `docs/RELEASE.md` adapté (une clé pour les deux applis).
- Vérifié : `npm run check`, 29 tests, parcours accueil → personnage → accueil → suppression dans le navigateur (360 × 780).
- **Non vérifié** : build APK en local. Deux obstacles sur le poste : (1) l'environnement de Claude Code ne laisse pas Gradle ouvrir ses connexions locales (le terminal intégré, lui, le permet) ; (2) le JDK d'Android Studio est en **Java 25**, que Gradle 8.14.3 (gabarit Capacitor 8) ne gère pas : « Unsupported class file major version 69 ». La CI utilise Java 21 et n'est pas concernée. En local : installer un JDK 21 (ou régler le JDK Gradle d'Android Studio sur 21).
- Reste à faire pour clore J0 : créer le dépôt GitHub et pousser ; générer la clé de signature et les secrets (docs/RELEASE.md) ; premier run CI vert ; installer l'APK de debug sur un téléphone et faire les vérifications de RELEASE.md (persistance SQLite après fermeture de l'app).

### Session 2 (suite) · 2026-10-09
- Dépôt public créé et poussé par le MJ : https://github.com/Jean-CharlesBoe/One-Piece
- Premier run CI « Vivre Card (joueur) » **vert** (check, tests, APK debug en 2 min 11 s), artefact `vivrecard-debug-apk`.
- Clé de signature créée par le MJ, 4 secrets en place (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). La chaîne de release signée n'est pas encore éprouvée : elle le sera au premier tag `joueur-v…` (empreinte SHA-256 à noter alors dans RELEASE.md).
- Avertissement CI sans effet pour l'instant : `ubuntu-latest` passe à Ubuntu 26 à partir du 19/10/2026 ; surveiller le prochain run après cette date.
- Reste pour clore J0 : installer l'APK de debug sur un téléphone et faire les vérifications de RELEASE.md (surtout la persistance SQLite après fermeture complète de l'app).

### Session 3 · 2026-10-09 (J0 close, J1 — onglet Fiche)
- J0 terminée : APK de debug testé sur téléphone par le MJ (création, retour, persistance SQLite après fermeture, suppression, thème sombre).
- `packages/core` :
  - règles : `identity` (Ambition et tribus réservées aux Humains, valeurs conservées au changement de race ; une classe à l'écran, liste en base), `xp` (compteur + `XP_COSTS` de REGLES §4), `lists` (`moveItem`, `removeById`), `resources` (`isEvanoui` : Endurance à 0 avec un max renseigné ; ressources perso : ajout, nom, règle) ;
  - `CustomResource` et `normalizeCustomResources` descendus dans core (utiles aux PNJ en M7) ;
  - `ResourceSheet` : fenêtre de dépense / récupération séparée du losange, réutilisée par les ressources perso.
- `apps/joueur` : écran personnage avec onglets Fiche / Compétences / Compagnons (les deux derniers en attente de J3 / J4), modes jeu / édition, sauvegarde automatique (400 ms, immédiate au retour et en arrière-plan) ; onglet Fiche : identité (nom, surnom, âge, race, tribu si Humain, classe, palier D10/D20/D100, rêve replié dépliable), caracs, bonus temporaires, bandeau « Évanoui », losanges Vitalité / Endurance / Rêve / Ambition (Humain seulement), ressources personnelles (liste, ↑ ↓, suppression en deux temps, nom et règle dans la fenêtre), XP avec rappel des coûts, équipement, inventaire.
- Vérifié : check, 35 tests, parcours complet dans le navigateur à 360 × 780 avec rechargement (tout est conservé), console sans erreur.
- Pas encore fait (questions ouvertes ou étapes suivantes) : bloc Fruit (J2), prime/berries (Q-J2), Nouveau jour / Transfert (Q-J3), menu ⋮ (Aide-mémoire J5, Dupliquer / Exporter J6), mémos « i » (J5).
- Retour du MJ (D-J11) : section « Ressources » unique, « + Ressource » sur la ligne du titre, ressources perso en losanges sarcelle à la suite des autres, deux par ligne, écart vertical agrandi ; nom / règle / ordre / suppression dans la fenêtre de la ressource. `ResourceDiamond` accepte maintenant `note`, `extra` et `open` liable.
- Reste pour clore J1 : essayer l'APK de debug sur téléphone (saisie au pouce, clavier numérique, fenêtres du bas, retour Android qui ferme d'abord la fenêtre ouverte).
- Retours du MJ après J1 :
  - **Clé de debug fixe** (D-T8) : `apps/joueur/android/debug.keystore` versionné et branché dans `build.gradle` ; les APK de debug successifs s'installent par-dessus (il fallait désinstaller à chaque run, Android refusant une signature différente). Une dernière désinstallation est nécessaire pour passer à cette clé.
  - **Palier de dé retiré** (D-J8 abandonnée) : plus de sélecteur ni de pastille, champ `palierDe` retiré du modèle (perdu à la lecture, sans migration) ; la Classe prend toute la largeur du formulaire. L'aide-mémoire (J5) montrera les trois paliers. `PALIERS` / `PALIER_INFO` restent dans core pour les mémos.

### Session 4 · 2026-10-09 (J1 close, J2 — fruit du démon)
- J1 terminée : APK de debug (clé fixe) testé sur téléphone par le MJ.
- `packages/core` : `model/fruit.ts` (`Fruit`, `createFruit`), `rules/fruit.ts` (`addFruit`, `removeFruit`, `isFruitEmpty`, `fruitTechniques` = compétences d'origine « fruit », `FRUIT_RAPPEL`), `normalizeFruit` ; couleur `--fruit` (magenta) au thème. Le type `Fruit` quitte le modèle joueur pour core (utile à l'appli MJ).
- `apps/joueur` : `FruitBlock` sous l'identité. Édition : « + Fruit du démon », nom, type (Paramecia / Zoan / Logia / Inconnu), description, éveil, « Retirer le fruit » en deux temps. Jeu : bloc masqué si vide, replié (titre, nom, pastille du type), déplié d'un tap (description, éveil, rappel « ne sait pas nager »). Lien « Voir les techniques (n) » affiché dès qu'une compétence d'origine « fruit » existe : il ouvre l'onglet Compétences (le filtre « Fruit » viendra avec J3).
- Vérifié : check, 39 tests, parcours complet dans le navigateur à 360 × 780 (création, rechargement, dépliage, lien, retrait), console sans erreur. Nom du fruit qui était tronqué à 360 px : titre du bloc passé au-dessus.
- Prochaine étape : J3 (compétences), qui attend la réponse à **Q-J4** (retirer l'Endurance d'un tap long sur le coût d'une compétence, ou ajustement à la main du losange comme dans Sans Nom).
