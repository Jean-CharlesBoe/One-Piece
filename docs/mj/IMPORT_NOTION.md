# Migration Notion → appli MJ (unique)

> Statut : **script fait** (M5, 2026-10-19, D-M22), essayé sur l'export réel du MJ ; M6 faite (l'app garde les médias) : **import définitif possible** à partir de la version 0.4.0. Après une migration réussie et vérifiée, Notion n'est plus utilisé.

## 1. Principe

```
Notion ──(Exporter : Markdown & CSV, sous-pages, fichiers)──▶ export.zip
export.zip ──(npm run notion:import)──▶ one-piece.opmj + rapport-import.md
one-piece.opmj ──(appli MJ : Restaurer)──▶ base SQLite + médias
```

- Aucune clé d'API Notion : on part de l'**export officiel**.
- Le script tourne sur le PC de dev (Node 24), pas dans l'app.
- La sortie est une **sauvegarde `.opmj` normale** : l'app n'a qu'un seul chemin d'entrée des données (D-M5).
- Le script est **rejouable** : on peut corriger le mapping et relancer tant que l'app n'est pas utilisée pour de vrai.

## 2. Procédure pour le MJ

1. Notion → page « ☠️ One Piece » → ⋯ → **Exporter** → format **Markdown & CSV**, **Inclure le contenu : Tout**, **Inclure les sous-pages** coché, **Créer des dossiers pour les sous-pages** coché, fichiers et images inclus.
2. Déposer le zip dans `tools/notion-import/input/` (dossier ignoré par git : contenu privé).
3. `npm run notion:import -- tools/notion-import/input/export.zip tools/notion-import/input/one-piece.opmj` (le rapport `rapport-import.md` est écrit à côté du fichier de sortie).
4. Lire `rapport-import.md` (avertissements, liens cassés, valeurs non reconnues) ; ajuster `input/import.json` si besoin et relancer.
5. Copier `one-piece.opmj` sur le Chromebook (Drive ou clé USB) → appli MJ → **Restaurer**.
6. Dans l'app, ouvrir la vue **Doublons probables** pour finir le ménage restant.
7. Contrôle visuel : les 4 PJ, Drake et l'équipage du Cauchemar, le Scénario 1 et ses îles, les règles, les fruits, quelques images.

## 3. Contenu Notion recensé (analyse du 2026-10-09)

| Source Notion | Contenu | Type cible |
|---|---|---|
| Base **Persos** (`ff00c4b4…`, 2 vues de la même source) | PJ et PNJ : Nom, Étiquettes, Navire, État, Race, Classe, Fruit du démon, Groupe, Technique de combat, Fiche de personnage (fichier), texte | `personnage` |
| Base **Groupes** (`5511d9dd…`) | Nom, Persos | `faction` |
| Base **Lieux** (`799b8953…`, 2 vues) | Nom, Description, Alignement, Localisation, Fait partie de / Contient, Persos affiliés | `lieu` |
| Base **Races** (`cc685811…`) | Nom, Avantage, Désavantage, Compétence de Race, Malus de Race, Étiquettes | `race` |
| Base **Classes** (`dc0bfc12…`) | Nom, texte | `classe` |
| Base **Fruit du démon** (`85703559…`) | Name, Description, texte | `fruit` |
| Base **Evènements** (`3e85c5ac…`) | Nom, Étiquettes (Récurrent / Historique / Campagne), texte | `evenement` |
| Page **Règles** | 6 parties (dés, caracs, création, Haki, fruits, combat) | `regle` (une fiche par titre de niveau 1) |
| **Textes Importants › Scénario 1** | Archipel de Caille + 5 îles, énigme de la carte, équipage du Cauchemar, légende, amélioration | `scenario` + pages enfants `note` |
| **Textes Importants › Introduction, Note en vrac** | textes libres | `note` |
| Autres pages du wiki racine | inconnues à ce stade | `note` (signalées dans le rapport) |

