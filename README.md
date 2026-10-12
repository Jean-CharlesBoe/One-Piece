# JDR One Piece

Deux applications Android indépendantes pour le JDR One Piece :

- **Vivre Card**, l'appli des joueurs : la fiche de personnage sur téléphone (caractéristiques, ressources, fruit du démon, compétences, compagnons, sauvegarde vers Drive). Tout fonctionne hors ligne, les données restent sur le téléphone.
- **One Piece**, l'appli du MJ : base de connaissances du JDR et journal de session, sur Chromebook (en préparation).

## Joueurs : installer Vivre Card

👉 **[Télécharger Vivre Card](https://github.com/Jean-CharlesBoe/One-Piece/releases)** (fichier `VivreCard-vX.Y.Z.apk` de la dernière version « Vivre Card »), puis suivre la **[notice](docs/joueur/NOTICE.md)** : installation, mise à jour, sauvegarde et utilisation.

📄 **[Notice illustrée (PDF)](docs/Notice-Vivre-Card.pdf)** : la même chose, avec des captures d'écran.

## Développement

Monorepo Vite + TypeScript + Svelte 5, emballé en applis Android par Capacitor, données en SQLite.

```bash
npm install
npm run dev:joueur   # Vivre Card dans le navigateur
npm run check        # types
npm test             # tests
```

| Fichier | |
|---|---|
| [CLAUDE.md](CLAUDE.md) | guide du projet (règles de travail, conventions, commandes) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | stack, monorepo, stockage, sauvegarde, CI |
| [docs/REGLES_ONE_PIECE.md](docs/REGLES_ONE_PIECE.md) | règles du jeu reprises de Notion |
| [docs/joueur/CAHIER_DES_CHARGES.md](docs/joueur/CAHIER_DES_CHARGES.md) · [docs/joueur/NOTICE.md](docs/joueur/NOTICE.md) | appli joueur : spécifications, notice |
| [docs/mj/CAHIER_DES_CHARGES.md](docs/mj/CAHIER_DES_CHARGES.md) · [MODELE_DONNEES](docs/mj/MODELE_DONNEES.md) · [IMPORT_NOTION](docs/mj/IMPORT_NOTION.md) | appli MJ |
| [docs/RELEASE.md](docs/RELEASE.md) | construire, signer et publier |
| [docs/DECISIONS.md](docs/DECISIONS.md) · [docs/QUESTIONS.md](docs/QUESTIONS.md) · [docs/ROADMAP.md](docs/ROADMAP.md) | décisions, questions ouvertes, étapes et journal |
