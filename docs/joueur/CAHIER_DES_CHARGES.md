# Appli joueur « Vivre Card » — cahier des charges

> Statut : **v0.2** (2026-10-09). Base : l'app **Sans Nom** v0.3.0 (même structure, mêmes interactions), adaptée au système One Piece.
> Les points marqués **[Q-…]** dépendent d'une question ouverte de [../QUESTIONS.md](../QUESTIONS.md). Règles : [../REGLES_ONE_PIECE.md](../REGLES_ONE_PIECE.md).

## 1. Objectif

Fiche de personnage sur téléphone, rapide à consulter et à mettre à jour **pendant la partie** (Vitalité qui baisse, endurance dépensée, point de rêve utilisé, bonus reçu, XP gagnée), sans dépendre du MJ.

## 2. Contraintes

- Téléphones **Android** des joueurs, APK installé hors Play Store, **hors ligne**, sans compte.
- Base **SQLite** dans l'app + sauvegarde fichier + backup Android ; une mise à jour de l'APK conserve les données.
- Plusieurs personnages par téléphone.
- Français, utilisable d'une main sur ~360 px, **mode sombre** (et clair).
- **Saisie libre** : l'app ne contrôle ni les points de création ni les bonus de race/classe (D-J2). Elle borne seulement ce qui est absurde (ressource actuelle entre 0 et son max, valeurs entières).

## 3. Correspondance avec Sans Nom

| Sans Nom | One Piece | Changement |
|---|---|---|
| Accueil, sauvegarde, import | identique | nom du format de fichier |
| Onglet **Carac** | onglet **Fiche** | identité One Piece, ressources différentes, bloc Fruit |
| Onglet **Compétences** | **Compétences** | coût en **Endurance**, origine facultative |
| Onglet **Invocations** | **Compagnons** | ressources Vitalité / Endurance |
| 8 caracs + avantages + bonus temporaires | **identique** | — |
| Vie / Âme / Mana | Vitalité / Endurance / Rêve / Ambition + ressources perso | voir §4.4 |
| Race (liste fermée), élément, pratiques | Race, tribu, classes, rêve | voir §4.1 |
| — | mémos « i » + aide-mémoire | nouveau (D-J7) |

## 4. Écrans

### 4.0 Accueil
Liste des personnages (nom, sous-titre « Race · Classe », date de modification), créer, ouvrir, supprimer en 2 temps ; version de l'app. **Roue dentée** en haut à droite (D-J19) : fenêtre « Réglages » avec **Sauvegarde** (sauvegarder tous les persos, importer), **Thème** (Automatique / Clair / Sombre) et **Affichage** (boutons « i »). Plus d'encart de sauvegarde sur l'accueil : seulement un **avertissement rouge** (aucune sauvegarde, ou modifications et ≥ 7 jours sans sauvegarde) qui ouvre les réglages.

### Dans un personnage
Onglets : **`Fiche | Compétences | Compagnons`**. Deux modes comme Sans Nom : **jeu** (par défaut) et **édition** (crayon). Sauvegarde automatique 400 ms après chaque modification, immédiate au retour et à la mise en arrière-plan. Bouton retour Android : ferme la fenêtre ouverte → revient à la liste → quitte.

Menu de la fiche (⋮ en haut à droite) : **Aide-mémoire** (§4.6), Dupliquer, Exporter ce personnage.

### 4.1 Fiche — Identité
| Champ | Type | Remarque |
|---|---|---|
| Nom | texte | obligatoire |
| Surnom / titre | texte | ex. « le Démon rouge » |
| Âge | texte | |
| Race | liste fermée | Humain, Homme-Poisson, Skypiéen, Tontata, Mink (Skypiéen = « Anges », Q-R3 ; les Lunariens ne sont pas jouables, Q-R6) |
| Tribu | liste (Humain seulement) | Aucune, Longs bras, Longues jambes, Long cou |
| Classe | liste fermée, **une seule** à l'écran | les 11 classes de la règle ; le modèle stocke une liste pour pouvoir en autoriser plusieurs plus tard sans migration (Q-J1) |
| Rêve | texte long | la raison de prendre la mer |
| Prime | nombre (berries), facultatif | ligne « Prime : … » du bloc Info (D-J14) |

