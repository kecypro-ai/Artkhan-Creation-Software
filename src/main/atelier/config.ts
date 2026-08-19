import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import type { Atelier } from '@shared/types'
import { DOSSIER_INTERNE, DOSSIER_PHOTOS, DOSSIER_TABLEAUX, DOSSIER_VIGNETTES, FICHIER_ATELIER } from './chemins'

/**
 * Deux configurations, à deux endroits, pour deux raisons.
 *
 * Le chemin du dossier d'atelier appartient à la machine : il vit dans les
 * données applicatives. Tout le reste appartient à l'atelier lui-même et vit
 * dans le dossier, pour suivre l'artiste s'il le déplace ou le sauvegarde.
 */

interface ConfigMachine {
  chemin: string | null
}

function fichierMachine(): string {
  return join(app.getPath('userData'), 'config.json')
}

export async function lireCheminAtelier(): Promise<string | null> {
  try {
    const brut = await readFile(fichierMachine(), 'utf8')
    const config: unknown = JSON.parse(brut)
    if (config !== null && typeof config === 'object' && 'chemin' in config) {
      const c = (config as ConfigMachine).chemin
      return typeof c === 'string' && c !== '' ? c : null
    }
  } catch {
    // Première ouverture, ou fichier abîmé : on repart d'un atelier non choisi.
  }
  return null
}

export async function ecrireCheminAtelier(chemin: string | null): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  const config: ConfigMachine = { chemin }
  await writeFileAtomic(fichierMachine(), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

function initiales(nom: string): string {
  const lettres = nom
    .split(/\s+/)
    .filter((mot) => mot !== '')
    .map((mot) => mot[0] ?? '')
    .join('')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return lettres.slice(0, 3) || 'ART'
}

function normaliserAtelier(brut: unknown, nomDefaut: string): Atelier {
  const o = brut !== null && typeof brut === 'object' ? (brut as Record<string, unknown>) : {}
  const artiste = typeof o['artiste'] === 'string' && o['artiste'].trim() !== '' ? o['artiste'].trim() : nomDefaut
  const prefixe =
    typeof o['prefixeRef'] === 'string' && o['prefixeRef'].trim() !== ''
      ? o['prefixeRef'].trim().toUpperCase()
      : initiales(artiste)
  const numero = typeof o['prochainNumero'] === 'number' && o['prochainNumero'] > 0 ? Math.floor(o['prochainNumero']) : 1
  return { artiste, prefixeRef: prefixe, prochainNumero: numero }
}

/** Prépare l'arborescence si besoin et rend la configuration de l'atelier. */
export async function ouvrirAtelier(racine: string): Promise<Atelier> {
  for (const dossier of [DOSSIER_TABLEAUX, DOSSIER_PHOTOS, DOSSIER_INTERNE, DOSSIER_VIGNETTES]) {
    await mkdir(join(racine, dossier), { recursive: true })
  }

  let brut: unknown = null
  try {
    brut = JSON.parse(await readFile(join(racine, FICHIER_ATELIER), 'utf8'))
  } catch {
    // Dossier neuf, ou fichier illisible : les valeurs par défaut suffisent.
  }

  const atelier = normaliserAtelier(brut, 'Atelier')
  await ecrireAtelier(racine, atelier)
  return atelier
}

export async function ecrireAtelier(racine: string, atelier: Atelier): Promise<void> {
  await mkdir(join(racine, DOSSIER_INTERNE), { recursive: true })
  await writeFileAtomic(join(racine, FICHIER_ATELIER), `${JSON.stringify(atelier, null, 2)}\n`, 'utf8')
}
