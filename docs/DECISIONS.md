# Journal des décisions

Format : identifiant · date · décision · pourquoi · statut (`proposée` / `validée` / `abandonnée` / `remplacée`).
Préfixes : **D-T** transverse/technique · **D-J** appli joueur · **D-M** appli MJ.

## Transverses

### D-T0 · 2026-10-09 · Deux applis totalement indépendantes — *validée*
Aucune synchro, aucun échange de fichiers entre l'appli MJ et les applis joueurs. Le MJ ne gère pas et ne voit pas les fiches des PJ : c'est la responsabilité des joueurs.
**Pourquoi** : choix de l'utilisateur ; simplicité, aucun réseau à gérer en partie.

### D-T1 · 2026-10-09 · Stack de Sans Nom pour les deux applis — *validée*
Vite + TypeScript + Svelte 5, Capacitor 8, @capacitor-community/sqlite, Vitest, APK construit et signé par GitHub Actions.
Remplace le choix initial de Flutter (fait avant l'analyse du dépôt Sans Nom).
**Pourquoi** : la chaîne complète (APK signé, mises à jour par-dessus sans perte, sauvegarde par feuille de partage, bouton retour) est déjà en production et testée par les joueurs ; les deux JDR partagent les 8 mêmes caracs, la logique d'avantages et de bonus temporaires, et les ressources en losanges.

### D-T2 · 2026-10-09 · Monorepo avec un paquet `core` partagé — *validée* (mise en place à l'étape C1)
`apps/joueur`, `apps/mj`, `packages/core` (modèle, règles, mémos, composants communs), `tools/notion-import`.
**Pourquoi** : une seule source pour les règles et les listes (races, classes, caracs), sans coupler les apps à l'exécution. Alternative : deux dépôts avec copie du code commun (risque de divergence).

### D-T3 · 2026-10-09 · Base SQLite embarquée dans chaque app, aucune donnée dans un navigateur — *validée* (Vivre Card) ; *remplacée par D-M18* pour l'appli MJ (2026-10-16)
En production, les données vivent uniquement dans la base SQLite native de l'app et dans son dossier privé. Le repli navigateur ne sert qu'au développement (`npm run dev`).

### D-T4 · 2026-10-09 · Sauvegarde par fichier via la feuille de partage — *proposée*
Reprise de D5/D8 de Sans Nom, adaptée (zip avec médias pour le MJ). Voir [ARCHITECTURE.md §4](ARCHITECTURE.md).

### D-T5 · 2026-10-09 · Noms et identifiants Android — *validée* (identifiant de Vivre Card **définitif** depuis la release v0.1.0 du 2026-10-12)
- Appli joueur : **« Vivre Card »**. Appli MJ : **« One Piece »**.
- `appId` : `fr.onepiecejdr.joueur`, définitif depuis la release v0.1.0. (`fr.onepiecejdr.mj` abandonné : l'appli MJ est une appli web, D-M18.) Une seule clé de signature pour les deux apps, sauvegardée hors GitHub.

### D-T6 · 2026-10-09 · Dépôt GitHub public — *validée*
Comme Sans Nom : les joueurs téléchargent l'APK depuis les Releases sans compte. Le contenu du monde (export Notion, sauvegardes `.opmj`) n'est **jamais** versionné : dossiers ignorés par git.

### D-T7 · 2026-10-09 · `@onepiece/core` consommé depuis ses sources, scripts racine sans `npm run` imbriqué — *proposée*
- Le paquet partagé n'a pas d'étape de build : `exports` pointe sur `src/index.ts` (modèle, règles, `back.ts`), `src/ui/*` (composants Svelte) et `theme.css`. Vite compile les `.svelte` du paquet comme ceux de l'app.
- Dépendances d'outillage (Vite, Svelte, TypeScript, Vitest, svelte-check) à la racine ; Capacitor ira dans chaque app.
- Les scripts racine appellent directement les outils (`vite apps/joueur`, `svelte-check --workspace …`, `vitest run` avec `projects`).
**Pourquoi** : pas de build intermédiaire à oublier en dev ; et un npm 6 présent sur le poste (`C:\node_modules`) se retrouve sur le PATH des scripts et boucle sur `npm run … --workspaces`.

### D-T8 · 2026-10-09 · Clé de debug fixe, versionnée — *validée*
Les APK de debug sont signés par `apps/<app>/android/debug.keystore` (alias `androiddebugkey`, mots de passe publics `android`), versionné malgré le dépôt public. Chaque APK de debug de la CI s'installe donc par-dessus le précédent, en gardant les fiches de test.
**Pourquoi** : sans cela, chaque run de CI fabrique sa propre clé de debug et Android refuse la mise à jour (« application non installée ») : il fallait désinstaller et perdre ses fiches à chaque test. Cette clé n'a aucune valeur : la release est signée par la clé officielle, hors dépôt. Debug et release restent incompatibles entre eux.

## Appli joueur

### D-J1 · 2026-10-09 · Calquée sur Sans Nom — *validée*
Mêmes écrans (accueil, onglets, modes jeu/édition, sauvegarde automatique, sauvegarde fichier), adaptés au système One Piece.

### D-J2 · 2026-10-09 · Saisie libre, aucune règle de création contrôlée — *validée*
Pas de contrôle des 40 + 10 points, pas d'application automatique des bonus de race ou de classe. Le joueur saisit ses valeurs.

### D-J3 · 2026-10-09 · Ressources : Vitalité, Endurance, Rêve, Ambition + ressources personnalisées — *validée*
Ambition affichée seulement pour la race Humain (règle du type « Nain sans mana » de Sans Nom : masquée, valeurs conservées).

### D-J4 · 2026-10-09 · Fruit du démon sur la page principale, ses techniques dans Compétences — *validée*

### D-J5 · 2026-10-09 · Onglet « Compagnons » à la place d'« Invocations » — *validée*
Même principe que les créatures de Sans Nom. Fiche du compagnon : voir D-J17.

### D-J6 · 2026-10-09 · Pas de suivi du Haki dans Vivre Card — *validée*
Le Haki est une règle propre au MJ (jets de D100, progression vers la maîtrise) : aucun compteur, état ni bouton d'épuisement dans l'appli joueur. Quand le MJ annonce une maîtrise, le joueur ajoute une compétence d'origine « Haki » (coût fixe en Endurance). Les malus d'épuisement sont annoncés par le MJ et saisis, si besoin, en bonus temporaires.
Remplace la première proposition (compteurs 0/5, maîtrise calculée, bouton Épuisement), jugée hors du rôle de l'appli joueur par le MJ.

### D-J9 · 2026-10-09 · Une classe par personnage, modèle prêt pour plusieurs — *validée*
L'écran n'en propose qu'une ; le modèle stocke une liste (`classes: Classe[]`) pour en autoriser plusieurs plus tard sans migration.

### D-J10 · 2026-10-09 · Caracs à 0 à la création — *proposée*
Un nouveau personnage (et un compagnon) démarre avec les 8 caracs à 0 (Sans Nom : 1). Les 40 points de création se répartissent à partir de zéro (REGLES §4) ; le joueur reste libre (D-J2).

### D-J11 · 2026-10-09 · Ressources personnalisées en losanges, deux par ligne — *validée*
Retour du MJ sur J1 : une seule section « Ressources » (titre et « + Ressource » sur la même ligne) ; les ressources personnalisées ont le même losange que Vitalité / Endurance / Rêve (teinte sarcelle), à leur suite ; jamais plus de deux losanges par ligne, avec un écart vertical plus grand. Nom, règle, ordre et suppression se règlent dans la fenêtre de la ressource (mode édition) ; la règle s'y affiche aussi en mode jeu.
Remplace la liste sous les losanges prévue au cahier §4.4.

### D-J12 · 2026-10-10 · Pas de raccourci de dépense depuis une compétence — *validée*
Réponse du MJ à Q-J4 : comme dans Sans Nom, le joueur ouvre le losange Endurance et retire le coût à la main. La compétence affiche seulement son coût en Endurance ; aucun tap long ni toast d'annulation.

### D-J13 · 2026-10-11 · Blocs titrés « Info » et « Caractéristiques » — *validée*
Demande du MJ : un titre « Caractéristiques » au-dessus de la grille, avec le bouton « i » à côté (premier mémo en place) ; le surnom, race · tribu · classe · âge et le rêve sont regroupés sous un titre « Info », en texte simple (le rêve n'est plus dans un cadre dépliable).

### D-J14 · 2026-10-11 · Prime sur la fiche, dans le bloc Info — *validée*
Les personnages finiront avec une prime sur la tête : ligne « Prime : 30 000 000 ฿ » en bas du bloc Info, **absente si aucune prime n'est saisie** (retour du MJ), même aspect que les autres infos ; saisie en mode édition, séparateurs acceptés. Champ `prime: number | null`. Un premier encart à part a été jugé trop encombrant par le MJ. Pas de champ berries : l'argent en poche est une entrée de l'inventaire (Q-J2).

### D-J15 · 2026-10-11 · Transfert et Ambition quotidienne gérés à la main — *validée*
Complétée par D-J20 (losange Transfert 1 / 1).
Réponse du MJ à Q-J3 : pas de bouton « Nouveau jour » ni d'assistant de Transfert ; le joueur ajuste ses losanges. Le bloc Ressources a un bouton « i » qui rappelle Rêve, Ambition (1 pt = +2), Transfert (25 %, sans dépasser le max) et régénération (2D6 hors combat).

### D-J16 · 2026-10-11 · Sauvegarde fichier de Vivre Card — *validée*
Reprise de Sans Nom (D-T4) : encart « Sauvegarde » à l'accueil (tous les personnages, feuille de partage Android, rappel rouge si modifications et ≥ 7 jours), import avec un choix par personnage (Remplacer / Garder les deux / Ignorer, Importer / Ignorer pour un nouveau). Menu ⋮ de la fiche : « Exporter ce personnage » (même format, un seul perso) et « Dupliquer ». Format `onepiece-joueur-sauvegarde` v1, fichiers `vivrecard-sauvegarde-AAAA-MM-JJ.json` et `vivrecard-<nom>-AAAA-MM-JJ.json`.

### D-J17 · 2026-10-11 · Fiche compagnon identique à la fiche PJ — *validée*
Demande du MJ : un compagnon peut être un être vivant à part entière (race propre, XP, fruit du démon…). Il a donc toute la fiche d'un PJ : surnom, âge, race, tribu, classe, rêve (texte et jauge), prime, fruit, caracs, bonus, Vitalité / Endurance / Rêve / Ambition (si Humain), ressources perso, XP, équipement, inventaire, compétences. Le champ « Type » (Animal, Monture…) disparaît.
Race : les 5 races jouables + « Autre race… » avec un champ libre ; choisir « Humain » fait apparaître tribu et Ambition, comme pour un PJ.
Mise en œuvre : une interface `Fiche` commune à `Character` et `Compagnon`, l'onglet Fiche réutilisé tel quel pour le compagnon (option `freeRace`), `normalizeFiche` commun. Les anciens compagnons sont relus sans migration (aucune version publiée).

### D-J18 · 2026-10-11 · Vivre Card n'affiche pas les règles réservées au MJ — *validée*
Retour du MJ sur J5 : les seuils de difficulté (Facile 8 … Légendaire 70), les valeurs des critiques par dé (D10 : 1 · 10, D20 : 1 · 20, D100 : 1 à 5 · 96 à 100 ; retirées le 2026-10-12), l'XP gagnée par adversaire et l'XP narratif, le barème des coûts d'Endurance (2 à 5 / 6 à 10 / 11 à 15), les règles de création (compétence de fruit à coût ≤ 5, capacité de style de combat), l'attaque de base et les dés de régénération (2D6, susceptibles d'évoluer) sont des infos MJ : elles n'apparaissent ni dans les mémos « i » ni dans l'aide-mémoire. Le « i » de l'XP disparaît (les coûts de dépense restent sous le compteur). Les tables restent dans `packages/core/src/rules/memos.ts` pour l'appli MJ ; un test vérifie qu'elles ne réapparaissent pas côté joueur.

### D-J19 · 2026-10-12 · Réglages derrière une roue dentée, thème clair / sombre — *validée*
Demande du MJ : l'accueil ne garde que la liste des personnages. Une roue dentée en haut à droite ouvre la fenêtre « Réglages » : Sauvegarde (sauvegarder / importer), Thème (Automatique / Clair / Sombre, automatique = celui du téléphone) et Affichage (boutons « i »). L'accueil n'affiche plus que l'avertissement de sauvegarde (aucune sauvegarde, ou modifications et ≥ 7 jours), qui ouvre les réglages.
Mise en œuvre : `theme.css` passe d'une requête média à l'attribut `data-theme` posé par `watchTheme` (`core/ui/prefs.ts`), aussi utilisé par l'appli MJ ; réglage enregistré dans la table `meta` (clé `theme`).

### D-J20 · 2026-10-12 · Losange « Transfert » sur la fiche — *validée*
Demande du MJ : le Transfert (1 fois par jour, toutes races) apparaît comme une ressource à part, **1 / 1** par défaut (régénération « chaque jour »), pour que le joueur n'oublie pas qu'il existe. Il reste géré à la main (D-J15). Présent aussi sur la fiche des compagnons ; ajouté sans migration aux fiches existantes.

### D-J21 · 2026-10-12 · Textes joueurs sans abréviation — *validée*
Demande du MJ : les phrases des mémos et de l'aide-mémoire sont complètes et correctes, sans abréviation (« caractéristique » et non « carac », « maximum » et non « max », « points »…). Un test vérifie l'absence des abréviations courantes. La notice joueurs suit la même règle.

### D-J22 · 2026-10-12 · Reprise de Sans Nom v0.5 : photo, Carnet, saisie directe des caracs — *validée*
Demande du MJ après relecture de Sans Nom v0.5.2 :
- **Photo** du personnage et de chaque compagnon (portrait rond, miniature dans les listes, recadrage glisser / zoom), stockée dans la fiche en data URL JPEG (512 px + miniature 96 px), donc incluse dans la sauvegarde. Changer, recadrer ou retirer : mode édition. Comme D9 et D11 de Sans Nom.
- **Carnet** (onglet du personnage seulement, pas des compagnons) : Lore en sections titrées, Histoire en une entrée datée par séance ; écrire sans passer par le crayon.
- **Saisie directe** de la valeur d'une caractéristique en mode édition (D10 de Sans Nom).
Différence avec Sans Nom : pas de colonne SQLite `thumb` ni de migration 2. La liste d'accueil de Vivre Card relit déjà chaque fiche (pour « Race · Classe ») ; elle en tire aussi la miniature. Pas de changement de `SCHEMA_VERSION` (aucune version publiée ; les fiches existantes reçoivent `photo: null`, `lore: []`, `histoire: []` à la lecture).
Code partagé dans core : modèles `Photo`, `LoreSection`, `SessionEntry`, `photo/crop.ts` (testé), `photo/resize.ts`, `rules/notebook.ts`, `normalizePhoto` / `normalizeLore` / `normalizeSessions`, composants `Thumb`, `PhotoAvatar`, `PhotoCropper`.

### D-J7 · 2026-10-09 · Mémos pédagogiques contextuels plutôt qu'un onglet Règles — *validée* (Q-J5, 2026-10-11)
Mise en œuvre (2026-10-11) : les « i » se masquent dans l'encart « Réglages » de l'accueil (réglage enregistré dans la table `meta`) ; l'aide-mémoire est dans le menu ⋮ de la fiche. Les infos réservées au MJ en sont exclues (D-J18).
Bouton « i » discret sur les blocs (carac, ressources, rêve, ambition, XP, compétences) ouvrant une fenêtre du bas avec la règle courte (pas de mémo Haki : règle du MJ). Plus une page « Aide-mémoire » accessible depuis le menu de la fiche (seuils, critiques des trois paliers de dé, coûts d'XP, coûts d'endurance).
**Pourquoi (challenge de l'idée de départ)** : en partie, le joueur cherche une réponse précise à l'endroit où il regarde ; un onglet Règles complet serait lu une fois puis ignoré, et dupliquerait le rôle du MJ. Les textes vivent dans `packages/core/src/rules/memos.ts` : les modifier demande une nouvelle version de l'APK, acceptable puisque le MJ est aussi le développeur.

### D-J8 · 2026-10-09 · Palier de dé sur la fiche — *abandonnée* (2026-10-09)
**Abandon** : le MJ juge l'information inutile, les joueurs connaissent leur dé. Le champ est retiré de l'écran et du modèle (les fiches existantes le perdent à la lecture, sans migration) ; l'aide-mémoire montrera les critiques des trois paliers.
Sélecteur D10 / D20 / D100 dans l'identité, sans calcul automatique : il sert uniquement à afficher les bons seuils de critique dans les mémos.

## Appli MJ

### D-M1 · 2026-10-09 · Base de connaissances structurée en types de fiches — *validée (périmètre), proposée (détail)*
Personnages, Factions, Lieux, Fruits, Races, Classes, Événements, Scénarios, Règles, Notes, Documents. Chaque fiche : champs propres à son type + texte riche + liens. Le MJ enrichit la base hors session.

### D-M2 · 2026-10-09 · Modèle relationnel + registre des types — *proposée*
Une table `entities` générique (type, titre, corps Markdown, propriétés JSON validées par un registre de types en code) + tables `links`, `assets`, `sessions`, `journal_entries`. Voir [mj/MODELE_DONNEES.md](mj/MODELE_DONNEES.md).
**Pourquoi** : la recherche globale, les liens et rétroliens entre fiches et la chronologie demandent des requêtes ; un document JSON par fiche (comme Sans Nom) ne le permet pas. Le registre évite une table par type et permet d'ajouter un champ sans migration SQL.

### D-M3 · 2026-10-09 · Texte riche stocké en Markdown, édité avec CodeMirror 6 — *proposée*
Lecture : rendu Markdown (titres, listes, tableaux, images, liens `[[Fiche]]`). Édition : éditeur Markdown avec barre d'outils, autocomplétion `[[` et aperçu.
**Pourquoi** : l'export Notion est déjà en Markdown (conversion fidèle), format lisible dans la sauvegarde, robuste. Alternative écartée pour l'instant : éditeur WYSIWYG (TipTap), plus confortable mais conversion Markdown ↔ WYSIWYG source de pertes (tableaux notamment).

### D-M4 · 2026-10-09 · Sessions de jeu avec journal et fiches de PNJ vivantes — *validée (besoin), proposée (forme)*
Écran « Session en cours » : journal horodaté + fiches de PNJ épinglées dont l'état (Vitalité, Endurance, notes) se modifie en direct. Chaque entrée liée à une fiche apparaît dans la chronologie de cette fiche.

### D-M5 · 2026-10-09 · Import Notion unique par l'export officiel, converti en sauvegarde `.opmj` — *proposée*
Export Notion « Markdown & CSV » → script Node `tools/notion-import` → fichier `.opmj` → restauration dans l'appli. Après import, Notion est abandonné.
**Pourquoi** : pas de jeton d'API à gérer ; l'API MCP utilisée pour l'analyse a des limites de plan (requêtes multi-bases réservées au plan Business) ; un seul chemin d'entrée des données (la restauration) à tester ; le script est testable sur un mini-export.

### D-M6 · 2026-10-09 · Pas de révélé / caché, pas de remise de documents dans l'app — *validée*
Les documents (cartes, articles de journaux) sont imprimés et remis en vrai. L'app les stocke seulement.

### D-M7 · 2026-10-09 · Pas de suivi de combat ni de lanceur de dés côté MJ — *validée*
Seuls le journal de session et la recherche/les liens ont été retenus comme outils de session.

### D-M8 · 2026-10-09 · Un nom de référence par chose — *validée (besoin), proposée (forme)*
Motif exprimé par le MJ pour quitter Notion : connaissance éparpillée, mêmes choses nommées différemment (Anges / Skypiéens). L'app impose un titre de référence + alias, avertit des doublons à la création, permet de **fusionner** deux fiches et propose une vue « Doublons probables ». L'import Notion applique une table de synonymes. Voir cahier MJ §4.7.

### D-M9 · 2026-10-09 · Relevé des jets de Haki dans le journal de session — *validée*
Entrée de journal de type « Haki » : PJ (fiche de lore), type, résultat du D100 ; l'app affiche l'effet de la table et signale un « meilleur résultat ». La fiche de lore du PJ récapitule ces entrées. C'est le seul suivi lié aux PJ côté MJ, sans fiche technique (D-T0).

### D-M10 · 2026-10-09 · Appli MJ pensée pour le Chromebook, sans version mobile, mais tolérante aux fenêtres réduites — *validée*
Cible : écran du Chromebook en plein écran paysage (vérifié en 1366 × 768). Aucune mise en page téléphone. La disposition se replie quand la fenêtre rétrécit (fenêtre ancrée sur une moitié d'écran, mode tablette en portrait) :

| Largeur de fenêtre | Disposition |
|---|---|
| ≥ 1280 px | 3 colonnes : barre latérale + liste, fiche, panneau Liens |
| 900 à 1279 px | 2 colonnes : la liste se replie (ouverte à la demande), fiche + panneau |
| < 900 px | 1 colonne : la fiche seule ; barre latérale, liste et panneau Liens en volets |

**Pourquoi** : sur ChromeOS, une app Android peut être redimensionnée ou passer en portrait en mode tablette ; prévoir ces paliers dès M0 coûte peu, les ajouter après coup serait pénible.
Mise en œuvre (M0, 2026-10-12) : en 2 colonnes, la barre latérale reste à gauche et la liste s'ouvre en volet (bouton « ☰ Liste » ou clic sur un type) ; en 1 colonne, la liste du type choisi occupe l'écran tant qu'aucune fiche n'est ouverte, barre latérale (☰) et Liens en volets.

### D-M11 · 2026-10-12 · Index de recherche hors migrations, moteur choisi à l'ouverture — *proposée*
La table `search_index` ne fait pas partie de la migration 1. Le repository la crée à l'ouverture si elle manque, avec le premier moteur accepté : **FTS5**, sinon **FTS4**, sinon aucun (recherche `LIKE` en M3), la remplit depuis les fiches et note le moteur dans `meta.search_engine`. Réglages › À propos l'affiche.
**Pourquoi** : constaté en M0, sql.js (moteur du repli web) n'a pas FTS5, et sa présence sur le Chromebook ne sera vérifiée qu'en M1. Une migration 1 avec FTS5 aurait empêché le repli web de s'ouvrir, et peut-être l'appareil. L'index est une donnée dérivée (déjà exclue de la sauvegarde `.opmj`) : le recréer ne perd rien. Si FTS5 n'est pas disponible sur l'appareil, rien d'autre à changer.

### D-M12 · 2026-10-16 · Fiches : choix de mise en œuvre de M2 — *proposée*
- **« Fait partie de » des lieux = relation `partieDe`**, distincte des pages enfants (`parent_id`). La hiérarchie géographique reste une propriété (filtre, rétrolien « Lieux contenus ») ; les pages enfants servent aux sous-pages libres (énigmes, textes d'un scénario). Une page enfant est créée en Note par défaut (type modifiable).
- **Rétroliens nommés** : chaque relation déclare le titre de son inverse (« Membres », « Détenteur », « Chef de »…), affiché dans le panneau Liens de la fiche visée.
- **Doublons à la création** : comparaison exacte à la casse et aux accents près, sur les titres et les alias ; le MJ peut ouvrir la fiche existante ou créer quand même. « Ajouter comme alias » et la détection approchée arrivent avec la vue « Doublons probables » (M2c) : avec une comparaison exacte, le nom saisi est déjà un nom de la fiche trouvée.
- **Catalogue en mémoire** : titres, alias, types, épingles, archives et parents de toutes les fiches sont chargés au démarrage et tenus à jour après chaque enregistrement ; listes, sélecteurs, autocomplétion `[[` et doublons s'en servent sans requête.
- **Rendu Markdown** par marked + DOMPurify, liens `[[ ]]` en extension ; liens externes ouverts hors de l'app.
**Pourquoi** : garder une seule hiérarchie « libre » (pages enfants) sans perdre la géographie, rendre lisibles les liens inverses sans les stocker, et une app réactive sur le Chromebook avec quelques milliers de fiches au plus.

### D-M13 · 2026-10-16 · Une seule campagne, état des PNJ conservé après la session — *validée*
Réponses du MJ à Q-M2 et Q-M3 : un seul groupe de joueurs, donc une seule campagne (la table `campaigns` garde une ligne unique, créée d'office ; pas d'écran de campagnes). L'état des blocs de jeu modifié en session reste sur les fiches ; l'instantané pris au démarrage de la session (`sessions.snapshot`) permet un bouton « Remettre à l'état de début de session », par PNJ ou pour tous.
**Pourquoi** : les blessures et les morts font partie de l'histoire ; la remise à zéro couvre les cas où un PNJ doit revenir intact (combat d'entraînement, erreur de saisie).

### D-M14 · 2026-10-16 · Onglets légers, utilisables à la souris et au doigt — *validée*
Réponse du MJ à Q-M1 (proposition validée) : un clic remplace la fiche affichée ; nouvel onglet à la demande (Ctrl + clic, clic molette, appui long → menu, bouton de la fiche) ; barre d'onglets au-dessus de la fiche (onglets ≥ 40 px, ✕ toujours visible, Ctrl+W) ; 8 onglets au plus, rouverts au démarrage ; historique Précédent / Suivant par onglet ; menu « n fiches ouvertes ▾ » en une colonne. Principe pour toute l'app : cibles d'au moins 40 px, rien d'accessible seulement au survol, appui long = clic droit.
**Pourquoi** : le Chromebook s'utilise au doigt comme à la souris ; ouvrir un onglet à chaque clic multiplierait les onglets, surtout au doigt. Mise en œuvre avec la navigation (M3).

### D-M15 · 2026-10-16 · Journal automatique et recherche dans le journal — *validée*
Réponses du MJ à Q-M3 (suite) et Q-M5 (propositions validées) :
- en session, chaque changement du bloc de jeu d'un PNJ ajoute une entrée automatique lisible (« Drake : Vitalité 60 → 40 »), regroupée si plusieurs changements de la même valeur ont lieu en moins de 10 s, grisée, masquable par un filtre, supprimable ; elle apparaît dans la chronologie de la fiche ;
- la recherche globale montre, sous les fiches, un groupe « Journal » (5 entrées, « Voir tout ») ; un clic ouvre le journal de la session sur l'entrée. Seconde table plein texte pour le journal, créée comme `search_index` (D-M11).
**Pourquoi** : garder la trace de ce qui est arrivé aux PNJ sans saisie, et retrouver ce qui n'a pas été relié par `[[ ]]` (objet, phrase, promesse).

### D-M16 · 2026-10-16 · Exports : fiche en Markdown ou PDF, documents stockés — *validée*
Réponse du MJ à Q-M4 : en plus de l'export Markdown d'une fiche, exporter une **fiche en PDF** mis en forme (prêt à imprimer) et ressortir un **document stocké** (PDF, image) par la feuille de partage ou dans les fichiers du Chromebook. Pas d'import de fichier texte en fiche. Technique du PDF de fiche à choisir à l'étape M9 (impression du système ou génération dans l'app).

### D-M17 · 2026-10-16 · Repli web de l'appli MJ : sql.js directement, sans jeep-sqlite — *proposée*
En développement dans le navigateur, la base MJ est une base sql.js (SQLite en WebAssembly) gardée dans IndexedDB après chaque écriture, au lieu de l'implémentation web du plugin (jeep-sqlite). Le même adaptateur (`sqlJsDb.ts`) sert aux tests Vitest. Sur l'appareil, rien ne change (SQLite natif, D-T3).
**Pourquoi** : jeep-sqlite est un composant web (Stencil) qui attend que la page s'affiche (`requestAnimationFrame`) : il restait figé quand le navigateur de test n'était pas à l'écran. Il imposait aussi de fixer sql.js à la version embarquée (1.12) et ajoutait 290 Ko au build. Même moteur SQL qu'avant : le comportement de dev ne change pas.

### D-M18 · 2026-10-16 · L'appli MJ devient une appli web installable, données sur l'appareil, relais par Google Drive — *validée (direction)*, *proposée (détails)*
Réponse du MJ à Q-T3 : pas d'APK pour l'appli MJ.
- **Distribution** : appli web statique publiée gratuitement sur GitHub Pages, installable depuis Chrome (« Installer l'application » : icône, fenêtre à elle) sur le Chromebook et sur le PC du MJ ; fonctionne **hors ligne** (service worker). Plus de Capacitor, d'APK ni de `appId` pour l'appli MJ ; Vivre Card ne change pas.
- **Données** : SQLite en WebAssembly (sql.js, comme le repli de dev de D-M17) gardé dans IndexedDB, avec demande de **stockage persistant** ; médias (M6) en IndexedDB aussi, plus de dossier `media/`. Même schéma, mêmes migrations, même repository.
- **Sauvegarde et relais** : l'app écrit automatiquement la sauvegarde `.opmj` dans un **dossier Google Drive** choisi une fois (app Fichiers sur le Chromebook, Google Drive pour ordinateur sur le PC). Au lancement, si la sauvegarde du dossier est plus récente que la base locale (écrite par l'autre appareil), l'app propose de la reprendre. **Un appareil à la fois** : si les deux ont été modifiés sans passer par le dossier, l'app le signale et le MJ choisit la version gardée (pas de fusion). Si l'écriture automatique dans le dossier est impossible, repli : bouton « Sauvegarder » et rappel.
- **Ce qui protège des pertes** : une réinitialisation du Chromebook ou un « effacer les données de navigation » ne fait perdre que les modifications faites depuis la dernière sauvegarde dans Drive.
**Pourquoi** : installer un APK sur ChromeOS demande ADB (sa désactivation réinitialise le Chromebook) ou le mode développeur, ou la Play Console (25 $). Une base en ligne gratuite (Supabase) a été écartée après examen : projet mis en pause après 7 jours sans activité, pas de sauvegarde sur l'offre gratuite, internet obligatoire en session, connexion et droits d'accès à sécuriser avec un dépôt public connu des joueurs, réécriture du stockage en Postgres. Le web local reprend le code existant presque tel quel (sql.js tourne déjà en développement) et Drive apporte la copie hors de l'appareil.
Remplace pour l'appli MJ : D-T1 (partie Capacitor / APK), D-T3, D-T4 (feuille de partage), l'`appId` MJ de D-T5, la CI APK de M0. À vérifier sur les appareils (M1) : installation, stockage persistant, écriture automatique dans un dossier Drive sur ChromeOS et sur Windows.

### D-M19 · 2026-10-17 · Sauvegarde automatique et relais : règles de détail — *proposée*
Mise en œuvre de D-M18 (M4) :
- Fichier `onepiece-mj.opmj` dans le dossier choisi, écrit **5 s** après la dernière modification et quand l'app passe en arrière-plan ; une copie par jour dans `historique/` (**10** gardées).
- Chaque sauvegarde porte un identifiant ; chaque appareil retient celui de la dernière sauvegarde qu'il a écrite ou reprise (table `meta`). **Avant chaque écriture**, l'app relit le dossier : s'il contient une autre sauvegarde, elle n'écrit pas et propose de la reprendre (rien modifié ici) ou de choisir (modifié des deux côtés). Vérification aussi au lancement et au retour dans l'app.
- **Rien n'est jamais perdu** : avant de remplacer la base de cet appareil, elle est copiée dans `historique/avant-restauration-<appareil>-<date>.opmj` ; quand le MJ garde sa version contre celle du dossier, celle du dossier est copiée dans `historique/remplacee-<appareil>-<date>.opmj`. Ces copies ne sont jamais supprimées automatiquement.
- Une restauration de fichier (sauvegarde ou import Notion) devient la référence : réécrite dans le dossier aussitôt.
- Réglages de l'appareil (thème, onglets, récentes) hors de la sauvegarde.
**Pourquoi** : préparer sur le PC et jouer sur le Chromebook sans serveur, avec la garantie qu'aucune version n'écrase l'autre sans l'accord du MJ.

### D-M20 · 2026-10-19 · Onglets façon navigateur — *proposée*
Demande du MJ après M4 (deux fiches ouvertes, un seul onglet visible : il fallait passer par ‹ ›) ; complète D-M14.
- Les onglets se **partagent la largeur** de la barre (200 px au plus chacun) et rétrécissent ensemble ; plus de défilement (8 onglets au plus).
- Onglet étroit : l'icône disparaît pour garder le début du titre (les icônes d'un même type sont identiques) ; ✕ reste sur l'onglet actif, les onglets inactifs étroits se ferment au clic molette ou une fois choisis (écart assumé à « ✕ toujours visible » de D-M14, comme Chrome). L'onglet actif garde au moins 110 px.
- **Glisser pour réordonner**, à la souris ou au doigt (au-delà de 6 px de déplacement, sinon c'est un clic) ; l'onglet glissé devient actif ; l'ordre est gardé avec les onglets (meta « onglets », format inchangé).
- **« + »** après le dernier onglet : ouvre la recherche, la fiche choisie s'ouvre dans un nouvel onglet.
- **Ctrl+Tab / Ctrl+Maj+Tab**, **Ctrl+1…8**, **Ctrl+9** (dernier) : dans l'app installée ; dans un onglet de Chrome, Chrome les garde pour lui.
**Pourquoi** : retrouver d'un coup d'œil toutes les fiches ouvertes et passer de l'une à l'autre d'un clic, avec les gestes déjà connus du navigateur.
