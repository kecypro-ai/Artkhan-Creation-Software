import { nomRattache } from '@shared/carnet'
import { ecrireTableau, lireTableau, nomFichier } from '@shared/document'
import { composerRef, numeroDe, refComplete } from '@shared/reference'
import type { Atelier, BrouillonTableau, Catalogue, Tableau } from '@shared/types'
import { assurerFiches } from './carnet'
import { DOSSIER_TABLEAUX } from './chemins'
import { corbeille, lireTout, poser, type Collection } from './collection'
import { ecrireAtelier } from './config'

const OEUVRES: Collection<Tableau> = {
  dossier: DOSSIER_TABLEAUX,
  lire: lireTableau,
  ecrire: ecrireTableau,
  // Le nom porte la référence complète, série comprise : le dossier reste
  // lisible dans un explorateur sans ouvrir l'application.
  nommer: (t) => nomFichier(refComplete(t), t.titre)
}

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function listerTableaux(racine: string): Promise<Catalogue> {
  const { valeurs, echecs } = await lireTout(racine, OEUVRES)

  return {
    tableaux: valeurs,
    anomalies: {
      sansPhoto: valeurs.filter((t) => t.photos.length === 0).length,
      sansAnnee: valeurs.filter((t) => t.annee === null).length
    },
    echecs
  }
}

export async function trouverTableau(racine: string, ref: string): Promise<Tableau | null> {
  const { tableaux } = await listerTableaux(racine)
  return tableaux.find((t) => t.ref === ref) ?? null
}

/**
 * Attribue la prochaine référence libre.
 *
 * Le compteur enregistré sert de point de départ, mais c'est le contenu réel
 * du dossier qui tranche : l'artiste peut avoir supprimé, restauré ou copié
 * des fichiers entre deux lancements. Les numéros sont comparés comme des
 * nombres et non comme du texte — « CK-031 » et « CK-0031 » sont deux
 * écritures du même numéro, et deux toiles ne peuvent pas le partager.
 */
async function prochaineRef(racine: string, atelier: Atelier): Promise<{ ref: string; atelier: Atelier }> {
  const { tableaux } = await listerTableaux(racine)

  let numero = atelier.prochainNumero
  for (const t of tableaux) {
    const n = numeroDe(t.ref, atelier.prefixeRef)
    if (n !== null && n >= numero) numero = n + 1
  }

  const suivant: Atelier = { ...atelier, prochainNumero: numero + 1 }
  await ecrireAtelier(racine, suivant)
  return { ref: composerRef(atelier.prefixeRef, numero), atelier: suivant }
}

/** Écrit l'œuvre, puis ouvre au carnet les fiches des noms qu'elle cite. */
async function enregistrer(racine: string, tableau: Tableau, ancienFichier: string | null): Promise<Tableau> {
  const fichier = await poser(racine, OEUVRES, tableau, ancienFichier)
  const complet: Tableau = { ...tableau, fichier }

  // Point d'appel unique : toute écriture d'œuvre passe ici, donc aucun nom
  // saisi ne peut échapper au carnet.
  for (const type of ['acheteurs', 'depots', 'series'] as const) {
    await assurerFiches(racine, type, [nomRattache(complet, type)])
  }

  return complet
}

function composer(ref: string, brouillon: BrouillonTableau, cree: string): Tableau {
  return { ...brouillon, ref, cree, modifie: aujourdhui(), fichier: '' }
}

export async function creerTableau(
  racine: string,
  atelier: Atelier,
  brouillon: BrouillonTableau
): Promise<{ tableau: Tableau; atelier: Atelier }> {
  const suite = await prochaineRef(racine, atelier)
  const tableau = await enregistrer(racine, composer(suite.ref, brouillon, aujourdhui()), null)
  return { tableau, atelier: suite.atelier }
}

export async function enregistrerTableau(racine: string, ref: string, brouillon: BrouillonTableau): Promise<Tableau> {
  const existant = await trouverTableau(racine, ref)
  if (existant === null) throw new Error(`Tableau introuvable : ${ref}`)
  return enregistrer(racine, composer(ref, brouillon, existant.cree || aujourdhui()), existant.fichier)
}

export async function supprimerTableau(racine: string, ref: string): Promise<void> {
  const existant = await trouverTableau(racine, ref)
  if (existant !== null) await corbeille(racine, existant.fichier)
}

export async function majPhotos(racine: string, ref: string, photos: string[]): Promise<Tableau> {
  const existant = await trouverTableau(racine, ref)
  if (existant === null) throw new Error(`Tableau introuvable : ${ref}`)
  return enregistrer(racine, { ...existant, photos, modifie: aujourdhui() }, existant.fichier)
}
