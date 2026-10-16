# Questions

Numérotation stable : une question garde son numéro une fois répondue (les cahiers des charges y renvoient avec **[Q-…]**).
Préfixes : **Q-T** transverse · **Q-R** règles du jeu · **Q-J** appli joueur · **Q-M** appli MJ.
**Bloquante pour** = étape de la [ROADMAP](ROADMAP.md) qu'on ne code pas sans réponse.

## Ouvertes

### Transverses
- **Q-T3. Installation sur le Chromebook** — Le Play Store est bien présent (apps Android actives, 2026-10-16). Reste à choisir comment installer un APK hors Play Store : débogage ADB par l'environnement Linux du Chromebook, ou test interne via la Play Console. *Bloquante pour M1 (tests sur appareil).*
- **Q-T4. Icônes** — Même démarche que Sans Nom (dessin fourni) ? *Non bloquante.*

### Règles du jeu
*Aucune question ouverte.*

### Appli joueur
*Aucune question ouverte (icône : Q-T4).*

### Appli MJ
*Aucune question ouverte (installation sur le Chromebook : Q-T3).*

## Répondues

- **Synchro MJ ↔ joueurs** → aucune, deux applis totalement indépendantes (D-T0).
- **Stack** → d'abord Flutter, puis **stack de Sans Nom** après analyse du dépôt (D-T1).
- **Notion** → import unique puis abandon (D-M5).
- **Fiches PJ côté MJ** → non : le MJ ne gère pas les fiches des PJ, ce sont les joueurs (D-T0).
- **Appli joueur** → doit faire comme Sans Nom (D-J1).
- **Documents** → cartes et articles de journaux imprimés et remis en vrai ; l'app MJ les stocke seulement (D-M6). Pas de caché / révélé.
- **Outils MJ en session** → journal de session, recherche et liens ; pas de suivi de combat ni de jets (D-M4, D-M7).
- **Base de connaissances** → retrouver tout Notion, adapté au JDR ; fiches de persos qui évoluent en session avec les événements notés ; enrichissement hors session (D-M1, D-M4).
- **Ressources joueur** → Vitalité, Endurance, Rêve, Ambition, ressources personnalisées (D-J3).
- **Fruit du démon** → sur la page principale, ses techniques dans Compétences (D-J4).
- **Invocations** → gardées sous forme de compagnons (D-J5).
- **Création** → saisie libre comme Sans Nom ; encart pédagogique à challenger (D-J2, D-J7).
- **Livrable des specs** → fichiers Markdown.
- **Q-T1. Noms** → appli joueur **« Vivre Card »**, appli MJ **« One Piece »** (D-T5).
- **Q-T2. Dépôt** → public, comme Sans Nom (D-T6).
- **Q-R3. Races** → **Anges = Skypiéens** (nom de référence : Skypiéens). Constat du MJ : dans Notion, une même chose porte des noms différents selon les pages, d'où le besoin de centraliser avec un nom de référence par chose (D-M8). Lunariens : voir Q-R6.
- **Q-R4. Haki** → règle précisée : Observation et Armement maîtrisés après 5 meilleurs résultats sur les D100 du MJ (ou entraînement), Rois dès un résultat 1–5 (ou conditions exceptionnelles) ; une fois maîtrisé, pas de jauge mais des compétences à coût fixe en Endurance, ou usage à volonté à 5 Endurance/tour (à 0 : désactivé, −5 partout pendant 2 tours) (D-J6, REGLES §7).
- **Q-J1. Classes** → une seule classe au départ, peut évoluer (D-J9).
- **Haki sur Vivre Card** → rien : règle propre au MJ ; le joueur ajoute une compétence de Haki quand le MJ annonce la maîtrise ; pas de bouton Épuisement (D-J6).
- **Q-R6. Lunariens** → non jouables par les PJ ; race de lore côté MJ uniquement.
- **Q-M8. Relevé des jets de Haki** → une entrée « Haki » dans le journal de session (D-M9).
- **Q-M2. Campagnes** → **un seul groupe de joueurs**, donc une seule campagne (2026-10-16, D-M13).
- **Q-M3. État des PNJ après la session** → l'état modifié en session **reste** sur la fiche ; un bouton « Remettre à l'état de début de session » permet de revenir en arrière (2026-10-16, D-M13). Journal automatique : voir Q-M3 (suite).
- **Q-M4. Export Markdown d'une fiche** → utile, avec un import (2026-10-16) ; précisé par Q-M4 (suite).
- **Q-M6. Taille des médias** → de nombreux PDF (fiches de personnages déjà créés, pas tous) et des images de fruits du démon : **probablement plus de 25 Mo** (2026-10-16). Le backup Android automatique ne suffira pas : la sauvegarde `.opmj` (M4) est indispensable et son rappel doit être visible.
- **Q-M7. Noms à parenthèses** → **pas de champ « Joueur »** (2026-10-16). L'import garde la règle prévue : le nom avant la parenthèse devient le titre, la forme complète et la parenthèse deviennent des alias (la recherche par le nom du joueur reste possible).
- **Q-J4. Raccourci de dépense** → **non** : comme Sans Nom, le joueur ouvre le losange Endurance et retire le coût à la main ; la compétence affiche seulement son coût (D-J12).
- **Q-R1. Avantages** → comme Sans Nom : +N = N relances du jet ; double avantage = 2 relances ; négatif = désavantages gérés par le MJ (REGLES §1).
- **Q-R2. Ambition** → +2 sur le résultat d'un jet (1 point dépensé = +2, confirmé), sans pouvoir annuler un échec critique ni créer une réussite critique ; rechargée chaque jour. Rappels associés du MJ : Transfert plafonné au max, Rêve (relance ou 2D6 + 4 + points dépensés), régénération hors combat de 2D6 (REGLES §3).
- **Q-J2. Prime** → oui : encart « Prime » sur la fiche, les persos finiront avec une prime sur la tête (D-J14). Berries : pas de champ, une entrée de l'inventaire (2026-10-11). Affichage : ligne du bloc Info plutôt qu'un encart.
- **Q-J5. Mémos** → principe validé (D-J7) : boutons « i » contextuels + aide-mémoire. Demandes associées : titre « Caractéristiques » avec son « i », bloc « Info » (D-J13).
- **Q-R5. Attaque de base** → confirmé par le MJ après relecture de Notion (2026-10-11) : une attaque de base, sans compétence créée derrière, fait **1D6 + le modificateur de caractéristique** (généralement Robustesse, Adresse ou Finesse). Formulation reprise telle quelle dans les mémos.
- **Q-J3. Nouveau jour et Transfert** → **à la main** : pas de bouton « Nouveau jour » ni d'assistant de Transfert ; la règle est rappelée dans le mémo « Ressources » (D-J15).
- **Q-M1. Onglets de fiches** → **oui, onglets légers** (2026-10-16, D-M14) : un clic remplace la fiche affichée ; nouvel onglet à la demande (Ctrl + clic, clic molette, appui long, bouton de la fiche) ; barre d'onglets tactile ; 8 onglets au plus, rouverts au démarrage ; historique par onglet. Principe général : tout s'utilise à la souris comme au doigt.
- **Q-M3 (suite). Journal automatique** → **oui** (2026-10-16, D-M15) : une ligne lisible par changement du bloc de jeu en session, regroupée sur 10 s, grisée, masquable, supprimable, reprise dans la chronologie de la fiche.
- **Q-M4 (suite). Export de documents** → **exporter un document stocké (PDF, image)** pour l'imprimer ou l'envoyer, et **exporter une fiche en PDF** mise en forme, en plus de l'export Markdown (2026-10-16, D-M16). Pas d'import de fichier texte en fiche.
- **Q-M5. Recherche dans le journal** → **oui** (2026-10-16, D-M15) : groupe « Journal » sous les fiches dans Ctrl+K (5 entrées, « Voir tout »), clic = journal de la session ouvert sur l'entrée.
