# Roadmap

Étape en cours : **appli MJ, M2 (fiches)** : M2a, M2b et M2c faites dans le navigateur (2026-10-16). M1 (passage au web) : publiée sur https://jean-charlesboe.github.io/One-Piece/ (v0.1.0), à vérifier par le MJ sur le PC et le Chromebook (installation, hors ligne, écriture dans Drive). Ensuite : M3 (navigation, recherche, onglets). M0 close (CI verte) ; son volet Android sera retiré en M1. Vivre Card v0.1.0 est publiée ; il lui reste l'icône (dessin à venir, Q-T4).

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
| J7 | Finitions | mode sombre/clair (fait, D-J19), notice joueurs texte et PDF (fait), **1re release** (faite : v0.1.0), icône (à venir) | Q-T4 | en cours (icône seulement) |

## Appli MJ

| # | Étape | Contenu | Bloquée par | Statut |
|---|---|---|---|---|
| M0 | Socle | Capacitor, `appId`, schéma SQLite (migration 1), repository, repli web, CI `mj.yml`, disposition 3 colonnes | — | fait (volet Android abandonné : D-M18) |
| M1 | Appli web (D-M18) | retrait de Capacitor, manifeste PWA + service worker (hors ligne), stockage persistant, CI → GitHub Pages ; **sur les appareils** : installation sur le Chromebook et le PC, écriture automatique dans un dossier Google Drive | — | en cours (code fait, vérification sur appareils) |
| M2a | Fiches (cœur) | registre des types, lecture (propriétés, Markdown rendu), édition (formulaire + CodeMirror, `[[`), liens et rétroliens, liens rouges, pages enfants, épinglés, archives, changement de type, alias, avertissement de doublon | — | fait (navigateur) |
| M2b | Fiches (suite) | renommage qui met à jour les `[[liens]]` (avec confirmation), « Déplacer vers… », « Annuler la dernière modification » | — | fait (navigateur) |
| M2c | Un nom par chose | fusion de deux fiches, vue « Doublons probables » (détection approchée), « Ajouter comme alias » | — | fait (navigateur) |
| M3 | Navigation et recherche | Ctrl+K, listes filtrées, épinglés, récents, arborescences, historique, onglets (D-M14) | — | à faire |
| M4 | Sauvegarde et relais | `.opmj` (zip + médias), sauvegarde automatique dans le dossier Drive, reprise de la version la plus récente au lancement, conflit signalé, restauration, rappel | — | à faire |
| M5 | Import Notion | script `tools/notion-import`, table de synonymes, fixtures, rapport (doublons probables) ; import réel et vérification avec le MJ | — | à faire |
| M6 | Documents | import image/PDF, visionneuse | — | à faire |
| M7 | Bloc de jeu PNJ | StatGrid, ressources, techniques, Haki, catégorie d'adversaire | — | à faire |
| M8 | Sessions | campagnes, sessions, écran Session en cours, journal, entrées automatiques, chronologie des fiches, fin de session, entrées Haki | — | à faire |
| M9 | Finitions | raccourcis, thèmes, exports (Markdown, PDF, documents, D-M16), **1re release** | — | à faire |

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

### Session 9 (fin) · 2026-10-12 (première release)
- **Vivre Card v0.1.0 publiée** : https://github.com/Jean-CharlesBoe/One-Piece/releases/tag/joueur-v0.1.0 (`VivreCard-v0.1.0.apk`, 12 Mo, signé avec la clé officielle ; empreinte SHA-256 notée dans RELEASE.md). Icône Capacitor par défaut en attendant le dessin.
- Deux échecs avant la publication, sans rien publier : la CI ne savait pas décoder le secret `ANDROID_KEYSTORE_BASE64` (`base64: invalid input`). Correctif dans la CI (ne garder que les caractères base64, utile si le secret finit par \r\n) et secret renvoyé par le MJ avec `gh secret set … --body (…)`, sans `|`. Le tag `joueur-v0.1.0` a été replacé une fois sur le commit corrigé (`3b05c50`), aucune Release n'existant encore.
- `appId` `fr.onepiecejdr.joueur` et clé de signature désormais **définitifs** (D-T5).
- À faire par le MJ : sauvegarder ses fiches, désinstaller l'APK de debug (signature différente), installer `VivreCard-v0.1.0.apk`, réimporter la sauvegarde. Ensuite, les versions suivantes s'installeront par-dessus.
- Suite : icône (Q-T4) dans une prochaine version ; appli MJ (M0, avec D-M10).

