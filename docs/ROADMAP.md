# Roadmap

Étape en cours : **J5 — Mémos** (code fait, à essayer sur téléphone). Ensuite : **J7 — Finitions** (mode sombre / clair, notice joueurs, icône Q-T4, 1re release), puis l'appli MJ (M0).

Ordre conseillé : socle commun, puis **l'appli joueur d'abord** (proche de Sans Nom, livrable vite aux joueurs), puis l'appli MJ. Les deux branches peuvent avancer en parallèle après C1.

## Commun

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| C0 | Cadrage | Specs, décisions, questions | — | fait (v0.2) |
| C1 | Socle monorepo | workspaces npm, `packages/core` (caracs, races, classes, paliers, `Resource`, `TempBonus`), composants repris de Sans Nom (StatGrid, ResourceDiamond, TempBonuses, Sheet, NumberInput, back.ts), Vitest, `npm run check` | — | fait |
| C2 | Règles et mémos | `packages/core/src/rules` (stats, ressources bornées, ambition/race, transfert, xp) + `memos.ts` depuis REGLES_ONE_PIECE.md ; tests | — | fait (au fil de J1 à J5) |

## Appli joueur

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| J0 | Socle Android | Capacitor, `appId`, SQLite + repository + repli web, accueil (liste), CI `joueur.yml`, APK debug, clé de signature | — | fait |
| J1 | Onglet Fiche | identité, caracs, bonus temporaires, ressources (Vitalité, Endurance, Rêve, Ambition), ressources perso, XP, équipement, inventaire, modes jeu/édition, sauvegarde auto | — | fait |
| J2 | Fruit du démon | bloc fruit (nom, type, description, éveil), lien vers ses techniques | — | fait |
| J3 | Compétences | SkillList, coût en Endurance, origine + filtre | — | fait |
| J4 | Compagnons | liste + fiche compagnon | — | fait |
| J5 | Mémos | boutons « i », aide-mémoire | — | en cours (code fait, test téléphone à faire) |
| J6 | Sauvegarde | export/import JSON, rappel, test de mise à jour par-dessus | — | fait |
| J7 | Finitions | mode sombre/clair (fait, D-J19), notice joueurs texte et PDF (fait), icône, **1re release** | Q-T4 | en cours |

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

### Session 5 · 2026-10-10 (J2 close, Q-J4, J3 — compétences)
- J2 terminée : testée sur téléphone par le MJ.
- Q-J4 répondue : pas de raccourci de dépense, le joueur ajuste le losange Endurance à la main comme dans Sans Nom (D-J12). QUESTIONS, cahier §4.7 et DECISIONS à jour.
- `packages/core` : `rules/skills.ts` (`addSkill`, `updateSkill` avec origine, `filterSkills`, `usedOrigins`), libellés courts des origines (`skillOriginLabel`), couleurs `--o-fruit`, `--o-combat`, `--o-race`, `--o-haki`, `--o-autre` ; `ui/SkillList.svelte` repris de Sans Nom (cartes repliées avec titre, pastille d'origine, coût « n End. », 1re ligne ; « Tout déplier » ; édition : titre, coût, origine, description, ↑ ↓, suppression en deux temps), avec filtre par origine en mode jeu. Composant partagé : servira aux compagnons (J4) et aux PNJ (M7).
- `apps/joueur` : onglet Compétences branché ; le lien « Voir les techniques » du fruit ouvre la liste filtrée sur « Fruit ».
- Vérifié : check, 42 tests, parcours dans le navigateur à 360 × 780 (4 compétences, filtres, lien du fruit, dépliage, rechargement, réordonnancement, suppression), console sans erreur.
- Point d'attention : le stockage du navigateur intégré semble repartir de zéro à chaque nouvelle session de travail (les fiches de test « ozmo » / « Osmo » n'y étaient plus) ; sans incidence sur les téléphones.
- Reste pour clore J3 : test sur téléphone. Ensuite : J4 (compagnons).