## 4. Règles de conversion

### Communes
- `notion_id` = identifiant hexadécimal à la fin du nom de fichier/dossier ; **dédoublonnage** sur cet identifiant (les vues liées peuvent produire des doublons).
- Texte : Markdown de l'export, nettoyé (blocs vides, `<aside>` → citation, toggles → liste, colonnes aplaties).
- Liens internes (`[Titre](chemin/Titre%20<hex>.md)`) et mentions de pages → `[[<id>|Titre]]` ; cible introuvable → `[[?|Titre]]` + avertissement.
- Images et fichiers joints → `assets` + `media/` ; liens réécrits en `asset:<id>`.
- Sous-pages → fiches enfants (`parent_id`), type hérité du parent sauf règle contraire, ordre conservé.
- Dates de création/modification : celles de l'export si présentes, sinon date de l'import.

### Personnages
| Notion | Cible |
|---|---|
| Nom | `title` = nom avant la parenthèse ; la forme complète et la parenthèse deviennent des alias (« Osmo (Mérou) » → titre « Osmo », alias « Osmo (Mérou) », « Mérou »). Pas de champ « Joueur » (Q-M7) |
| Étiquettes `PJ` / `PNJ` | `props.role` |
| Étiquettes de grade (Amiral en Chef, Amiral, Vice-Amiral, Sous Amiral, Contre Amiral, Capitaine, Schichibukaï) | `props.grade` (orthographe normalisée) |
| Étiquette `Fiche Perso A Faire` | `props.aFaire = 'Oui'` |
| Étiquette `South Blue` | `props.mer` |
| Autres étiquettes (Equipage du Démon, Marine, Morsure de Kaïa, Armée Révolutionnaire…) | relation `factions` vers la fiche Faction du même nom, **créée si absente** (fusion avec la base Groupes par nom normalisé) |
| Groupe | relation `factions` |
| Navire (Bon / Neutre / Hostile / Chaotique / Joueur) | `props.alignement` (plusieurs valeurs → la 1re + avertissement) |
| État | `props.etat` |
| Race / Classe / Fruit du démon | relations `race` / `classes` / `fruit` |
| Technique de combat | `props.technique` |
| Fiche de personnage (fichier) | fiche `document` enfant + mention dans le texte |

Pas de bloc de jeu créé à l'import (les stats ne sont pas dans Notion).

### Lieux
Description → premier paragraphe du texte ; Alignement → `alignement` ; Localisation → `mer` ; « Fait partie de » : 1 parent → `parent_id`, plusieurs → relation + avertissement ; Persos affiliés → relation.

