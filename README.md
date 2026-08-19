# Atelier

**Le catalogue d'un artiste peintre, dans des fichiers qui lui appartiennent.**

Enregistrez vos œuvres, leurs photos, où elles se trouvent, à qui vous les avez
vendues — et éditez leurs certificats d'authenticité.

---

## Ce qui distingue cette application

Vos données ne sont pas enfermées dedans.

Chaque tableau est un **fichier texte lisible**, ses photos rangées à côté :

```
Tableaux/CK-0031 Femme au pagne.md
Photos/CK-0031/face.jpg
```

Ouvrez-le dans le Bloc-notes, vous lisez tout :

```yaml
---
ref: CK-0031
titre: Femme au pagne
annee: 2021
technique: Huile sur toile
hauteur: 120
largeur: 80
statut: atelier
---

Peinte après le retour de Kinshasa.
```

Vous pouvez le modifier à la main, le sauvegarder sur une clé, le déposer dans
un dossier synchronisé, l'ouvrir dans Obsidian. Si cette application disparaît,
**votre catalogue reste lisible**.

## Ce qu'elle fait

**Catalogue** — vos œuvres en liste dense ou en grille de photos, filtrées par
statut, triées par titre, référence, année, dimensions ou prix, et cherchées
partout ou dans un champ précis.

**Carnet d'adresses vivant** — écrivez « Galerie Nord » sur un tableau vendu :
sa fiche s'ouvre toute seule. Vous y retrouvez ses coordonnées, les œuvres
qu'elle a achetées et le total, **par devise**. Même chose pour les lieux de
dépôt et les séries.

**Certificats d'authenticité** — calqués sur un modèle imprimable, avec
filigrane et photo de l'œuvre. Aperçu en direct, PDF enregistré dans votre
dossier, ou impression directe.

**Pensée pour les catalogues incomplets** — « Sans titre », « année à
vérifier », photo manquante sont des états normaux, affichés tels quels. Aucun
champ n'est obligatoire : vous pouvez enregistrer une œuvre dont vous ne savez
presque rien.

## Deux garanties

- **Un fichier abîmé ne fait pas disparaître l'œuvre.** Chaque champ retombe
  sur une valeur sûre, et les informations que vous ajoutez vous-même sont
  conservées.
- **Toute suppression passe par la corbeille**, jamais définitivement.

Il n'y a pas de bouton « Enregistrer » : chaque pause dans votre frappe écrit
le fichier. Fermez la fenêtre quand vous voulez.

## Installer

```bash
npm install
npm run dev
```

Pour produire l'application installable :

```bash
npm run dist
```

## Sous le capot

Electron 43, React 19, TypeScript 7, [sharp](https://sharp.pixelplumbing.com)
pour les vignettes. Interface et code en français.

Le processus d'affichage est en bac à sable et ne lit aucun fichier : il ne
manipule que des chemins relatifs, vérifiés par le processus principal, qui
refuse tout ce qui sort du dossier d'atelier.

Les certificats sont produits par le moteur d'impression d'Electron —
aucune bibliothèque PDF n'est embarquée.

Le développement est décrit dans [CLAUDE.md](CLAUDE.md).

## État

Utilisable. Restent à faire : le glisser-déposer des photos, une page de
réglages pour le filigrane et la mention légale, et une icône d'application.

## Licence

Usage privé. Tous droits réservés.
