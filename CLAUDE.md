# Atelier — notes de travail

Application de bureau de catalogage d'œuvres pour artistes peintres.
Electron + React + TypeScript, interface **en français**, code **en français**
(noms de variables, de fonctions, commentaires).

## Le pacte avec l'artiste

> Les données appartiennent à l'artiste, pas à l'application.

Une œuvre est un fichier Markdown lisible au Bloc-notes, ses photos rangées à
côté. Le dossier se sauvegarde, se déplace, s'ouvre sans nous. **Toute
décision qui affaiblit cette promesse est à refuser**, même si elle simplifie
le code : pas de base de données, pas de format binaire, pas de champ
indéchiffrable.

## Commandes

```bash
npm run dev          # développement, rechargement à chaud
npm run typecheck    # tsc --noEmit sur les deux projets
npx vitest run       # 40 tests, tous sur du code pur
npm run build        # compile main / preload / renderer
npm run pack         # application empaquetée dans release/win-unpacked
```

### Le contrôle qui compte

```bash
./release/win-unpacked/Atelier.exe --verifier <dossier-atelier> --out res.json
```

Sans fenêtre : lit les fiches, résout les chemins, fabrique une vignette par
sharp **et** un certificat en PDF, le tout depuis l'archive asar. À lancer
après chaque `npm run pack`. Il tourne dans son propre dossier de données, donc
sans déranger une application ouverte.

**Pourquoi il existe :** `sharp` et `printToPDF` fonctionnent en développement
et cassent une fois empaquetés. Un contrôle qui exigerait de cliquer dans
l'interface ne serait jamais fait.

## Architecture

```
src/shared/     domaine pur — aucun accès disque, aucun React, testable seul
src/main/       processus principal — le seul à toucher au disque
src/preload/    passerelle close et figée
src/renderer/   interface, en bac à sable
```

### Fichiers structurants

| Fichier | Rôle |
|---|---|
| `shared/entete.ts` | Découpage, coercitions et assemblage YAML. **Toute lecture ou écriture de document passe par là** |
| `shared/document.ts` | Grammaire d'une œuvre |
| `shared/carnet.ts` | Grammaire d'une fiche — acheteurs, dépôts, séries |
| `shared/libelles.ts` | Mise en mots d'une œuvre. Une œuvre se lit pareil partout |
| `shared/reference.ts` | Identité (`CK-0031`) et référence affichée (`CK-0031-SKRATON`) |
| `main/atelier/collection.ts` | Persistance d'un dossier de `.md`. Œuvres et carnets s'y branchent |
| `main/atelier/chemins.ts` | `dansAtelier()` — **la garde qui empêche de lire ou écrire hors du dossier** |
| `renderer/etat/useBrouillon.ts` | Enregistrement continu, sans bouton « Enregistrer » |

### Structure d'un atelier

```
Tableaux/CK-0031-SKRATON Femme au pagne.md
Photos/CK-0031/face.jpg
Acheteurs/Galerie Nord.md
Depots/Montréal.md
Series/Skraton.md
Certificats/CK-0031-SKRATON Femme au pagne.pdf
.artkhan/atelier.json          artiste, préfixe, filigrane, mention légale
.artkhan/vignettes/            cache, reconstructible
```

## Règles à ne pas enfreindre

**On ne perd rien.** Un en-tête abîmé à la main ne fait pas disparaître
l'œuvre : chaque champ retombe sur une valeur sûre. Les clés inconnues sont
relues et réécrites telles quelles — l'artiste peut ajouter les siennes.

**On n'écrit pas le vide.** Une clé sans valeur n'est pas sérialisée.

**Toute suppression passe par la corbeille**, jamais par `unlink`.

**Le renderer ne lit aucun fichier.** Il manipule des chemins relatifs, que le
processus principal résout et vérifie. Les photos transitent par
`artkhan-thumb:` et `artkhan-media:`, chemin en **paramètre de requête** —
Chromium normalise l'hôte en minuscules et casserait les noms de fichiers.

**L'identité d'une œuvre ne bouge jamais.** `ref` est écrite dans l'en-tête.
La référence affichée, série comprise, est calculée. Une œuvre qui rejoint une
série ne doit pas voir son dossier de photos changer.

**Aucune couleur hors de `tokens.css`.** Sinon le thème clair reste à moitié
sombre. Le thème passe par `nativeTheme.themeSource`, jamais par une classe.

## Données incomplètes

Un catalogue rétrospectif est plein de trous, et ils sont **modélisés, pas
subis** : année nulle avec une certitude, titre vide affiché « Sans titre »,
photo manquante signalée. **Aucun champ n'est obligatoire.** Ne jamais ajouter
de validation bloquante à la saisie.

## Choix d'interaction établis

- L'œuvre existe sur le disque dès le clic sur « Ajouter » ; chaque pause dans
  la frappe l'enregistre. Il n'y a pas de bouton « Enregistrer », et il ne doit
  pas y en avoir.
- Un nom saisi sur une œuvre ouvre sa fiche au carnet, sans étape
  supplémentaire. Une passe de réconciliation rattrape l'existant à l'ouverture.
- Les totaux sont **regroupés par devise**. Additionner euros et dollars
  donnerait un nombre faux.
- Un tableau vendu « au Vatican » n'est pas un dépôt : seul le statut « En
  dépôt » alimente cette rubrique.

## Ce qui reste à faire

- Glisser-déposer des photos (le sélecteur de fichiers fonctionne)
- Page de réglages pour le filigrane et la mention légale — aujourd'hui
  modifiables uniquement dans `.artkhan/atelier.json`
- Icône d'application (electron-builder utilise celle d'Electron par défaut)

## Pièges rencontrés, à ne pas réintroduire

- `Object.freeze` autour d'un objet annoté casse l'inférence des paramètres :
  annoter d'abord, geler à l'exposition.
- Une fenêtre invisible détruite déclenche `window-all-closed` : sans gardien,
  Electron quitte avant d'avoir écrit son compte rendu, **en rendant 0**.
- `position: sticky` dans un conteneur à rembourrage haut laisse le contenu
  défiler au-dessus de l'en-tête censé le couvrir.
- Les numéros de référence se comparent comme des **nombres** : « CK-031 » et
  « CK-0031 » sont le même numéro.
