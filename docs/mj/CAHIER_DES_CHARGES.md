# Appli MJ « One Piece » — cahier des charges

> Statut : **v0.2** (2026-10-09). Les points **[Q-…]** renvoient à [../QUESTIONS.md](../QUESTIONS.md).
> Modèle de données : [MODELE_DONNEES.md](MODELE_DONNEES.md) · Import Notion : [IMPORT_NOTION.md](IMPORT_NOTION.md).

## 1. Objectif

Remplacer Notion par une application dédiée au JDR, sur le **Chromebook** du MJ.

**Le problème à résoudre** (dit par le MJ) : dans Notion, la connaissance s'est éparpillée dans de nombreux documents, et une même chose porte un nom à un endroit et un autre ailleurs (ex. « Anges » et « Skypiéens »). L'app doit donc **centraliser** et garantir **un nom de référence par chose**, les autres noms devenant des alias (§4.7).

Deux usages :
- **hors session** : la **base de connaissances** du monde (personnages, factions, lieux, fruits, races, classes, événements, scénarios, règles, notes, documents), enrichie au fil du temps ;
- **en session** : retrouver instantanément n'importe quelle info, faire **évoluer les fiches de PNJ** et **noter les événements** au fil de l'eau dans un journal.

## 2. Contraintes

- App Android (Capacitor) sur Chromebook, **hors ligne**, base **SQLite** embarquée, médias dans le dossier privé de l'app.
- Écran large paysage, **clavier et souris** (raccourcis, autocomplétion). Pas de version téléphone ; la disposition se replie si la fenêtre rétrécit (demi-écran, mode tablette en portrait), voir §3 et D-M10.
- Un seul utilisateur (le MJ), pas de compte.
- Aucune donnée de joueur : les PJ existent seulement comme fiches de lore (histoire, rôle), sans fiche technique (D-T0).
- Ne jamais perdre la base : sauvegarde `.opmj` (base + médias) + rappel + backup Android.
- Français, mode sombre et clair.

## 3. Disposition générale

