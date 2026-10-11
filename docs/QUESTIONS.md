# Questions

Numérotation stable : une question garde son numéro une fois répondue (les cahiers des charges y renvoient avec **[Q-…]**).
Préfixes : **Q-T** transverse · **Q-R** règles du jeu · **Q-J** appli joueur · **Q-M** appli MJ.
**Bloquante pour** = étape de la [ROADMAP](ROADMAP.md) qu'on ne code pas sans réponse.

## Ouvertes

### Transverses
- **Q-T3. Installation sur le Chromebook** — Le Chromebook a-t-il le Play Store / les apps Android activés ? Installer un APK hors Play Store demande le mode développeur Android (ADB) ou un canal de test interne Play Console. *Bloquante pour M1 (tests sur appareil).*
- **Q-T4. Icônes** — Même démarche que Sans Nom (dessin fourni) ? *Non bloquante.*

### Règles du jeu
- **Q-R5. Attaque de base** — « 1D6 + modificateur de caractéristique » : modificateur = la carac entière, une fraction, autre ? *Source retrouvée : page Notion « Règles » (https://www.notion.so/3ea9b6dd00244fcc9508b79d05cef381), §6 « Système de combat », point 2 « Calcul des dégâts » (modifiée le 2025-02-02). Le MJ la relit (2026-10-11).*

### Appli joueur
- **Q-J3. Nouveau jour et Transfert** — Bouton « Nouveau jour » (recharge Ambition, réarme le Transfert) et assistant de Transfert (25 % calculés) : utiles, ou saisie à la main ?

### Appli MJ
- **Q-M1. Onglets de fiches** — Garder plusieurs fiches ouvertes en onglets hors session (comme un navigateur), ou une seule fiche + historique suffit ?
- **Q-M2. Campagnes** — Une seule campagne (celle en cours) ou plusieurs groupes de joueurs / campagnes ?
- **Q-M3. État des PNJ après la session** — L'état modifié en session (PV perdus, mort) reste-t-il sur la fiche, ou proposer de revenir à l'état de début ? Et journal automatique de chaque changement : oui ?
- **Q-M4. Export Markdown d'une fiche** — Utile (par ex. pour imprimer un texte à remettre) ?
- **Q-M5. Recherche dans le journal** — La recherche globale doit-elle aussi trouver les entrées de journal ?
- **Q-M6. Taille des médias** — Volume approximatif d'images/PDF dans Notion ? (au-delà de ~25 Mo, le backup Android automatique ne couvre plus tout : la sauvegarde `.opmj` devient indispensable)
- **Q-M7. Noms à parenthèses** — « Osmo (Mérou) », « Djack (Rayne) » : la parenthèse est-elle le nom du joueur ? Si oui, champ « Joueur » plutôt qu'alias.

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
- **Q-J4. Raccourci de dépense** → **non** : comme Sans Nom, le joueur ouvre le losange Endurance et retire le coût à la main ; la compétence affiche seulement son coût (D-J12).
- **Q-R1. Avantages** → comme Sans Nom : +N = N relances du jet ; double avantage = 2 relances ; négatif = désavantages gérés par le MJ (REGLES §1).
- **Q-R2. Ambition** → +2 sur le résultat d'un jet (1 point dépensé = +2, confirmé), sans pouvoir annuler un échec critique ni créer une réussite critique ; rechargée chaque jour. Rappels associés du MJ : Transfert plafonné au max, Rêve (relance ou 2D6 + 4 + points dépensés), régénération hors combat de 2D6 (REGLES §3).
- **Q-J2. Prime** → oui : encart « Prime » sur la fiche, les persos finiront avec une prime sur la tête (D-J14). Berries : pas de champ, une entrée de l'inventaire (2026-10-11). Affichage : ligne du bloc Info plutôt qu'un encart.
- **Q-J5. Mémos** → principe validé (D-J7) : boutons « i » contextuels + aide-mémoire. Demandes associées : titre « Caractéristiques » avec son « i », bloc « Info » (D-J13).
