import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { Fiche, TypeCarnet } from '@shared/carnet'
import { nomRattache } from '@shared/carnet'
import type { Atelier, BrouillonTableau, Catalogue, EtatAtelier, Preferences, Tableau } from '@shared/types'
import {
  ecrireAtelier,
  ecrireCheminAtelier,
  ecrirePreferences,
  lireCheminAtelier,
  lirePreferences,
  ouvrirAtelier
} from './atelier/config'
import {
  creerTableau,
  enregistrerTableau,
  listerTableaux,
  majPhotos,
  revelerTableau,
  supprimerTableau,
  trouverTableau
} from './atelier/depot'
import { assurerFiches, enregistrerFiche, listerFiches, supprimerFiche } from './atelier/carnet'
import { importerPhotos, retirerPhoto } from './atelier/photos'
import { appliquerZoom } from './zoom'
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

async function charger(chemin: string, nomPropose?: string): Promise<EtatAtelier> {
  atelier = await ouvrirAtelier(chemin, nomPropose)
  racine = chemin
  await ecrireCheminAtelier(chemin)
  await reconcilierCarnets(chemin)
  return etat()
}

/**
 * Ouvre une fiche à tout nom cité par le catalogue mais absent du carnet.
 *
 * L'alimentation courante se fait à l'écriture d'une œuvre, ce qui ne couvre
 * pas les tableaux déjà saisis avant l'arrivée des carnets, ni un dossier
 * rempli à la main. Une passe à l'ouverture rattrape les deux, sans jamais
 * toucher aux fiches existantes.
 */
async function reconcilierCarnets(chemin: string): Promise<void> {
  try {
    const { tableaux } = await listerTableaux(chemin)
    for (const type of ['acheteurs', 'depots'] as const) {
      await assurerFiches(
        chemin,
        type,
        tableaux.map((t) => nomRattache(t, type))
      )
    }
  } catch {
    // Un carnet incomplet ne doit pas empêcher d'ouvrir l'atelier.
  }
}

/** Demande un dossier et l'ouvre. Rend l'état inchangé si l'artiste annule. */
async function demanderDossier(titre: string, bouton: string, nomPropose?: string): Promise<EtatAtelier> {
  const f = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const options = {
    title: titre,
    buttonLabel: bouton,
    properties: ['openDirectory' as const, 'createDirectory' as const]
  }
  const choix = f ? await dialog.showOpenDialog(f, options) : await dialog.showOpenDialog(options)
  const chemin = choix.canceled ? undefined : choix.filePaths[0]
  if (chemin === undefined) return etat()
  return charger(chemin, nomPropose)
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

  ipcMain.handle('atelier:choisir', (): Promise<EtatAtelier> =>
    demanderDossier('Choisissez le dossier de votre atelier', 'Ouvrir cet atelier')
  )

  ipcMain.handle('atelier:creer', (_e, nom: unknown): Promise<EtatAtelier> =>
    demanderDossier('Où ranger votre atelier ?', 'Créer ici', texte(nom))
  )

  ipcMain.handle('atelier:renommer', async (_e, nom: unknown, prefixe: unknown): Promise<EtatAtelier> => {
    const base = exigerRacine()
    if (atelier === null) throw new Error('Aucun atelier ouvert')

    const nouveauNom = texte(nom).trim()
    const nouveauPrefixe = texte(prefixe).trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (nouveauNom === '') throw new Error('Le nom ne peut pas être vide')

    // Le préfixe ne vaut que pour les références futures : renommer l'artiste
    // ne doit pas invalider les références déjà peintes au dos des toiles.
    atelier = {
      ...atelier,
      artiste: nouveauNom,
      prefixeRef: nouveauPrefixe === '' ? atelier.prefixeRef : nouveauPrefixe
    }
    await ecrireAtelier(base, atelier)
    return etat()
  })

  ipcMain.handle('preferences:lire', (): Promise<Preferences> => lirePreferences())

  ipcMain.handle('vue:zoom', async (_e, niveau: unknown): Promise<number> => {
    const f = fenetre()
    if (f === null) return 0
    return appliquerZoom(f, typeof niveau === 'number' ? niveau : 0)
  })

  ipcMain.handle('preferences:ecrire', (_e, p: unknown): Promise<void> =>
    ecrirePreferences(p as Preferences)
  )

  ipcMain.handle('atelier:ouvrir-dossier', async (): Promise<void> => {
    if (racine !== null) await shell.openPath(racine)
  })

  ipcMain.handle('carnet:lister', (_e, type: unknown): Promise<Fiche[]> =>
    listerFiches(exigerRacine(), type as TypeCarnet)
  )

  ipcMain.handle('carnet:enregistrer', (_e, type: unknown, fiche: unknown): Promise<Fiche> =>
    enregistrerFiche(exigerRacine(), type as TypeCarnet, fiche as Fiche)
  )

  ipcMain.handle('carnet:supprimer', (_e, type: unknown, nom: unknown): Promise<void> =>
    supprimerFiche(exigerRacine(), type as TypeCarnet, texte(nom))
  )

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
