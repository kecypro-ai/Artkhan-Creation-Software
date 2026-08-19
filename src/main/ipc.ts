import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { Atelier, BrouillonTableau, Catalogue, EtatAtelier, Tableau } from '@shared/types'
import { ecrireCheminAtelier, lireCheminAtelier, ouvrirAtelier } from './atelier/config'
import {
  creerTableau,
  enregistrerTableau,
  listerTableaux,
  majPhotos,
  revelerTableau,
  supprimerTableau,
  trouverTableau
} from './atelier/depot'
import { importerPhotos, retirerPhoto } from './atelier/photos'
import { diagnostiquerSharp } from './thumbs/diag'

let racine: string | null = null
let atelier: Atelier | null = null

export function racineCourante(): string | null {
  return racine
}

function etat(): EtatAtelier {
  return { chemin: racine, atelier }
}

/** Toute opération sur le catalogue exige un atelier ouvert. */
function exigerRacine(): string {
  if (racine === null) throw new Error('Aucun atelier ouvert')
  return racine
}

function texte(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

async function charger(chemin: string): Promise<EtatAtelier> {
  atelier = await ouvrirAtelier(chemin)
  racine = chemin
  await ecrireCheminAtelier(chemin)
  return etat()
}

/**
 * Rouvre l'atelier de la session précédente, si son dossier existe encore.
 *
 * Un dossier déplacé ou sur un disque externe débranché ne doit pas bloquer
 * le démarrage : l'application repart sur l'écran de choix.
 */
export async function restaurerAtelier(): Promise<void> {
  const memorise = await lireCheminAtelier()
  if (memorise === null) return
  try {
    await charger(memorise)
  } catch {
    racine = null
    atelier = null
  }
}

export function brancherIpc(): void {
  const fenetre = (): BrowserWindow | null => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null

  ipcMain.handle('diag:sharp', (_e, chemin: unknown) =>
    typeof chemin === 'string'
      ? diagnostiquerSharp(chemin, process.env['NODE_ENV'] !== 'development')
      : Promise.resolve({ ok: false as const, erreur: 'Chemin invalide', empaquete: true })
  )

  ipcMain.handle('atelier:etat', (): EtatAtelier => etat())

  ipcMain.handle('atelier:choisir', async (): Promise<EtatAtelier> => {
    const f = fenetre()
    const options = {
      title: 'Choisissez le dossier de votre atelier',
      buttonLabel: 'Ouvrir cet atelier',
      properties: ['openDirectory' as const, 'createDirectory' as const]
    }
    const choix = f ? await dialog.showOpenDialog(f, options) : await dialog.showOpenDialog(options)
    const chemin = choix.canceled ? undefined : choix.filePaths[0]
    if (chemin === undefined) return etat()
    return charger(chemin)
  })

  ipcMain.handle('atelier:ouvrir-dossier', async (): Promise<void> => {
    if (racine !== null) await shell.openPath(racine)
  })

  ipcMain.handle('tableaux:lister', (): Promise<Catalogue> => listerTableaux(exigerRacine()))

  ipcMain.handle('tableaux:creer', async (_e, brouillon: unknown): Promise<Tableau> => {
    const base = exigerRacine()
    if (atelier === null) throw new Error('Aucun atelier ouvert')
    const resultat = await creerTableau(base, atelier, brouillon as BrouillonTableau)
    atelier = resultat.atelier
    return resultat.tableau
  })

  ipcMain.handle(
    'tableaux:enregistrer',
    (_e, ref: unknown, brouillon: unknown): Promise<Tableau> =>
      enregistrerTableau(exigerRacine(), texte(ref), brouillon as BrouillonTableau)
  )

  ipcMain.handle('tableaux:supprimer', (_e, ref: unknown): Promise<void> =>
    supprimerTableau(exigerRacine(), texte(ref))
  )

  ipcMain.handle('tableaux:reveler', (_e, ref: unknown): Promise<void> =>
    revelerTableau(exigerRacine(), texte(ref))
  )

  ipcMain.handle('photos:importer', async (_e, ref: unknown): Promise<Tableau> => {
    const base = exigerRacine()
    const r = texte(ref)
    const existant = await trouverTableau(base, r)
    if (existant === null) throw new Error(`Tableau introuvable : ${r}`)

    const ajoutees = await importerPhotos(base, r, fenetre())
    if (ajoutees.length === 0) return existant
    return majPhotos(base, r, [...existant.photos, ...ajoutees])
  })

  ipcMain.handle('photos:retirer', async (_e, ref: unknown, photo: unknown): Promise<Tableau> => {
    const base = exigerRacine()
    const r = texte(ref)
    const p = texte(photo)
    const existant = await trouverTableau(base, r)
    if (existant === null) throw new Error(`Tableau introuvable : ${r}`)

    await retirerPhoto(base, p)
    return majPhotos(
      base,
      r,
      existant.photos.filter((autre) => autre !== p)
    )
  })
}
