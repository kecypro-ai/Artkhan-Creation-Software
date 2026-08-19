import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { BrowserWindow, dialog, shell } from 'electron'
import { DOSSIER_PHOTOS, dansAtelier } from './chemins'

const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff', 'heic', 'avif']

function assainir(nom: string): string {
  return nom
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Copie les photos choisies dans l'atelier plutôt que d'y pointer.
 *
 * Une référence vers un fichier resté sur le bureau ou une carte SD casse au
 * premier rangement. Le dossier doit être complet et déplaçable d'un bloc :
 * l'original n'est jamais touché ni déplacé.
 */
export async function importerPhotos(
  racine: string,
  ref: string,
  fenetre: BrowserWindow | null
): Promise<string[]> {
  const choix = fenetre
    ? await dialog.showOpenDialog(fenetre, {
        title: `Photos de ${ref}`,
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: EXTENSIONS }]
      })
    : await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: EXTENSIONS }]
      })

  if (choix.canceled || choix.filePaths.length === 0) return []

  const dossier = `${DOSSIER_PHOTOS}/${ref}`
  const absoluDossier = dansAtelier(racine, dossier)
  if (absoluDossier === null) throw new Error(`Chemin refusé : ${dossier}`)
  await mkdir(absoluDossier, { recursive: true })

  const deja = new Set(await readdir(absoluDossier).catch(() => [] as string[]))
  const ajoutees: string[] = []

  for (const source of choix.filePaths) {
    const ext = extname(source).toLowerCase() || '.jpg'
    const base = assainir(basename(source, extname(source))) || 'photo'

    // Ne jamais écraser une photo déjà présente : deux fichiers peuvent
    // porter le même nom sans montrer la même chose.
    let nom = `${base}${ext}`
    let n = 2
    while (deja.has(nom)) {
      nom = `${base} (${n})${ext}`
      n += 1
    }
    deja.add(nom)

    await copyFile(source, join(absoluDossier, nom))
    ajoutees.push(`${dossier}/${nom}`)
  }

  return ajoutees
}

/** Retire une photo du tableau et l'envoie à la corbeille, jamais au néant. */
export async function retirerPhoto(racine: string, photo: string): Promise<void> {
  const absolu = dansAtelier(racine, photo)
  if (absolu === null) return
  try {
    await shell.trashItem(absolu)
  } catch {
    // Fichier déjà disparu : le retirer de l'en-tête suffit.
  }
}
