import type { Fiche, TypeCarnet } from '@shared/carnet'
import { DOSSIER_CARNET, ecrireFiche, ficheVide, lireFiche, memeNom, nomFichierFiche } from '@shared/carnet'
import { corbeille, lireTout, poser, type Collection } from './collection'

/**
 * Les carnets — acheteurs, lieux de dépôt et séries — sur le même dossier de
 * documents Markdown que les œuvres.
 *
 * Le type de carnet ne change que le dossier ; la persistance, elle, est
 * celle de `collection.ts`.
 */
function collection(type: TypeCarnet): Collection<Fiche> {
  return {
    dossier: DOSSIER_CARNET[type],
    lire: lireFiche,
    ecrire: ecrireFiche,
    nommer: (f) => nomFichierFiche(f.nom)
  }
}

export async function listerFiches(racine: string, type: TypeCarnet): Promise<Fiche[]> {
  // Les échecs sont ignorés : un carnet n'est pas le catalogue, et le nom
  // reste de toute façon présent sur les œuvres qui le citent.
  const { valeurs } = await lireTout(racine, collection(type))
  return valeurs.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

export async function enregistrerFiche(racine: string, type: TypeCarnet, fiche: Fiche): Promise<Fiche> {
  const fichier = await poser(racine, collection(type), fiche, fiche.fichier)
  return { ...fiche, fichier }
}

/**
 * Crée les fiches manquantes pour les noms cités par une œuvre.
 *
 * C'est ce qui rend le carnet vivant : saisir « Galerie Nord » sur un tableau
 * suffit à lui ouvrir une fiche. Rien n'est écrasé — une fiche déjà remplie
 * garde ses coordonnées.
 */
export async function assurerFiches(racine: string, type: TypeCarnet, noms: string[]): Promise<void> {
  const aCreer = noms.map((n) => n.trim()).filter((n) => n !== '')
  if (aCreer.length === 0) return

  // Le catalogue entier peut être passé d'un coup : deux œuvres du même
  // acheteur ne doivent pas écrire sa fiche deux fois.
  const vus = (await listerFiches(racine, type)).map((f) => f.nom)
  for (const nom of aCreer) {
    if (vus.some((autre) => memeNom(autre, nom))) continue
    vus.push(nom)
    await poser(racine, collection(type), ficheVide(nom), null)
  }
}

export async function supprimerFiche(racine: string, type: TypeCarnet, nom: string): Promise<void> {
  const existante = (await listerFiches(racine, type)).find((f) => memeNom(f.nom, nom))
  if (existante !== undefined) await corbeille(racine, existante.fichier)
}
