# Construire, publier et installer les applis

> Repris de Sans Nom, adapté au monorepo. Les commandes se lancent **à la racine du dépôt**.
> Appli joueur : **Vivre Card** (`apps/joueur`). Appli MJ : **One Piece** (`apps/mj`, à partir de l'étape M0).

## Développer sur le PC

```bash
npm install            # une fois
npm run dev:joueur     # Vivre Card dans le navigateur (http://localhost:5173), stockage navigateur
npm run check          # vérification des types, tout le monorepo
npm test               # tests unitaires, tout le monorepo
```

Dans le navigateur, les données de Vivre Card vont dans le `localStorage` (repli de dev). **Sur le téléphone, c'est SQLite** : tester ce qui touche au stockage sur un vrai appareil.

⚠️ Les scripts racine n'appellent jamais `npm run` imbriqué (D-T7) : sur le PC du MJ, un vieux npm dans `C:\node_modules` ferait boucler le script.

## Tester sur un téléphone (Android Studio)

Prérequis, une seule fois : Android Studio installé (SDK et licences acceptées), téléphone en **débogage USB** ou **débogage sans fil** (Options pour les développeurs).

```bash
npm run android:joueur        # build web + copie dans apps/joueur/android
npm run android:joueur:open   # ouvre Android Studio → bouton ▶ « Run »
```

Sans câble : installer l'APK de debug produit par la CI (onglet **Actions** du dépôt → dernier run vert « Vivre Card (joueur) » → artefact `vivrecard-debug-apk`, à dézipper sur le téléphone). Les APK de debug sont tous signés par la même clé de debug (`apps/joueur/android/debug.keystore`, versionnée, D-T8) : un debug plus récent s'installe **par-dessus** le précédent et garde les fiches. (Exception : les APK de debug antérieurs au 2026-10-09 étaient signés par une clé jetable ; il faut les désinstaller une dernière fois.)

### Que vérifier (J0)
- Créer un personnage, l'ouvrir, revenir à la liste (flèche et bouton retour Android ; depuis la liste, le bouton retour quitte l'app).
- **Fermer complètement l'app** (balayer dans les apps récentes), la rouvrir : le personnage est toujours là → SQLite fonctionne.
- Supprimer (deux taps : « Supprimer » puis « Confirmer »).
- Passer le téléphone en thème sombre : l'app suit.

⚠️ Avant d'installer la première **vraie** version (release signée), désinstaller l'app de debug.

## Clé de signature (une seule fois, par le MJ)

La clé signe chaque APK. **Toutes les versions d'une app doivent être signées avec la même clé**, sinon Android refuse la mise à jour et il faut désinstaller (= perte des données). **Une seule clé signe les deux applis** (D-T5 : les `appId` diffèrent). Elle doit être conservée **hors de GitHub aussi** (gestionnaire de mots de passe, clé USB…), et **n'est pas celle de Sans Nom**.

Commandes **PowerShell** :

1. Créer un dossier **hors du dépôt** et s'y placer :
   ```powershell
   New-Item -ItemType Directory -Force "$HOME\Documents\OnePiece-cle"; Set-Location "$HOME\Documents\OnePiece-cle"
   ```
2. Générer la clé (l'outil demande un mot de passe, puis des infos facultatives) :
   ```powershell
   & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -keystore onepiece-release.jks -alias onepiece -keyalg RSA -keysize 4096 -validity 36500
   ```
3. Envoyer les secrets avec `gh` (les commandes sans `--body` demandent la valeur au clavier) :
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PWD\onepiece-release.jks")) | gh secret set ANDROID_KEYSTORE_BASE64 --repo Jean-CharlesBoe/One-Piece
   gh secret set ANDROID_KEYSTORE_PASSWORD --repo Jean-CharlesBoe/One-Piece
   gh secret set ANDROID_KEY_PASSWORD --repo Jean-CharlesBoe/One-Piece
   gh secret set ANDROID_KEY_ALIAS --body onepiece --repo Jean-CharlesBoe/One-Piece
   gh secret list --repo Jean-CharlesBoe/One-Piece
   ```
   Windows PowerShell 5.1 ajoute un retour à la ligne au texte envoyé par `|` : la CI ne garde que les caractères base64 avant de décoder la clé, ce n'est donc pas gênant.
4. Copier `onepiece-release.jks` en lieu sûr et garder le mot de passe à part.
5. Noter ci-dessous l'empreinte SHA-256 du certificat (après la première release).

Pour signer en local (facultatif) : créer `apps/joueur/android/keystore.properties` (ignoré par git) :
```properties
storeFile=C:/Users/.../Documents/OnePiece-cle/onepiece-release.jks
storePassword=...
keyAlias=onepiece
keyPassword=...
```

## Empreinte de la clé officielle

Les APK de release (Vivre Card, et plus tard l'appli MJ) doivent tous porter ce certificat (SHA-256), relevé sur `VivreCard-v0.1.0.apk` le 2026-10-12 :
`894f3895112ec92857940f786e76b123c8ac11936889fa973b1664319e2a2826`

Vérifier un APK :
```bash
"$LOCALAPPDATA/Android/Sdk/build-tools/36.0.0/apksigner.bat" verify --print-certs VivreCard-vX.Y.Z.apk
```

## Publier une version de Vivre Card

Le workflow [.github/workflows/joueur.yml](../.github/workflows/joueur.yml) :
- à chaque push sur `main` touchant `apps/joueur`, `packages/core` ou les dépendances : vérifie, teste et construit un **APK de debug** (artefact `vivrecard-debug-apk`) ;
- à chaque **tag `joueur-vX.Y.Z`** : construit l'**APK signé** et crée une **Release** GitHub avec `VivreCard-vX.Y.Z.apk`.

1. Mettre la même version dans `apps/joueur/package.json` (la CI refuse un tag qui ne correspond pas).
2. Commit, puis :
   ```bash
   git tag joueur-v0.1.0
   git push origin joueur-v0.1.0
   ```

Le `versionCode` Android est calculé à partir du tag (`X*10000 + Y*100 + Z`) : chaque tag doit être **supérieur** au précédent.

## Installer sur le téléphone d'un joueur

Notice à donner aux joueurs : [joueur/NOTICE.md](joueur/NOTICE.md) (installation, mise à jour, sauvegarde, utilisation). Le texte de la Release GitHub ([.github/release-notes-joueur.md](../.github/release-notes-joueur.md)) y renvoie.

1. Sur le téléphone, ouvrir la page **Releases** du dépôt et télécharger `VivreCard-vX.Y.Z.apk`.
2. Ouvrir le fichier ; autoriser l'installation depuis le navigateur (« sources inconnues »).
3. Installer. Une mise à jour s'installe **par-dessus** et garde les données.

⚠️ Ne pas installer un APK de **debug** puis un APK de **release** (ou l'inverse) : signatures différentes → il faudrait désinstaller.

## Régénérer la notice PDF

Source : `docs/notice/notice.html` + captures dans `docs/notice/img/` (format téléphone 375 × 812, thème clair, personnage d'exemple « Osmo le Chanceux » avec son compagnon Karoo). Les captures se refont dans le navigateur intégré (`npm run dev:joueur`) : mettre de côté le stockage du navigateur, charger le personnage d'exemple, capturer, puis remettre le stockage. Après modification, dans PowerShell :

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$env:TEMP\edge-pdf" --print-to-pdf="C:\Repos\One Piece\docs\Notice-Vivre-Card.pdf" "file:///C:/Repos/One%20Piece/docs/notice/notice.html"
```

Chaque partie tient sur une page A4 : le PDF doit compter une page de couverture + une page par partie (12 actuellement).