Mode jeu : bloc titré **« Info »** (D-J13) : surnom en italique, « Race · Tribu · Classe · âge », « Rêve : … » en texte simple.

**Prime** (D-J14) : dernière ligne du bloc Info, même aspect que les autres : « Prime : 30 000 000 ฿ », **rien du tout si aucune prime n'est saisie** ; saisie en mode édition (séparateurs acceptés, vide = pas de prime).

### 4.2 Fiche — Caractéristiques
Bloc titré **« Caractéristiques »** avec son bouton « i » (mémo : jet = dé + carac, avantages = relances, descriptions des 8 caracs ; D-J13).

**Identique à Sans Nom** : 8 caracs en grille 3 colonnes (3 + 3 + 2), cercle = valeur finale, pastille d'avantages signés, + / − en mode édition, tap = détail (valeur, bonus, total, description de la carac). Bonus temporaires (carac, ±N, origine), ajout rapide, suppression d'un tap, « Tout retirer ».

Ordre proposé : Robustesse, Adresse, Finesse / Intellect, Volonté, Savoir-faire / Expression, Perception (celui de Sans Nom).

### 4.3 Fiche — Fruit du démon (D-J4)
Bloc repliable, masqué si vide en mode jeu.
| Champ | Type |
|---|---|
| Nom du fruit | texte (ex. « Fruit de la chance ») |
| Type | Paramecia / Zoan / Logia / Inconnu |
| Description | texte long |
| Éveil | texte long, facultatif |

Les techniques du fruit sont des compétences d'origine « Fruit » (§4.7). Un lien « Voir les techniques (n) » ouvre l'onglet Compétences filtré.
Rappel discret : un utilisateur de fruit ne sait pas nager (mémo).

### 4.4 Fiche — Ressources (D-J3)
Losanges `actuel / max` comme Sans Nom, tap = fenêtre du bas (−10 / −5 / −1 / +1 / +5 / +10, montant libre, « Remettre au maximum » ; max et régénération en mode édition).

| Ressource | Affichage | Valeur par défaut à la création |
|---|---|---|
| **Vitalité** | losange rouge | 0 / 0 |
| **Endurance** | losange bleu ; à 0, bandeau « Évanoui » | 0 / 0 |
| **Rêve** | losange doré | 10 / 10 |
| **Ambition** | losange violet, **Humain uniquement** (masqué sinon, valeurs conservées) | 10 / 10 |
| **Ressources personnalisées** | losanges sarcelle à la suite des autres (D-J11) : nom, actuel/max ; la règle (texte) s'affiche dans leur fenêtre | aucune |

- Une ressource ne dépasse jamais son max (règle Sans Nom Q 20).
- Champ **Régénération / récupération** (texte) par ressource, comme Sans Nom (ex. Rêve : « 2D6+4 + points dépensés », Ambition : « chaque jour »).
- **Transfert** : losange à part (D-J20), **1 / 1** par défaut, régénération « chaque jour » : le joueur le dépense quand il l'utilise et le remet au maximum le lendemain, à la main. Ambition rechargée chaque jour : à la main aussi (Q-J3, D-J15). Pas de bouton « Nouveau jour » ni d'assistant ; la règle est dans le mémo « i » du bloc Ressources.
- Section **« Ressources »** : titre et bouton « + Ressource » (mode édition) sur la même ligne ; **deux losanges par ligne**, lignes bien espacées (D-J11).
- Ressources personnalisées : ajout en mode édition ; nom, règle, ordre (↑ Avant / ↓ Après) et suppression en deux temps dans leur fenêtre, en mode édition ; même fenêtre d'ajustement que les autres losanges. Exemple : *Chance*, max 5, « 1 pt = +1 à un jet ; 10 pts = créer ou annuler un critique ; recharge en courant ».