### Session 6 · 2026-10-11 (J3 close, J4 — compagnons)
- J3 terminée : testée sur téléphone par le MJ.
- `apps/joueur` : `COMPAGNON_TYPES` (Animal, Monture, Den Den Mushi, Autre) et `addCompagnon` + test ; `CompagnonsTab` (liste : nom, « type · race », Vitalité et Endurance en résumé ; « + Ajouter » par une fenêtre du bas ; ↑ ↓ en édition) et `CompagnonView` (nom, type avec suggestions, race libre, caracs, bonus temporaires, losanges Vitalité / Endurance deux par ligne, équipement, inventaire, compétences avec la liste partagée de J3, suppression en deux temps), repris de `InvocationsTab` / `CreatureView` de Sans Nom. Bouton retour Android : fiche du compagnon → liste des compagnons.
- Vérifié : check, 43 tests, parcours dans le navigateur à 360 × 780 (création, fiche, ressources, compétence, rechargement, retour à la liste, suppression), console sans erreur.
- `.claude/launch.json` : serveurs de dev passés sur les ports 5183 (joueur) et 5184 (MJ), le 5173 étant pris par un autre projet.
- Reste pour clore J4 : test sur téléphone. Ensuite : **Q-J5** à trancher pour J5 (mémos « i » contextuels + aide-mémoire, D-J7), ou J6 (sauvegarde fichier) qui n'est bloquée par rien.

### Session 6 (suite) · 2026-10-11 (réponses du MJ, Info / Caractéristiques / Prime)
- J4 poussée (commit `f065d5b`), test téléphone à faire.
- Réponses du MJ : **Q-J5** validée (D-J7 validée) ; **Q-R1** comme Sans Nom (relances) ; **Q-R2** Ambition +2 sur un jet, sans annuler un échec critique ni créer une réussite critique, avec des rappels sur le Transfert (plafonné au max), le Rêve et une régénération hors combat de 2D6 (REGLES §1 et §3 à jour) ; **Q-J2** prime oui, berries encore ouvertes.
- **Q-R5** : source retrouvée dans Notion (page « Règles », §6 « Système de combat », point 2 « Calcul des dégâts »), le MJ la relit. Écarts relevés entre Notion et le rappel du MJ (Ambition +2, plafond du Transfert, régénération 2D6) : le rappel du MJ fait foi.
- `packages/core` : `rules/memos.ts` (`Memo`, `STAT_DESCRIPTIONS`, `MEMO_CARACS`), `ui/InfoButton.svelte` (bouton « i » + fenêtre du bas), `rules/prime.ts` (`parsePrime`, `setPrime`, `formatPrime`, borne `LIMITS.primeMax`) ; tests.
- `apps/joueur` : bloc « Info » (surnom, race · tribu · classe · âge, rêve en texte simple ; D-J13), encart « Prime » (D-J14 ; champ `prime` dans le modèle et `normalizeCharacter`), titre « Caractéristiques » avec bouton « i ».
- Format stocké : `prime` ajouté sans changer `SCHEMA_VERSION` (aucune version publiée ; les fiches existantes reçoivent `prime: null` à la lecture).
- Vérifié : check, 47 tests, rendu à 360 × 780 (Info, Prime « 30 000 000 ฿ », mémo des caracs), console sans erreur.
- Reste : confirmer « 1 point d'Ambition = +2 » ; Q-R5 ; Q-J2 (berries) ; Q-J3 (Nouveau jour / Transfert, désormais mieux défini).
- Retours du MJ (même jour) : prime affichée comme une ligne du bloc Info (« Prime : 30 000 000 ฿ »), l'encart jugé trop encombrant est retiré (composant `PrimeBlock` supprimé, saisie dans le formulaire Info) ; berries = entrée d'inventaire (Q-J2 close) ; Ambition confirmée (1 point = +2) ; lien Notion donné au MJ pour Q-R5.

