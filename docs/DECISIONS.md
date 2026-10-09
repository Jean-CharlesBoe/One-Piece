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

### D-T3 · 2026-10-09 · Base SQLite embarquée dans chaque app, aucune donnée dans un navigateur — *validée*
En production, les données vivent uniquement dans la base SQLite native de l'app et dans son dossier privé. Le repli navigateur ne sert qu'au développement (`npm run dev`).

### D-T4 · 2026-10-09 · Sauvegarde par fichier via la feuille de partage — *proposée*
Reprise de D5/D8 de Sans Nom, adaptée (zip avec médias pour le MJ). Voir [ARCHITECTURE.md §4](ARCHITECTURE.md).

### D-T5 · 2026-10-09 · Noms et identifiants Android — *validée (noms), proposée (identifiants)*
- Appli joueur : **« Vivre Card »**. Appli MJ : **« One Piece »**.
- `appId` : `fr.onepiecejdr.joueur` et `fr.onepiecejdr.mj`, définitifs après la première release. Une seule clé de signature pour les deux apps, sauvegardée hors GitHub.

### D-T6 · 2026-10-09 · Dépôt GitHub public — *validée*
Comme Sans Nom : les joueurs téléchargent l'APK depuis les Releases sans compte. Le contenu du monde (export Notion, sauvegardes `.opmj`) n'est **jamais** versionné : dossiers ignorés par git.

### D-T7 · 2026-10-09 · `@onepiece/core` consommé depuis ses sources, scripts racine sans `npm run` imbriqué — *proposée*
- Le paquet partagé n'a pas d'étape de build : `exports` pointe sur `src/index.ts` (modèle, règles, `back.ts`), `src/ui/*` (composants Svelte) et `theme.css`. Vite compile les `.svelte` du paquet comme ceux de l'app.
- Dépendances d'outillage (Vite, Svelte, TypeScript, Vitest, svelte-check) à la racine ; Capacitor ira dans chaque app.
- Les scripts racine appellent directement les outils (`vite apps/joueur`, `svelte-check --workspace …`, `vitest run` avec `projects`).
**Pourquoi** : pas de build intermédiaire à oublier en dev ; et un npm 6 présent sur le poste (`C:\node_modules`) se retrouve sur le PATH des scripts et boucle sur `npm run … --workspaces`.

## Appli joueur

### D-J1 · 2026-10-09 · Calquée sur Sans Nom — *validée*
Mêmes écrans (accueil, onglets, modes jeu/édition, sauvegarde automatique, sauvegarde fichier), adaptés au système One Piece.

### D-J2 · 2026-10-09 · Saisie libre, aucune règle de création contrôlée — *validée*
Pas de contrôle des 40 + 10 points, pas d'application automatique des bonus de race ou de classe. Le joueur saisit ses valeurs.

### D-J3 · 2026-10-09 · Ressources : Vitalité, Endurance, Rêve, Ambition + ressources personnalisées — *validée*
Ambition affichée seulement pour la race Humain (règle du type « Nain sans mana » de Sans Nom : masquée, valeurs conservées).

### D-J4 · 2026-10-09 · Fruit du démon sur la page principale, ses techniques dans Compétences — *validée*

### D-J5 · 2026-10-09 · Onglet « Compagnons » à la place d'« Invocations » — *validée*
Même principe que les créatures de Sans Nom, ressources Vitalité / Endurance.

### D-J6 · 2026-10-09 · Pas de suivi du Haki dans Vivre Card — *validée*
Le Haki est une règle propre au MJ (jets de D100, progression vers la maîtrise) : aucun compteur, état ni bouton d'épuisement dans l'appli joueur. Quand le MJ annonce une maîtrise, le joueur ajoute une compétence d'origine « Haki » (coût fixe en Endurance). Les malus d'épuisement sont annoncés par le MJ et saisis, si besoin, en bonus temporaires.
Remplace la première proposition (compteurs 0/5, maîtrise calculée, bouton Épuisement), jugée hors du rôle de l'appli joueur par le MJ.

### D-J9 · 2026-10-09 · Une classe par personnage, modèle prêt pour plusieurs — *validée*
L'écran n'en propose qu'une ; le modèle stocke une liste (`classes: Classe[]`) pour en autoriser plusieurs plus tard sans migration.

### D-J10 · 2026-10-09 · Caracs à 0 à la création — *proposée*
Un nouveau personnage (et un compagnon) démarre avec les 8 caracs à 0 (Sans Nom : 1). Les 40 points de création se répartissent à partir de zéro (REGLES §4) ; le joueur reste libre (D-J2).

### D-J7 · 2026-10-09 · Mémos pédagogiques contextuels plutôt qu'un onglet Règles — *proposée*
Bouton « i » discret sur les blocs (carac, ressources, rêve, ambition, XP, compétences) ouvrant une fenêtre du bas avec la règle courte (pas de mémo Haki : règle du MJ). Plus une page « Aide-mémoire » accessible depuis le menu de la fiche (seuils, critiques du palier choisi, coûts d'XP, coûts d'endurance).
**Pourquoi (challenge de l'idée de départ)** : en partie, le joueur cherche une réponse précise à l'endroit où il regarde ; un onglet Règles complet serait lu une fois puis ignoré, et dupliquerait le rôle du MJ. Les textes vivent dans `packages/core/src/rules/memos.ts` : les modifier demande une nouvelle version de l'APK, acceptable puisque le MJ est aussi le développeur.

### D-J8 · 2026-10-09 · Palier de dé sur la fiche — *proposée*
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
