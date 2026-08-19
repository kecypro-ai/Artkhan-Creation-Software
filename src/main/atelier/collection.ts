import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { shell } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import { dansAtelier } from './chemins'

/**
 * Un dossier de documents Markdown, lu et écrit toujours de la même façon.
 *
 * Œuvres et fiches de carnet ne diffèrent que par leur dossier et leur
 * grammaire ; leur persistance, elle, est identique — lecture tolérante,
 * écriture atomique, renommage qui suit le nom affiché, suppression par la
 * corbeille. Ce module la porte une seule fois, pour qu'un défaut corrigé le
 * soit partout.
 */
export interface Collection<T> {
  dossier: string
  /** Rend l'objet, ou lève : un fichier illisible est signalé, pas deviné. */
  lire: (brut: string, fichier: string, nomSecours: string) => T
  ecrire: (valeur: T) => string
  /** Nom de fichier voulu pour cet objet, extension comprise. */
  nommer: (valeur: T) => string
}

export interface Echec {
  fichier: string
  erreur: string
}

async function nomsMarkdown(racine: string, dossier: string): Promise<string[]> {
  try {
    const entrees = await readdir(join(racine, dossier), { withFileTypes: true })
    return entrees
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, 'fr'))
  } catch {
    // Dossier absent : un atelier neuf n'a pas encore de quoi lire.
    return []
  }
}

export async function lireTout<T>(
  racine: string,
  collection: Collection<T>
): Promise<{ valeurs: T[]; echecs: Echec[] }> {
  const valeurs: T[] = []
  const echecs: Echec[] = []

  for (const nom of await nomsMarkdown(racine, collection.dossier)) {
    const relatif = `${collection.dossier}/${nom}`
    try {
      const brut = await readFile(join(racine, collection.dossier, nom), 'utf8')
      // Le nom de fichier sert de secours : un document dont l'en-tête a perdu
      // son identité reste identifiable plutôt que de devenir un trou.
      valeurs.push(collection.lire(brut, relatif, nom.replace(/\.md$/i, '')))
    } catch (e) {
      echecs.push({ fichier: relatif, erreur: e instanceof Error ? e.message : String(e) })
    }
  }

  return { valeurs, echecs }
}

/**
 * Écrit le document et, si son nom a changé, retire l'ancien fichier.
 *
 * Le renommage garde le dossier lisible sans l'application. Son échec n'est
 * pas grave : l'identité vit dans l'en-tête, pas dans le nom du fichier, et
 * le document à jour est déjà écrit.
 */
export async function poser<T>(
  racine: string,
  collection: Collection<T>,
  valeur: T,
  ancienFichier: string | null
): Promise<string> {
  const relatif = `${collection.dossier}/${collection.nommer(valeur)}`
  const absolu = dansAtelier(racine, relatif)
  if (absolu === null) throw new Error(`Chemin refusé : ${relatif}`)

  await mkdir(join(racine, collection.dossier), { recursive: true })
  await writeFileAtomic(absolu, collection.ecrire(valeur), 'utf8')

  if (ancienFichier !== null && ancienFichier !== '' && ancienFichier !== relatif) {
    await corbeille(racine, ancienFichier)
  }

  return relatif
}

/** Toute suppression passe par la corbeille du système, jamais par unlink. */
export async function corbeille(racine: string, fichier: string): Promise<void> {
  const absolu = dansAtelier(racine, fichier)
  if (absolu === null) return
  try {
    await shell.trashItem(absolu)
  } catch {
    // Fichier déjà disparu : le but est atteint.
  }
}