### Session 6 (fin) · 2026-10-11 (Q-R5, Q-J3, mémo Ressources, J6 — sauvegarde)
- Réponses du MJ : **Q-R5** confirmée (1D6 + modificateur de caractéristique, formulation conservée) ; **Q-J3** à la main (D-J15). Plus aucune question ouverte pour l'appli joueur.
- `MEMO_RESSOURCES` (Vitalité, Endurance, Rêve, Ambition 1 pt = +2, Transfert, régénération 2D6, ressources perso) + bouton « i » à côté du titre « Ressources ».
- **J6** (D-J16), repris de Sans Nom : `backup/format.ts` (format `onepiece-joueur-sauvegarde` v1, `parseBackup` via `normalizeCharacter`, `asCopy`, `backupStatus`, noms de fichiers) + tests ; `backup/share.ts` (feuille de partage Android, téléchargement dans le navigateur) ; `BackupPanel` à l'accueil ; menu ⋮ de la fiche (Exporter ce personnage, Dupliquer). Plugins `@capacitor/filesystem` et `@capacitor/share` ajoutés, projet Android synchronisé.
- Bug trouvé au test et corrigé : « Garder les deux » échouait (`structuredClone` refuse les proxys `$state`) → copie par JSON et `$state.snapshot` avant enregistrement ; test ajouté. Espace manquant dans « …pour l'instant. Pense à sauvegarder ! » (défaut hérité de Sans Nom) corrigé.
- Vérifié : check, 57 tests, dans le navigateur à 360 × 780 : rappel rouge, import d'un fichier (Garder les deux + nouveau), Dupliquer ; console sans erreur. Fiches de test supprimées, la fiche « Ozmo » du navigateur intégré laissée intacte. Le bouton « Sauvegarder » n'a pas été cliqué (il déclenche un téléchargement).
- Reste pour clore J6, sur téléphone : « Sauvegarder » vers Drive ou par message, réimport du fichier, « Exporter ce personnage », et une mise à jour de l'APK par-dessus en gardant les fiches.