### 4.5 Haki : pas de bloc dédié (D-J6)
Le suivi du Haki (jets de D100, progression vers la maîtrise) relève **uniquement du MJ** : Vivre Card n'a ni compteur, ni état, ni bouton d'épuisement.
Quand le MJ annonce qu'un Haki est maîtrisé, le joueur **ajoute une compétence** d'origine **Haki** dans sa liste (§4.7), avec son coût en Endurance. Les effets ponctuels (bonus, épuisement) passent par les bonus temporaires existants, sur indication du MJ.

### 4.6 Fiche — XP, équipement, inventaire
- **XP à dépenser** : compteur ; mémo des coûts (1 XP = +1 carac ou +2 Vitalité/Endurance max ; 10 XP = +1 max Rêve ou Ambition). Pas de dépense automatique (comme Sans Nom).
- **Équipement** et **Inventaire** : texte libre, modifiables aussi en mode jeu.
- **Berries** : pas de champ dédié (Q-J2) : une simple entrée dans l'inventaire.

### 4.7 Compétences
Repris de Sans Nom (`SkillList`) : cartes repliées (titre, pastille de coût, 1re ligne), dépliées d'un tap, « Tout déplier » ; en édition : titre, coût, description longue, ↑ ↓, suppression en 2 temps.
- **Coût en Endurance** (nombre, facultatif).
- **Origine** facultative : Fruit · Style de combat · Race · Haki · Autre → pastille de couleur (et liseré de la carte) + filtre en haut de liste (« Toutes / Fruit / Combat… »), limité aux origines présentes. Le filtre ne s'applique qu'en mode jeu : en édition, toute la liste reste visible (l'ordre ↑ ↓ porte sur la liste complète). Le lien « Voir les techniques » du fruit ouvre la liste filtrée sur « Fruit ».
- Pas de raccourci de dépense (Q-J4, D-J12) : la pastille affiche seulement le coût ; le joueur retire l'Endurance à la main dans le losange, comme dans Sans Nom.

### 4.8 Compagnons (D-J5, D-J17)
Liste (nom, « race · classe », Vitalité / Endurance en résumé) + « Ajouter » ; ↑ ↓ en mode édition.
Fiche compagnon : **la même fiche qu'un PJ** (D-J17) — bloc Info (nom, surnom, race, âge, tribu si Humain, classe, rêve, prime), fruit du démon, caractéristiques, bonus temporaires, ressources (Vitalité, Endurance, Rêve, Ambition si Humain, ressources perso), XP, équipement, inventaire — suivie de ses compétences sur la même page (le lien « Voir les techniques » du fruit y descend, filtré sur « Fruit ») et de « Supprimer ce compagnon » en deux temps.
Seule différence : la **race** propose les 5 races jouables **et « Autre race… »**, qui ouvre un champ libre (Canard, Den Den Mushi…). Choisir « Humain » fait apparaître la tribu et l'Ambition.

### 4.9 Mémos et aide-mémoire (D-J7, validée)
- Bouton **« i »** (petit, discret) à côté des titres : **Caractéristiques** (jet, avantages, description des 8 caracs), **Ressources** (Vitalité, Endurance, Rêve, Ambition, Transfert, régénération possible hors combat, ressources perso), **Fruit du démon** (nage, techniques = compétences « Fruit »), **Compétences** (coût retiré à la main). Le détail d'une carac (tap sur le cercle) affiche aussi sa description. Les « i » se masquent dans les **Réglages** (roue dentée de l'accueil) (case « Afficher les boutons « i » », cochée par défaut, enregistrée dans l'app).
- **Infos réservées au MJ, jamais affichées** (D-J18) : seuils de difficulté, XP par adversaire et XP narratif, barème des coûts d'Endurance, règles de création (compétence de fruit ≤ 5, capacité de style de combat), attaque de base, dés de régénération.
- **Aide-mémoire** (menu ⋮ de la fiche, fenêtre du bas) : **Jets** (dé + carac comparé au seuil fixé par le MJ, avantages), **Critiques** (règle + paliers D10, D20, D100), **Ressources** (Vitalité, Endurance, Rêve, Ambition, Transfert, régénération), **XP** (coûts de dépense).
- Textes dans `packages/core/src/rules/memos.ts`, rédigés à partir de [REGLES_ONE_PIECE.md](../REGLES_ONE_PIECE.md). Aucun texte de règle en dur dans un composant.

## 5. Règles appliquées par l'app

| Élément | Règle |
|---|---|
| Caracs | 8, entier ≥ 0, sans plafond ni total imposé |
| Avantages | entier signé (+N vert, −N rouge) |
| Bonus temporaires | ±N, sans durée, suppression manuelle |
| Valeur finale | valeur + somme des bonus temporaires actifs de la carac |
| Ressources | 0 ≤ actuel ≤ max ; max saisi à la main |
| Ambition | visible seulement si race = Humain ; valeurs conservées sinon |
| Endurance à 0 | bandeau « Évanoui » (information, aucun blocage) |
| Transfert | à la main (D-J15) ; règle rappelée dans le mémo Ressources |
| XP | compteur ≥ 0, ajusté à la main |

## 6. Modèle de données

Stockage comme Sans Nom : table `characters (id, nom, updated_at, data)` + `meta`. `data` = JSON ci-dessous, passé par `normalizeCharacter` à chaque lecture.

```ts
// Fiche = champs communs au PJ et au compagnon (D-J17) : nom, titre, age, tribu, classes, reve, prime, stats,
// bonusTemporaires, ressources, ressourcesPerso, fruit, xp, equipement, inventaire, competences.
interface Character {
  id: string; schemaVersion: 1; createdAt: string; updatedAt: string
  nom: string; titre: string; age: string
  race: Race | ''                 // 'Humain' | 'Homme-Poisson' | 'Skypiéen' | 'Tontata' | 'Mink'
  tribu: '' | 'longs-bras' | 'longues-jambes' | 'long-cou'
  classes: Classe[]               // liste fermée de packages/core ; l'UI n'en édite qu'une (Q-J1)
  reve: string                    // le rêve (texte)
  prime: number | null            // D-J14 ; pas de berries (Q-J2 : dans l'inventaire)
  stats: Record<StatKey, { valeur: number; avantages: number }>
  bonusTemporaires: { id: string; carac: StatKey; valeur: number; origine: string }[]
  ressources: {
    vitalite: Resource; endurance: Resource; reve: Resource; ambition: Resource; transfert: Resource  // transfert : 1/1 (D-J20)
  }
  ressourcesPerso: (Resource & { id: string; nom: string; regle: string })[]
  transfertUtilise: boolean
  fruit: { nom: string; type: '' | 'Paramecia' | 'Zoan' | 'Logia' | 'Inconnu'; description: string; eveil: string } | null
  xp: number
  equipement: string; inventaire: string
  competences: Skill[]            // Skill = { id, titre, cout: number|null, origine: '' | 'fruit' | 'combat' | 'race' | 'haki' | 'autre', description }
  compagnons: Compagnon[]         // Compagnon = Fiche + { id, race: string } (race jouable ou libre)
}
interface Resource { cur: number; max: number; regeneration: string }
```

Sauvegarde : `{ format: "onepiece-joueur-sauvegarde", version: 1, exportedAt, appVersion, characters: Character[] }`.

## 7. Hors périmètre

Synchronisation, partage avec le MJ, lanceur de dés, calcul automatique des jets, contrôle des points de création, application automatique des bonus de race/classe, portrait, impression, lore, notes de relations, gestion du navire, **suivi du Haki** (règle propre au MJ).