### Synonymes (un nom de référence par chose)
Le script applique une **table de synonymes** versionnée (`tools/notion-import/synonymes.json`) : chaque entrée donne le nom de référence, ses alias et le type. Les fiches portant un alias sont **fusionnées** dans la fiche de référence (même règle que « Fusionner » dans l'app, cahier MJ §4.7), et les relations / étiquettes sont redirigées.

```json
[
  { "type": "race", "reference": "Skypiéens", "alias": ["Anges", "Skypieen", "Skypiéen"] },
  { "type": "race", "reference": "Hommes-Poissons", "alias": ["Hommes Poisson", "Homme-Poisson"] },
  { "type": "race", "reference": "Tontatas", "alias": ["Tontata"] },
  { "type": "grade", "reference": "Shichibukai", "alias": ["Schichibukaï"] }
]
```
La table se complète au fil des relances du script, à partir de la section « Doublons probables » du rapport.

### Races, classes
Races : Avantage, Désavantage, Compétence de Race, Malus de Race → propriétés ; Vitalité et Endurance de base **complétées depuis le tableau des races** ([REGLES_ONE_PIECE.md §6](../REGLES_ONE_PIECE.md)) quand le nom correspond.
Classes : avantages et désavantages complétés depuis le tableau des classes ([REGLES_ONE_PIECE.md §5](../REGLES_ONE_PIECE.md)).
Après l'import, le MJ peut **changer le type** d'une fiche (ex. une île du Scénario 1 importée en Note → Lieu) depuis le cahier MJ §4.3.

### Événements
Étiquettes → `categorie` (plusieurs → la 1re + avertissement) ; un titre de la forme « Année NNNN » alimente aussi `dateMonde`.

## 5. Rapport d'import (`rapport-import.md`)

Comptes par type ; avertissements groupés (étiquettes non reconnues, valeurs multiples tronquées, liens cassés, fichiers manquants, pages non classées) ; liste des factions créées automatiquement ; synonymes appliqués ; **doublons probables** (titres proches entre fiches de même type, ex. « Equipage du Démon » / « Équipage du démon ») à trancher en complétant `synonymes.json` puis en relançant ; incohérences connues (Lunariens absents des règles).

## 6. Tests

`tools/notion-import/src/convert.test.ts` : un mini-export **inventé** (aucun contenu du monde du MJ) reproduisant la structure réelle, construit dans le test (2 persos avec relations et étiquettes, 1 groupe, 1 lieu, 1 race, 1 classe, 1 événement, les règles, un sommaire, 1 scénario avec deux sous-pages, 2 notes de session, 1 image, 1 PDF). Tests Vitest : lecture des pages, noms, conversion complète, réécriture des liens, `.opmj` relu par le `readBackup` de l'app.

## 6 bis. Mise en œuvre (M5, D-M22)

- `tools/notion-import/` : `src/notion.ts` (lecture de l'export : pages, propriétés en tête de page, chemins), `src/convert.ts` (pages → fiches), `src/report.ts`, `src/main.ts` ; `run.mjs` le lance par Vite (`runnerImport`), qui charge le TypeScript et le code de l'appli MJ (modèle, `normalizeEntity`, format `.opmj`, doublons probables).
- **Configuration** : `synonymes.json` (versionné : noms communs, races, grades) + `input/import.json` (privé, ignoré par git : synonymes propres au monde, et `parents` = pages à ranger sous une autre fiche). Exemple de `input/import.json` :
  ```json
  { "synonymes": [{ "type": "lieu", "reference": "Nom du lieu", "alias": ["Autre nom"] }],
    "parents": { "Titre de la page": "Titre de la fiche parente" } }
  ```
- Ce que l'export réel a montré (2026-10-19) : la page d'accueil liste les notes de session sous des titres « Session N date » ; « Textes Importants » n'est qu'un sommaire (pas de fiche) ; la base Lieux ne contient qu'un lieu ; les bases « Objets et infos » sont vides (absentes de l'export) ; les relations sont aussi en tête de chaque page (les CSV ne servent pas).
- Étiquettes des personnages : PJ / PNJ → rôle ; grades → grade (le premier) ; mer → mer d'origine ; **nom d'un lieu (ou d'un alias) → Origine** ; le reste → faction du même nom, rapprochée d'un groupe existant par une comparaison souple (articles, « équipage », pluriels, ponctuation ignorés ; signalé dans le rapport), sinon créée.
- Noms de personnages : parenthèse (Q-M7), virgule ou tiret (« Shanks, le démon rouge » → « Shanks »), surnom entre guillemets ; les autres noms longs (nom suivi du métier, sans séparateur) restent tels quels, à renommer dans l'app (l'ancien nom peut rester en alias).
- Fiches de personnage en PDF : fiche Document rattachée au personnage (`rattacheA`). Images du texte : `![image](asset:<id>)`. Médias rangés dans `media/` du `.opmj` (stockés sans recompression) ; l'app les garde depuis M6 (0.4.0) et les copie dans `medias/` du dossier Drive.

## 7. Après la migration

Une fois la base vérifiée dans l'app et une première sauvegarde `.opmj` faite depuis l'app : archiver l'export Notion (hors dépôt) et arrêter d'éditer Notion.
