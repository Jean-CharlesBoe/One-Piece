# JDR One Piece — spécifications

Specs fonctionnelles et techniques de deux applis Android indépendantes pour le JDR One Piece :
**Vivre Card**, l'appli joueur (fiche de personnage, téléphones), et **One Piece**, l'appli MJ (base de connaissances + journal de session, Chromebook).

## Démarrer dans Claude Code

1. Créer le dépôt (monorepo, voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)) et y copier ce dossier tel quel : `CLAUDE.md` à la racine, `docs/` à côté.
2. Les questions bloquantes pour démarrer sont tranchées ; les questions restantes de [docs/QUESTIONS.md](docs/QUESTIONS.md) bloquent des étapes plus tardives (voir la colonne « Bloquée par » de la roadmap).
3. Dans Claude Code : « Lis CLAUDE.md et docs/ROADMAP.md, puis démarre l'étape C1 ». Garder le dépôt Sans Nom accessible comme référence.

## Contenu

| Fichier | |
|---|---|
| `CLAUDE.md` | guide du projet pour Claude Code (règles de travail, conventions, commandes) |
| `docs/ARCHITECTURE.md` | stack, monorepo, stockage, sauvegarde, CI |
| `docs/REGLES_ONE_PIECE.md` | règles du jeu reprises de Notion, avec les trous repérés |
| `docs/joueur/CAHIER_DES_CHARGES.md` | appli joueur |
| `docs/mj/CAHIER_DES_CHARGES.md` | appli MJ |
| `docs/mj/MODELE_DONNEES.md` | schéma SQLite et registre des types de l'appli MJ |
| `docs/mj/IMPORT_NOTION.md` | migration unique Notion → appli MJ |
| `docs/DECISIONS.md` · `docs/QUESTIONS.md` · `docs/ROADMAP.md` | décisions, questions ouvertes, étapes |
