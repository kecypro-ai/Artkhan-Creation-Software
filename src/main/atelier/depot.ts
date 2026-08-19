import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { shell } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import { ecrireTableau, lireTableau, nomFichier } from '@shared/document'
import type { Atelier, BrouillonTableau, Catalogue, Tableau } from '@shared/types'
import { DOSSIER_TABLEAUX, dansAtelier } from './chemins'
import { ecrireAtelier } from './config'

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10)
}

async function fichiersMarkdown(racine: string): Promise<string[]> {
  try {
    const entrees = await readdir(join(racine, DOSSIER_TABLEAUX), { withFileTypes: true })
    return entrees
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, 'fr'))
  } catch {
    return []
  }
}

export async function listerTableaux(racine: string): Promise<Catalogue> {
  const tableaux: Tableau[] = []
  const echecs: Catalogue['echecs'] = []

  for (const nom of await fichiersMarkdown(racine)) {
    const relatif = `${DOSSIER_TABLEAUX}/${nom}`
    try {
      const brut = await readFile(join(racine, DOSSIER_TABLEAUX, nom), 'utf8')
      // Une œuvre dont l'en-tête a perdu sa référence reste identifiable par
      // son nom de fichier : mieux vaut une référence de secours qu'un trou.
      tableaux.push(lireTableau(brut, relatif, nom.replace(/\.md$/i, '')))
    } catch (e) {
      echecs.push({ fichier: relatif, erreur: e instanceof Error ? e.message : String(e) })
    }
  }

  return {
    tableaux,
    anomalies: {
      sansPhoto: tableaux.filter((t) => t.photos.length === 0).length,
      sansAnnee: tableaux.filter((t) => t.annee === null).length
    },
    echecs
  }
}

async function trouver(racine: string, ref: string): Promise<Tableau | null> {
  const { tableaux } = await listerTableaux(racine)
  return tableaux.find((t) => t.ref === ref) ?? null
}

/**
 * Attribue la prochaine référence libre.
 *
 * Le compteur enregistré sert de point de départ, mais c'est le contenu réel
 * du dossier qui tranche : l'artiste peut avoir supprimé, restauré ou copié
 * des fichiers entre deux lancements, et deux œuvres ne doivent jamais
 * partager une référence.
 */
async function prochaineRef(racine: string, atelier: Atelier): Promise<{ ref: string; atelier: Atelier }> {
  const prises = new Set((await listerTableaux(racine)).tableaux.map((t) => t.ref))
  let numero = atelier.prochainNumero
  let ref = ''
  do {
    ref = `${atelier.prefixeRef}-${String(numero).padStart(3, '0')}`
    numero += 1
  } while (prises.has(ref))

  const suivant: Atelier = { ...atelier, prochainNumero: numero }
  await ecrireAtelier(racine, suivant)
  return { ref, atelier: suivant }
}

function composer(ref: string, brouillon: BrouillonTableau, cree: string): Tableau {
  return { ...brouillon, ref, cree, modifie: aujourdhui(), fichier: '' }
}

async function poser(racine: string, tableau: Tableau, ancienFichier: string | null): Promise<Tableau> {
  const relatif = `${DOSSIER_TABLEAUX}/${nomFichier(tableau.ref, tableau.titre)}`
  const absolu = dansAtelier(racine, relatif)
  if (absolu === null) throw new Error(`Chemin refusé : ${relatif}`)

  const complet: Tableau = { ...tableau, fichier: relatif }
  await writeFileAtomic(absolu, ecrireTableau(complet), 'utf8')

  // Le titre a changé : le fichier suit, pour que le dossier reste lisible
  // sans l'application. Un échec de renommage n'est pas grave — la référence
  // dans l'en-tête reste l'identité de l'œuvre.
  if (ancienFichier !== null && ancienFichier !== relatif) {
    const ancien = dansAtelier(racine, ancienFichier)
    if (ancien !== null) {
      try {
        await shell.trashItem(ancien)
      } catch {
        /* Le fichier périmé restera ; il sera relu sous la même référence. */
      }
    }
  }

  return complet
}

export async function creerTableau(
  racine: string,
  atelier: Atelier,
  brouillon: BrouillonTableau
): Promise<{ tableau: Tableau; atelier: Atelier }> {
  const suite = await prochaineRef(racine, atelier)
  const tableau = await poser(racine, composer(suite.ref, brouillon, aujourdhui()), null)
  return { tableau, atelier: suite.atelier }
}

export async function enregistrerTableau(
  racine: string,
  ref: string,
  brouillon: BrouillonTableau
): Promise<Tableau> {
  const existant = await trouver(racine, ref)
  if (existant === null) throw new Error(`Tableau introuvable : ${ref}`)
  return poser(racine, composer(ref, brouillon, existant.cree || aujourdhui()), existant.fichier)
}

/** Passe le fichier à la corbeille : une suppression doit rester réversible. */
export async function supprimerTableau(racine: string, ref: string): Promise<void> {
  const existant = await trouver(racine, ref)
  if (existant === null) return
  const absolu = dansAtelier(racine, existant.fichier)
  if (absolu !== null) await shell.trashItem(absolu)
}

export async function revelerTableau(racine: string, ref: string): Promise<void> {
  const existant = await trouver(racine, ref)
  if (existant === null) return
  const absolu = dansAtelier(racine, existant.fichier)
  if (absolu !== null) shell.showItemInFolder(absolu)
}

export async function majPhotos(racine: string, ref: string, photos: string[]): Promise<Tableau> {
  const existant = await trouver(racine, ref)
  if (existant === null) throw new Error(`Tableau introuvable : ${ref}`)
  return poser(racine, { ...existant, photos, modifie: aujourdhui() }, existant.fichier)
}

export { trouver as trouverTableau }
