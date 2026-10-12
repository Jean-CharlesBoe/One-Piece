# JDR One Piece — guide de projet

Deux applications Android **indépendantes** pour le JDR One Piece maison de Jean-Charles (le MJ) :

| App | Pour qui | Appareil | Rôle |
|---|---|---|---|
| **Vivre Card** — appli joueur (`apps/joueur`) | les joueurs | téléphones Android | fiche de personnage, calquée sur l'app Sans Nom |
| **One Piece** — appli MJ (`apps/mj`) | le MJ seul | Chromebook (app Android) | base de connaissances du JDR + journal de session |

Chaque app a **sa propre base SQLite embarquée**. Aucun serveur, aucune synchro, aucun échange de données entre les deux apps. Le MJ ne voit pas les fiches des joueurs.

Langue du projet : **français** (UI, docs, messages de commit). Identifiants de code en anglais, termes du jeu sans équivalent clair en français (`reve`, `haki`, `fruit`).

## Où trouver quoi

| Fichier | Rôle |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, monorepo, paquet partagé, stockage, CI, conventions |
| [docs/REGLES_ONE_PIECE.md](docs/REGLES_ONE_PIECE.md) | Les règles du jeu (reprises de Notion) : **source unique** des mémos et du module de règles |
| [docs/joueur/CAHIER_DES_CHARGES.md](docs/joueur/CAHIER_DES_CHARGES.md) | Ce que fait l'appli joueur : écrans, règles, modèle |
| [docs/joueur/NOTICE.md](docs/joueur/NOTICE.md) | Notice pour les joueurs (à tenir à jour avec l'app) |
| [docs/mj/CAHIER_DES_CHARGES.md](docs/mj/CAHIER_DES_CHARGES.md) | Ce que fait l'appli MJ : base de connaissances, sessions, documents |
| [docs/mj/MODELE_DONNEES.md](docs/mj/MODELE_DONNEES.md) | Schéma SQLite de l'appli MJ, registre des types de fiches |
| [docs/mj/IMPORT_NOTION.md](docs/mj/IMPORT_NOTION.md) | Migration unique Notion → appli MJ |
| [docs/QUESTIONS.md](docs/QUESTIONS.md) | Questions ouvertes et réponses obtenues |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Journal des décisions, avec leur justification |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Étapes de développement et journal des sessions |
| [docs/RELEASE.md](docs/RELEASE.md) | Dev local, test sur téléphone, clé de signature, publication (tags `joueur-vX.Y.Z`) |

Référence technique : le dépôt **Sans Nom** (https://github.com/Jean-CharlesBoe/Sans-Nom) — même stack, même organisation, mêmes conventions. En cas de doute sur un choix technique déjà tranché là-bas (CI, signature, SQLite, sauvegarde, bouton retour), **reprendre la solution de Sans Nom**.

## Règles de travail entre sessions

1. En début de session : lire `docs/ROADMAP.md` (étape en cours, journal), puis `docs/QUESTIONS.md`.
2. Ne pas coder une fonctionnalité dont une question bloquante est encore ouverte : la poser d'abord.
3. Toute décision prise avec l'utilisateur → une entrée dans `docs/DECISIONS.md`.
4. Toute réponse obtenue → déplacer la question dans « Répondues » de `docs/QUESTIONS.md` et mettre à jour le cahier des charges concerné.
5. En fin de session : ajouter une entrée au journal dans `docs/ROADMAP.md` (fait, reste à faire, points d'attention).
6. Les règles du jeu (bornes, calculs, textes des mémos) vivent dans **`packages/core/src/rules/`**, jamais dupliquées dans l'UI ni entre les deux apps.
7. Toute évolution du format stocké → incrémenter la version du schéma de l'app concernée et écrire une migration.

## Conventions de code (reprises de Sans Nom)

- Les composants n'appellent jamais SQLite : toujours la couche repository (`getRepository()`).
- Toute donnée lue (base, import, sauvegarde) passe par une fonction `normalize*`.
- Fonctions de règles : modifient l'objet reçu (compatible proxys `$state` de Svelte 5) et renvoient la valeur retenue ; testées avec Vitest.
- Avant d'enregistrer un `$state`, passer par `$state.snapshot()`.
- `appId` et clé de signature sont **définitifs** une fois la première version publiée (voir D-T5).

## Commandes (à la racine du monorepo)

Les scripts racine n'appellent jamais `npm run` imbriqué (D-T7).

```bash
npm install
npm run dev:joueur        # appli joueur dans le navigateur (repli localStorage)
npm run dev:mj            # appli MJ dans le navigateur (repli web jeep-sqlite)
npm run check             # types (svelte-check + tsc) sur tout le monorepo
npm test                  # Vitest sur tout le monorepo
npm run android:joueur    # build + cap sync android de l'appli joueur
npm run android:joueur:open  # ouvre apps/joueur/android dans Android Studio
npm run android:mj        # build + cap sync android de l'appli MJ
npm run notion:import -- <export.zip> <sortie.opmj>   # migration Notion unique
```