### Session 10 · 2026-10-12 (M0 — socle de l'appli MJ)
- `apps/mj` : Capacitor 8 (`fr.onepiecejdr.mj`, « One Piece »), projet `apps/mj/android` généré puis aligné sur Vivre Card (`build.gradle` : signature par variables d'environnement ou `keystore.properties`, version depuis le tag `mj-v…` ; `debug.keystore` copié, D-T8) ; manifeste : écran tactile non requis (Chromebook).
- Modèle : registre des 11 types (identité seulement, les champs viennent en M2), `Entity`, `createEntity`, `normalizeEntity` (lit les colonnes SQL ou le modèle, ne lève jamais).
- Stockage : migration 1 (MODELE_DONNEES §2), clés étrangères actives, refus d'une base plus récente que l'app ; repository (réglages, compteurs par type, liste, lecture, enregistrement) sur une petite interface SQL commune au plugin natif, à jeep-sqlite (dev web) et à sql.js (tests).
- **D-M11** (proposée) : sql.js n'a pas FTS5 → l'index `search_index` sort des migrations ; créé à l'ouverture en FTS5, sinon FTS4, sinon aucun ; moteur affiché dans Réglages › À propos.
- Repli web : jeep-sqlite 2.8.0 embarque le code de sql.js **1.12** ; le wasm de sql.js 1.13+ ne se charge pas (« LinkError … Import #34 »). sql.js fixé à 1.12.0 dans `apps/mj`, wasm servi par le serveur de dev seulement (absent du build). À revoir à chaque mise à jour de jeep-sqlite.
- Interface (D-M10) : barre latérale (recherche inactive, types avec compteurs, Épinglés et Sessions vides, ⚙, version), liste du type, fiche (en-tête seulement, « M2 »), panneau Liens (sections vides) ; 2 colonnes : liste en volet ; 1 colonne : liste ou fiche, barre latérale et Liens en volets. Création d'une fiche (Ctrl+N, type + titre). Réglages : thème (table `meta`), état de la base. Bouton retour Android : fenêtre / volet ouvert, puis fiche → liste en 1 colonne, puis quitter.
- CI `.github/workflows/mj.yml` (artefact `onepiece-mj-debug-apk`, tags `mj-vX.Y.Z` → `OnePiece-vX.Y.Z.apk`), `.github/release-notes-mj.md`, scripts `android:mj` / `android:mj:open`. RELEASE.md, ARCHITECTURE, MODELE_DONNEES et DECISIONS à jour.
- Vérifié : check, 103 tests (13 nouveaux, dont le schéma et le repository sur une vraie base sql.js), build sans wasm, `cap add android` ; navigateur à 1366 × 768 (3 colonnes 230 / 300 / 556 / 280), 1100 × 768 (volet liste) et 800 × 700 (volets ☰ et Liens), création, rechargement (fiche et thème conservés), aucune erreur de l'app dans la console. Fiche de test « Drake » laissée dans la base de dev MJ (port 5184), stockage de Vivre Card non touché.
- **Non vérifié** : APK (Gradle ne tourne pas sur le poste) → premier run de `mj.yml` au prochain push.
- Reste pour clore M0 : run CI vert. Ensuite M1 (vérifications sur le Chromebook) attend **Q-T3** ; M2 (fiches) n'est bloquée par aucune question et peut démarrer.

### Session 11 · 2026-10-16 (M0 close, M2a — fiches)
- M0 commitée et poussée à la demande du MJ (`df53a76`) ; premier run « One Piece (MJ) » **vert** (1 min 55 s), artefact `onepiece-mj-debug-apk`. M0 close ; le test sur le Chromebook reste pour M1 (Q-T3).
- M2 découpée : **M2a** (cette session), M2b (renommage propagé, déplacement, annulation), M2c (fusion, doublons probables).
- Registre complet des 11 types (cahier §4.1) avec titres des rétroliens ; `props.ts` : `normalizeProps` (valeurs normalisées, orphelines), `changeType`, `subtitle`, `displayValue` ; `links.ts` : forme `[[id|Titre]]`, liens rouges, `computeLinks`, `plainText`, `nameKey` / `sameName` (D-M8). `normalizeEntity` normalise désormais les propriétés.
- Repository : catalogue (`listCatalog`), table `links` recalculée à chaque enregistrement (relations + mentions vers des fiches existantes), rétroliens, suppression définitive ; index de recherche avec propriétés lisibles (relations par leur titre) et texte sans balisage.
- Interface : catalogue partagé en mémoire, fiche ouverte avec sauvegarde automatique (400 ms, immédiate en quittant l'édition, en changeant de fiche ou en arrière-plan) ; lecture (fil d'Ariane, sous-titre, alias, étiquettes, propriétés, Markdown rendu avec liens internes et liens rouges) ; édition Ctrl+E (titre avec avertissement de nom identique, type, alias, étiquettes, formulaire généré, sélecteur de relations avec « Créer… », propriétés orphelines, éditeur CodeMirror avec barre d'outils et autocomplétion `[[`) ; panneau Liens (relations, rétroliens nommés, « Mentionné dans », pages enfants) ; épinglés dans la barre latérale ; archives (liste, restaurer, suppression définitive en deux temps) ; avertissement de doublon à la création ; lien rouge cliqué → création de la fiche et réécriture du lien.
- Dépendances : `marked`, `dompurify`, CodeMirror 6 (`@codemirror/*`, `@lezer/highlight`). Bundle MJ : 711 Ko (247 Ko compressés).
- **D-M12** (proposée) : « Fait partie de » des lieux = relation distincte des pages enfants ; rétroliens nommés ; doublons exacts pour l'instant ; catalogue en mémoire ; marked + DOMPurify. MODELE_DONNEES §3 à jour.
- Vérifié : check, 119 tests (16 nouveaux), build ; navigateur 1366 × 768 : faction Marine, personnage Smoker (rôle, état, grade, alias, faction par le sélecteur, prime), texte avec `[[` → lien vers Marine et lien rouge Loguetown, clic sur le lien rouge → fiche Lieu créée et lien réécrit, rétroliens « Membres » sur Marine, épingle, doublon détecté par alias, page enfant (fil d'Ariane), archivage, suppression définitive, rechargement (tout conservé), thème clair, édition à 800 px ; aucune erreur sur une page neuve. Corrigés pendant le test : prime qui perdait ses espaces à la frappe, couleur des liens du texte, police de l'autocomplétion, mention répétée dans les rétroliens, « La compléter » sur une fiche archivée.
- Point d'attention : le stockage du navigateur intégré était vide en début de session (fiche « Drake » de M0 disparue), comme côté joueur. Fiches de test laissées dans la base de dev MJ : Marine, Smoker, Loguetown.
- Reste : M2b, M2c ; M1 attend Q-T3.

### Session 12 · 2026-10-16 (réponses du MJ aux questions de l'appli MJ)
- Q-M2 : un seul groupe de joueurs → une seule campagne. Q-M3 : état des PNJ conservé après la session, bouton « Remettre à l'état de début de session » (D-M13).
- Q-M6 : probablement plus de 25 Mo de médias (nombreux PDF de personnages, images de fruits) → la sauvegarde `.opmj` est indispensable. Q-M7 : pas de champ « Joueur », la parenthèse reste un alias à l'import.
- Propositions validées : onglets légers utilisables à la souris et au doigt (Q-M1, D-M14) ; journal automatique lisible et groupe « Journal » dans la recherche (Q-M3 suite, Q-M5, D-M15) ; exports d'une fiche en Markdown ou PDF et des documents stockés (Q-M4, D-M16).
- Plus aucune question ouverte pour l'appli MJ, sauf Q-T3 (installation sur le Chromebook, bloquante pour M1). Cahier MJ (§3, §4.5, §5.1, §5.2, §6), IMPORT_NOTION et ARCHITECTURE à jour.
- À reprendre avec D-M14 : agrandir les cibles trop petites pour le doigt dans l'interface actuelle (liens du panneau Liens, pastilles ✕, boutons de la barre d'outils de l'éditeur).

### Session 13 · 2026-10-16 (M2b et M2c)
- M2a et les réponses Q-M1 à Q-M7 commitées et poussées (`b1c35ac`). Q-T3 : le Chromebook a bien le Play Store ; reste à choisir comment installer un APK hors Play Store.
- **M2b** : renommage — à la sortie de l'édition, bandeau « Fiche renommée » avec « Mettre à jour les liens de n fiches » (seuls les liens affichés sous l'ancien titre changent, `renameLinks`) et « Garder l'ancien nom comme alias » ; « Déplacer vers… » (fenêtre de recherche, sans boucle : `model/tree.ts`) ; « ↶ Annuler » en édition (versions enregistrées pendant la session d'édition, jusqu'à 50, éditeur de texte rechargé). Actions secondaires de la fiche regroupées dans un menu « ⋯ » (page enfant, déplacer, fusionner, archiver).
- **M2c** : `model/similar.ts` (même nom, faute ou pluriel par distance d'édition, mêmes mots, nom contenu dans l'autre pour un même type), vue « Doublons probables » dans la barre latérale (Fusionner… / Deux choses différentes, paires écartées en table `not_duplicates`) ; fusion (`model/merge.ts`, `mergeOps.ts`) : alias, étiquettes, propriétés comblées, conflits au choix, texte « Repris de … », liens entrants et pages enfants redirigés, fiche absorbée archivée avec un lien vers la fiche gardée ; « Ajouter comme alias » quand un nom proche existe à la création.
- **D-M17** (proposée) : repli web sur sql.js directement (jeep-sqlite retiré de l'appli MJ) — jeep-sqlite restait figé quand le navigateur de test n'était pas affiché ; plus de version de sql.js imposée, 290 Ko de moins au build. ARCHITECTURE, RELEASE et CLAUDE.md à jour.
- Vérifié : check, 131 tests (28 nouveaux), build sans wasm ; dans le navigateur (piloté par JavaScript, la fenêtre n'étant pas affichée) : renommage de Smoker (2 fiches mises à jour, « capitaine » laissé tel quel, ancien nom en alias), annulation pas à pas jusqu'au titre d'origine (pas de bandeau), déplacement d'« Île du Sud » sous Loguetown (Scénario 1 ne peut pas aller sous sa propre page), doublon « Skypieen » / « Skypiéens » détecté puis fusionné (mention de Smoker redirigée), « Skypien » proposé comme nom proche et ajouté en alias ; console sans erreur. Base de dev neuve (nouveau stockage) : fiches de test Marine, Smoker le Chasseur blanc, Rapport de Tashigi, Loguetown, Scénario 1, Île du Sud, Skypiéens.
- Reste : M3 (Ctrl+K, filtres, récents, arborescences, historique, onglets D-M14, cibles tactiles) ; M1 attend le choix d'installation (Q-T3).

### Session 13 (suite) · 2026-10-16 (Q-T3 : l'appli MJ passe au web)
- Le MJ a vu sur son Chromebook la section Développeurs (Linux pas encore configuré) ; il refuse tout risque de réinitialisation (ADB, mode développeur) et la Play Console (25 $).
- Proposition du MJ examinée : appli web + Supabase gratuit. Écartée : mise en pause après 7 jours sans activité, aucune sauvegarde sur l'offre gratuite, internet obligatoire en session, accès à sécuriser (dépôt public connu des joueurs), réécriture du stockage.
- **D-M18** : appli MJ = appli web installable (GitHub Pages, hors ligne), base sql.js sur l'appareil, sauvegarde automatique et passage de relais par un dossier Google Drive, un appareil à la fois (préparation sur PC, jeu sur Chromebook). Q-T3 close. ROADMAP : M1 devient le passage au web, M4 la sauvegarde avec relais.
- À faire côté MJ avant M1 : installer **Google Drive pour ordinateur** sur le PC si ce n'est pas déjà fait.

### Session 14 · 2026-10-16 (M1 — l'appli MJ passe au web)
- D-M18 commitée (`b11b119`).
- Retirés de l'appli MJ : Capacitor, plugins, projet `apps/mj/android`, `capacitor.config.ts`, scripts `android:mj`, texte des Releases APK. La base est toujours sql.js (`webDb.ts`, base IndexedDB `onepiece-mj`), le moteur wasm est désormais une ressource du build.
- Appli installable : `public/manifest.webmanifest`, icônes provisoires (rose des vents dorée, 192, 512 et « maskable » ; rendues avec resvg depuis `icons/icon.svg`, en attendant Q-T4), service worker généré au build (`sw.template.js` + plugin dans `vite.config.ts` : cache de tous les fichiers, nom de cache par build, pages « réseau d'abord »).
- `pwa.svelte.ts` : enregistrement du service worker (production), bouton « Installer l'application », demande de stockage persistant. `backupFolder.ts` : choix d'un dossier (File System Access API, gardé dans IndexedDB), autorisation, test d'écriture et de relecture qui affiche aussi ce qu'a écrit l'autre appareil. Réglages : sections Application et Dossier de sauvegarde.
- CI `mj.yml` : vérification et build à chaque push, **publication manuelle** sur GitHub Pages (`workflow_dispatch`). Version `0.1.0`. `.claude/launch.json` : `mj-build` (essai du build sur le port 5185).
- Vérifié : check, 131 tests, build ; essai du build : service worker actif, 11 fichiers en cache (dont le wasm), manifeste lu, réglages affichés, fiche conservée après rechargement servi par le service worker. Non vérifiable ici : installation, hors ligne réel, stockage protégé (accordé aux apps installées), choix d'un dossier Drive (sélecteur système) ; c'est la vérification M1 sur les appareils (RELEASE.md).
- Publication (accord du MJ) : GitHub Pages activé (source « GitHub Actions »), premier run de publication vert ; https://jean-charlesboe.github.io/One-Piece/ répond, service worker actif (cache `onepiece-mj-0.1.0-…`), aucune erreur.
- Reste pour clore M1 : vérifications du MJ sur le PC et le Chromebook (RELEASE.md › Que vérifier). Docs : RELEASE (section MJ réécrite), ARCHITECTURE, CLAUDE.md, D-T5.