### Session 6 (retours avant commit) · 2026-10-11 (prime, compagnons = fiche PJ)
- **Prime** : la ligne n'apparaît plus si aucune prime n'est saisie (D-J14 précisée).
- **Compagnons** (D-J17, plan validé avec le MJ) : même fiche qu'un PJ ; type supprimé ; race = 5 races jouables + « Autre race… » (champ libre) ; « Humain » → tribu et Ambition. Interface `Fiche` commune, `createFiche`, normalisation commune (`readFiche`) ; `IdentityBlock` (option `freeRace`), `FruitBlock`, `ResourcesBlock` et `FicheTab` acceptent un PJ ou un compagnon ; `CompagnonView` = `FicheTab` + compétences + suppression ; lien des techniques du fruit qui filtre et descend jusqu'à la liste (défilement direct : le défilement « doux » ne s'exécutait pas dans le navigateur de test). Core : `hasAmbition` / `hasTribu` / `setRace` acceptent une race libre, nouveau `isAutreRace`.
- Vérifié : check, 61 tests, parcours navigateur 360 × 780 (prime vidée, « Autre race… » ↔ « Humain », Ambition et tribu, classe, âge, prime, fruit + lien, compétence, XP, rechargement), console sans erreur ; fiche de test supprimée, « Ozmo » intacte.

### Session 7 · 2026-10-11 (J4 et J6 close, J5 — mémos)
- J4, J6 et la fiche compagnon (D-J17) testés sur téléphone par le MJ : OK.
- `packages/core/src/rules/memos.ts` : tables `DIFFICULTES`, `ENDURANCE_COSTS`, `XP_PAR_ADVERSAIRE`, `ATTAQUE_DE_BASE`, `REGLE_AVANTAGES` (formulation unique, aussi utilisée par le mémo des caracs) ; mémos `MEMO_XP`, `MEMO_COMPETENCES`, `MEMO_FRUIT` ; `AIDE_MEMOIRE` (Jets, Critiques, Combat, Ressources, XP) ; tests `memos.test.ts`.
- `ui/AideMemoire.svelte` (sections et tableaux, réutilisable par l'appli MJ) ; « i » ajouté à `SkillList` (donc aussi chez les compagnons) ; description de la carac dans le détail de `StatGrid`.
- `apps/joueur` : « i » sur Fruit (édition et jeu) et XP ; menu ⋮ → « Aide-mémoire » (fenêtre du bas défilante).
- C2 marquée faite : ses règles et mémos ont été livrés au fil de J1 à J5.
- Vérifié : check, 67 tests, navigateur 360 × 780 (5 boutons « i » sur la fiche, détail d'une carac, aide-mémoire complète et défilante, « i » des compétences), console sans erreur ; fiche de test supprimée.
- Non fait : l'option « désactiver les i » prévue dans D-J7 (aucun écran de réglages) — à trancher avec le MJ pour J7.
- Retour du MJ (D-J18) : retirés de Vivre Card l'XP par adversaire et l'XP narratif (le « i » de l'XP disparaît), le barème d'Endurance, les règles de création et l'attaque de base (mémos Compétences et Fruit, section « Combat » de l'aide-mémoire), et la valeur 2D6 de la régénération. Tables gardées dans core pour l'appli MJ ; test garde-fou ajouté. Vérifié : check, 72 tests, navigateur (2 « i » sur la fiche, mémos et aide-mémoire épurés).
- Suite (même jour) : seuils de difficulté retirés de l'aide-mémoire (info MJ, D-J18) ; coûts de dépense d'XP gardés ; encart « Réglages » à l'accueil avec « Afficher les boutons « i » » (store `showInfo` dans `core/ui/prefs.ts`, lu par `InfoButton` ; valeur dans la table `meta`, clé `show_info`, chargée au démarrage). Vérifié : check, 73 tests, navigateur (masquage conservé après rechargement, réaffichage, aide-mémoire sans seuils).

### Session 8 · 2026-10-12 (retours du MJ : réglages, thème, Transfert)
- J5 testée sur téléphone : OK (commit `d7136d8`).
- **Réglages** (D-J19) : roue dentée en haut à droite de l'accueil → fenêtre « Réglages » (Sauvegarde, Thème, Affichage) ; encarts Sauvegarde et Réglages retirés de l'accueil ; avertissement rouge sur l'accueil si aucune sauvegarde ou ≥ 7 jours avec modifications (il ouvre les réglages). `BackupPanel` prévient l'accueil après une sauvegarde (`onSaved`).
- **Thème** (D-J19, première brique de J7) : `theme`, `THEMES`, `isTheme`, `watchTheme` dans `core/ui/prefs.ts` ; `theme.css` piloté par `data-theme` ; `watchTheme()` au démarrage des deux apps ; réglage en table `meta` (clé `theme`).
- **Transfert** (D-J20) : `ressources.transfert` (1 / 1, « chaque jour ») sur les PJ et compagnons, losange après l'Ambition, couleur `--transfert` ; normalisation avec valeur par défaut ; tests.
- Vérifié : check, 75 tests, navigateur 360 × 780 en thème sombre émulé (avertissement, roue dentée, réglages, Clair conservé après rechargement, retour en Automatique, losange Transfert 1 / 1), console sans erreur.
- Point d'attention : au démarrage, le thème part en automatique le temps de lire le réglage ; si le joueur a choisi un thème différent de celui du téléphone, un bref changement de couleurs est possible.

### Session 8 (suite) · 2026-10-12 (aide-mémoire, notice joueurs)
- Réglages, thème et Transfert testés sur téléphone par le MJ : OK (commit `fa7570a`).
- Aide-mémoire : tableau des critiques par dé retiré (info MJ, D-J18 complétée) ; textes des mémos et de l'aide-mémoire réécrits sans abréviation (D-J21) : `REGLE_JET`, `REGLE_AVANTAGES`, `REGLE_REGENERATION` partagés ; section « XP » renommée « Expérience » ; coûts d'XP réécrits (« +1 dans une caractéristique », « +2 au maximum de Vitalité ou d'Endurance »…). Tables MJ regroupées en fin de `memos.ts`. Tests : garde-fou étendu (paliers des critiques, abréviations).
- **Notice joueurs** : `docs/joueur/NOTICE.md` (installer, mettre à jour, sauvegarder, utiliser : accueil et roue dentée, modes jeu / édition, fiche, compétences, compagnons, aide-mémoire, bouton retour). README réorganisé avec un lien de téléchargement et la notice ; texte des Releases (`.github/release-notes-joueur.md`) qui renvoie à la notice.
- Reste pour J7 : icône (Q-T4), éventuellement une notice illustrée (PDF avec captures, comme Sans Nom), puis la première release `joueur-v0.1.0`.

### Session 9 · 2026-10-12 (reprise de Sans Nom v0.5 : photo, Carnet, saisie des caracs)
- Notice texte poussée (`8bf8ef4`). Réponses du MJ : l'icône sera dessinée par sa compagne ; notice PDF illustrée à faire, comme Sans Nom.
- Revue de Sans Nom v0.4 → v0.5.2 ; repris à la demande du MJ (D-J22) : **photo** (PJ et compagnons, recadrage), **Carnet** (Lore, Histoire ; personnage seulement), **saisie directe** des caracs.
- `packages/core` : `model/photo.ts`, `model/notebook.ts`, `photo/crop.ts` (+ tests de Sans Nom), `photo/resize.ts`, `rules/notebook.ts` (+ tests), `normalizePhoto`, `normalizeLore`, `normalizeSessions`, `LIMITS.textChapter` / `photoImage` / `photoMiniature` ; `ui/Thumb`, `ui/PhotoAvatar`, `ui/PhotoCropper` ; `StatGrid` : cercle en champ de saisie en mode édition.
- `apps/joueur` : `photo` dans `Fiche`, `lore` / `histoire` dans `Character`, `thumb` dans le résumé ; photo dans le bloc Info ; miniatures dans les listes d'accueil et des compagnons ; onglet **Carnet** (`NotebookTab`, `NoteList`) ; tests (anciennes fiches, aller-retour complet).
- Vérifié : check, 90 tests, navigateur 360 × 780 (photo générée → recadrage → avatar et miniature, carac saisie à 40, Lore et Histoire, 4 onglets sans débordement, rechargement, compagnon avec « + Photo »), aucune erreur sur une page fraîchement chargée (une erreur vue dans la console venait d'un rechargement à chaud de la veille). Notice joueurs mise à jour.
- Reste pour J7 : icône (dessin à venir), notice PDF illustrée, release `joueur-v0.1.0`.

### Session 9 (suite) · 2026-10-12 (notice PDF)
- Photo, Carnet et saisie des caracs testés sur téléphone par le MJ : OK (`921b023`).
- **Notice PDF** `docs/Notice-Vivre-Card.pdf` (12 pages A4 : couverture + 11 parties), générée par Edge sans interface depuis `docs/notice/notice.html` ; 23 captures 375 × 812 en thème clair (une en sombre) dans `docs/notice/img/`, prises dans le navigateur intégré sur un personnage d'exemple (« Osmo le Chanceux », compagnon Karoo, photos dessinées). Le stockage du navigateur a été mis de côté puis remis à l'identique (fiche « ozmo » du MJ). Liens depuis le README, la notice texte et le texte des Releases ; procédure de régénération dans RELEASE.md.
- Icône : le dessin arrivera plus tard (plusieurs semaines possibles).