```
┌───────────┬──────────────────────────┬──────────────────────┐
│ Barre     │  Liste (filtrée)         │  Fiche ouverte        │
│ latérale  │  ou résultats de         │  (lecture / édition)  │
│           │  recherche               │                       │
│ Recherche │                          │  + panneau Liens :    │
│ Types     │                          │  relations, mentionné │
│ Épinglés  │                          │  dans, chronologie    │
│ Sessions  │                          │                       │
│ Sauvegarde│                          │                       │
└───────────┴──────────────────────────┴──────────────────────┘
```
- **Largeur de fenêtre** (D-M10) : ≥ 1280 px → 3 colonnes ci-dessus ; 900 à 1279 px → 2 colonnes, la liste se replie (ouverte à la demande) ; < 900 px → la fiche seule, barre latérale, liste et panneau Liens en volets. Référence de vérification : 1366 × 768.
- La liste se masque quand on navigue de fiche en fiche (mode deux colonnes) ; historique **Précédent / Suivant** (Alt+← / Alt+→ et bouton retour Android).
- **Onglets de fiches** (Q-M1, D-M14) : un clic sur un lien ou une ligne de liste **remplace** la fiche affichée ; on ouvre un **nouvel onglet** à la demande (Ctrl + clic ou clic molette à la souris, appui long → « Ouvrir dans un nouvel onglet » au doigt, bouton de l'en-tête de la fiche). Barre d'onglets au-dessus de la fiche, onglets d'au moins 40 px, ✕ toujours visible ; Ctrl+W ferme l'onglet. 8 onglets au plus (le plus ancien se ferme), rouverts au démarrage ; chaque onglet a son historique Précédent / Suivant. En une colonne, les onglets se replient en un menu « n fiches ouvertes ▾ ».
- **Souris et doigt** (Q-M1) : le Chromebook s'utilise des deux façons. Cibles d'au moins 40 px, aucune action accessible seulement au survol, appui long = équivalent du clic droit.

## 4. Base de connaissances

### 4.1 Types de fiches (D-M1)
| Type | Champs propres (en plus du titre, du texte riche et des étiquettes) |
|---|---|
| **Personnage** | rôle (PJ / PNJ), état (En vie / Mort / Inconnu), alignement (Bon / Neutre / Hostile / Chaotique / Joueur), grade (Marine, Shichibukai…), race →, classes →, fruit →, factions →, lieu d'origine →, mer d'origine, technique de combat, prime, **bloc de jeu** facultatif (§4.4), « fiche à faire » |
| **Faction** | type (Équipage pirate, Marine, Armée révolutionnaire, Gouvernement mondial, Autre), chef →, navire(s) (texte), membres (rétroliens) |
| **Lieu** | fait partie de → (hiérarchie : mer › archipel › île › ville › bâtiment), mer, alignement, persos affiliés → |
| **Fruit du démon** | nom japonais, type (Paramecia / Zoan / Logia), détenteur (rétrolien), éveil |
| **Race** | avantage, désavantage, Vitalité de base, Endurance de base, capacités spéciales |
| **Classe** | avantages, désavantages |
| **Événement** | catégorie (Historique / Récurrent / Campagne), date dans le monde (texte, ex. « Année 1500 »), lieux →, personnages → |
| **Scénario** | statut (En préparation / En cours / Joué), pages enfants (îles, énigmes, textes), PNJ →, lieux → |
| **Règle** | section (pour l'ordre d'affichage) |
| **Note** | — (page libre, peut avoir des pages enfants) |
| **Document** | fichier (image ou PDF), légende ; rattaché à des fiches → |

« → » = relation vers une autre fiche. Toute fiche peut avoir des **pages enfants** (arborescence, comme Notion) et une **image de couverture**.

### 4.2 Fiche en lecture
- En-tête : type, titre, sous-titre (ex. « PNJ · Marine · En vie »), couverture, étiquettes.
- **Propriétés** en tableau compact ; les relations sont des liens cliquables.
- **Texte riche** rendu : titres, listes, tableaux, citations, images, liens `[[Fiche]]` cliquables (lien rouge si la fiche n'existe pas → clic = la créer).
- Panneau **Liens** : relations sortantes, **Mentionné dans** (rétroliens depuis le texte d'autres fiches et le journal), **Pages enfants**, **Chronologie** (entrées de journal liées, plus récentes en haut, §5.3).

### 4.3 Création et édition
- Bouton « Nouvelle fiche » (Ctrl+N) : choix du type, titre ; ou depuis un lien rouge.
- Édition (Ctrl+E ou crayon) : formulaire des propriétés généré par le **registre des types** + éditeur Markdown (D-M3) avec barre d'outils (gras, italique, titre, liste, tableau, image), **autocomplétion `[[`** sur les titres et alias, glisser-déposer / coller une image (copiée dans les médias).
- Sauvegarde automatique (400 ms) ; « Annuler la dernière modification » pendant la session d'édition.
- Renommer une fiche met à jour les `[[liens]]` qui la citent (proposé avec confirmation).
- Archiver plutôt que supprimer ; suppression définitive depuis la vue « Archives » (en 2 temps, avertit des liens entrants).
- **Changer le type** d'une fiche (ex. Note → Lieu après l'import) : les propriétés communes sont gardées, les autres conservées en « propriétés orphelines » visibles jusqu'à suppression.
- **Déplacer** une fiche sous une autre (pages enfants) par glisser-déposer dans l'arborescence ou via « Déplacer vers… ».
- Alias : une fiche peut avoir plusieurs noms (« Drake », « Capitaine Drake ») utilisés par la recherche et l'autocomplétion.

### 4.4 Bloc de jeu des PNJ (fiches qui évoluent en session)
Facultatif sur un Personnage (bouton « Ajouter un bloc de jeu ») :
- 8 caracs + avantages (composant `StatGrid` partagé), bonus temporaires ;
- Vitalité, Endurance (losanges partagés), ressources supplémentaires libres ;
- catégorie d'adversaire (Ennemi mineur … Empereur) avec l'XP correspondante affichée (lecture seule) ;
- techniques (titre, coût en Endurance, description) ;
- Haki (état par type), fruit (relation, déjà dans les propriétés).
Les modifications de ressources ou de bonus pendant une session créent automatiquement une entrée de journal (§5.2).

### 4.5 Navigation et recherche
- **Recherche globale** (Ctrl+K ou « / ») : titres, alias, propriétés et texte intégral, résultats groupés par type, extrait surligné, ouverture au clavier. Insensible aux accents et à la casse. Sous les fiches, un groupe **« Journal »** : entrées de journal contenant les mots cherchés (« Session 4 · 21:17 — … »), 5 au plus avec « Voir tout » ; un clic ouvre le journal de la session sur l'entrée (Q-M5, D-M15).
- **Listes par type** avec filtres sur les propriétés (ex. Personnages : rôle, état, faction, alignement ; Lieux : mer) et tri (titre, modification).
- **Épinglés** : fiches favorites dans la barre latérale.
- **Récents** : 20 dernières fiches ouvertes.
- Vue **arborescence** pour les Lieux et les Scénarios.

### 4.6 Documents
Import d'images (JPG, PNG, WebP) et de PDF depuis le sélecteur de fichiers. Chaque import crée une fiche **Document** (et peut être rattaché à des fiches). Visionneuse plein écran (zoom, défilement des pages PDF). Pas de remise aux joueurs, pas de caché/révélé (D-M6).

### 4.7 Un nom de référence par chose
Réponse directe à l'éparpillement de Notion :
- **Titre = nom de référence** ; tous les autres noms sont des **alias** (« Anges » → alias de la race « Skypiéens »). La recherche, l'autocomplétion `[[` et les liens trouvent une fiche par n'importe lequel de ses noms ; l'affichage utilise toujours le nom de référence (sauf si le texte d'un lien a été écrit différemment).
- **Pas de doublon silencieux** : créer ou renommer une fiche dont le titre (ou un alias) correspond déjà, à la casse et aux accents près, à une autre fiche affiche « Existe déjà : Skypiéens (race). L'ouvrir / Ajouter comme alias / Créer quand même ».
- **Fusionner deux fiches** (« Fusionner avec… ») : une fiche est gardée ; l'autre devient un alias, ses liens entrants sont redirigés, son texte est ajouté à la fin sous un titre « Repris de <nom> », ses propriétés vides comblées, les conflits listés pour choix. Puis la fiche absorbée est archivée.
- **Vue « Doublons probables »** : paires de fiches aux noms proches (distance d'édition faible, mêmes mots, un nom contenu dans l'autre), à traiter une par une (Fusionner / Ce sont deux choses différentes, à ne plus proposer). Alimentée aussi par le rapport d'import Notion.

## 5. Sessions de jeu

### 5.1 Campagnes et sessions
- **Campagne** : une seule (un seul groupe de joueurs, Q-M2, D-M13). Pas d'écran de campagnes : les sessions sont numérotées à la suite.
- **Session** : numéro, titre, date réelle, scénario →, statut (Prévue / En cours / Terminée), **préparation** (Markdown), **résumé** (Markdown), PNJ épinglés.
- Liste des sessions dans la barre latérale ; « Démarrer la session » passe en écran Session en cours.

### 5.2 Écran « Session en cours »
```
┌──────────────────────────┬──────────────────────────────────┐
│ Journal                  │ Fiches de la session (onglets)   │
│ 21:04  Arrivée sur l'île │  Drake  │ Meliana │ Maire │ +   │
│        du Sud [[...]]    │  ─ bloc de jeu : Vitalité 40/60 │
│ 21:17  Drake : Vitalité  │    Endurance 12/30, bonus…       │
│        60 → 40 (auto)    │  ─ notes rapides                 │
│ [ saisie rapide……… ] ⏎  │                                  │
└──────────────────────────┴──────────────────────────────────┘
```
- **Saisie rapide** en bas du journal : texte libre avec `[[` ; Entrée = nouvelle entrée horodatée. Type facultatif via préfixe ou bouton : Événement (défaut), Combat, Découverte, XP, **Haki**, Note MJ.
- **Entrée Haki** (D-M9) : PJ concerné (fiche de lore), type (Observation / Armement / Rois), résultat du D100. L'app affiche l'effet de la table (§7 des règles) et indique si c'est un « meilleur résultat ». Sur la fiche du PJ, un petit récapitulatif lit le journal : « Observation : 3 meilleurs résultats ; Rois : résultat 1–5 obtenu (session 4) ». Ce n'est pas une fiche technique du PJ (D-T0) : seulement le relevé des jets du MJ. Quand un Haki est maîtrisé, le MJ le dit au joueur, qui ajoute la compétence sur sa Vivre Card.
- **Fiches de la session** : PNJ et lieux du scénario pré-épinglés + ajout à la volée depuis la recherche ; bloc de jeu modifiable en direct ; zone « notes rapides » par fiche.
- Chaque changement de ressource, de bonus, d'état (ex. PNJ → Mort) d'une fiche épinglée **ajoute une entrée automatique** (regroupée si plusieurs changements en moins de 10 s sur la même ressource) : « 21:17 Drake : Vitalité 60 → 40 », « 21:40 Drake : mort ». Ces lignes sont grisées, masquables par un filtre et supprimables une à une (Q-M3, D-M15).
- Recherche globale accessible sans quitter l'écran (ouverture dans un panneau latéral).
- « Terminer la session » : propose de rédiger le résumé (pré-rempli avec la liste des entrées). L'état des PNJ **reste** tel qu'à la fin de la session (Q-M3, D-M13) ; un bouton **« Remettre à l'état de début de session »** (par PNJ ou pour tous) reste disponible ensuite, à partir de l'instantané pris au démarrage.

### 5.3 Chronologie des fiches
Toute entrée de journal qui mentionne une fiche (lien `[[ ]]` ou entrée automatique) apparaît dans la **Chronologie** de cette fiche, avec le numéro de session. C'est ainsi que « les événements notés en session » enrichissent la base de connaissances sans recopie.

## 6. Sauvegarde et import

- **Sauvegarder** : archive `.opmj` (base complète + médias) envoyée par la feuille de partage ou enregistrée dans les fichiers du Chromebook. Date mémorisée ; rappel rouge si modifications et ≥ 7 jours (comme Sans Nom).
- **Restaurer** : remplace toute la base après confirmation ; refuse un fichier d'une version plus récente.
- **Import Notion** : une seule fois, via un fichier `.opmj` produit par le script (voir [IMPORT_NOTION.md](IMPORT_NOTION.md)) ; écran d'accueil vide = bouton « Restaurer une sauvegarde ou un import Notion ».
- **Exports** (Q-M4, D-M16) : une fiche en Markdown (copier / partager) ou en **PDF** mis en forme, prêt à imprimer ; un **document stocké** (PDF, image) ressorti tel quel par la feuille de partage ou dans les fichiers du Chromebook, pour l'imprimer ou l'envoyer.
- Volume des médias (Q-M6) : probablement plus de 25 Mo (nombreux PDF de personnages, images de fruits) : le backup Android automatique ne couvre pas tout, la sauvegarde `.opmj` est indispensable.

## 7. Raccourcis clavier

| Raccourci | Action |
|---|---|
| Ctrl+K ou / | recherche globale |
| Ctrl+N | nouvelle fiche |
| Ctrl+E | éditer / quitter l'édition |
| Alt+← / Alt+→ | précédent / suivant |
| Ctrl+J | aller à la saisie du journal (en session) |
| Échap | fermer la fenêtre / la recherche |

## 8. Hors périmètre

Fiches techniques des PJ, synchronisation avec les joueurs, révélé/caché, remise de documents, suivi de combat (initiative, tours), lanceur de dés, calculateur d'XP, carte interactive, multi-utilisateur, Notion après la migration.
