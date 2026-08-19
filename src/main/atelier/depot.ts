import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { shell } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import { nomRattache } from '@shared/carnet'
import { ecrireTableau, lireTableau, nomFichier } from '@shared/document'
import { composerRef, numeroDe, refComplete } from '@shared/reference'
import type { Atelier, BrouillonTableau, Catalogue, Tableau } from '@shared/types'
import { assurerFiches } from './carnet'
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
  const { tableaux } = await listerTableaux(racine)

  // On repart du plus grand numéro réellement utilisé, et non du seul compteur
  // enregistré. Comparer les numéros plutôt que les textes est indispensable
  // depuis l'élargissement à quatre chiffres : « CK-031 » et « CK-0031 » sont
  // deux écritures du même numéro, et deux toiles ne peuvent pas le partager.
  let numero = atelier.prochainNumero
  for (const t of tableaux) {
    const n = numeroDe(t.ref, atelier.prefixeRef)
    if (n !== null && n >= numero) numero = n + 1
  }

  const suivant: Atelier = { ...atelier, prochainNumero: numero + 1 }
  await ecrireAtelier(racine, suivant)
  return { ref: composerRef(atelier.prefixeRef, numero), atelier: suivant }
}

function composer(ref: string, brouillon: BrouillonTableau, cree: string): Tableau {
  return { ...brouillon, ref, cree, modifie: aujourdhui(), fichier: '' }
}

async function poser(racine: string, tableau: Tableau, ancienFichier: string | null): Promise<Tableau> {
  const relatif = `${DOSSIER_TABLEAUX}/${nomFichier(refComplete(tableau), tableau.titre)}`
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

  // Un nom saisi sur une œuvre ouvre sa fiche au carnet. C'est le seul point
  // d'appel : toute écriture d'œuvre passe ici.
  await assurerFiches(racine, 'acheteurs', [nomRattache(complet, 'acheteurs')])
  await assurerFiches(racine, 'depots', [nomRattache(complet, 'depots')])
  await assurerFiches(racine, 'series', [nomRattache(complet, 'series')])

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
