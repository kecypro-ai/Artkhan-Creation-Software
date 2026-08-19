import { mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import { DOSSIER_CARNET } from '@shared/carnet'
import type { Atelier, Preferences } from '@shared/types'
import { PREFERENCES_DEFAUT } from '@shared/types'
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
  preferences: Preferences
}

function fichierMachine(): string {
  return join(app.getPath('userData'), 'config.json')
}

async function lireMachine(): Promise<ConfigMachine> {
  try {
    const brut: unknown = JSON.parse(await readFile(fichierMachine(), 'utf8'))
    const o = brut !== null && typeof brut === 'object' ? (brut as Record<string, unknown>) : {}
    const chemin = typeof o['chemin'] === 'string' && o['chemin'] !== '' ? o['chemin'] : null
    const p = o['preferences']
    const preferences =
      p !== null && typeof p === 'object' ? { ...PREFERENCES_DEFAUT, ...(p as Preferences) } : PREFERENCES_DEFAUT
    return { chemin, preferences }
  } catch {
    // Première ouverture, ou fichier abîmé : on repart des valeurs par défaut.
    return { chemin: null, preferences: PREFERENCES_DEFAUT }
  }
}

async function ecrireMachine(config: ConfigMachine): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFileAtomic(fichierMachine(), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

export async function lireCheminAtelier(): Promise<string | null> {
  return (await lireMachine()).chemin
}

export async function ecrireCheminAtelier(chemin: string | null): Promise<void> {
  await ecrireMachine({ ...(await lireMachine()), chemin })
}

export async function lirePreferences(): Promise<Preferences> {
  return (await lireMachine()).preferences
}

export async function ecrirePreferences(preferences: Preferences): Promise<void> {
  await ecrireMachine({ ...(await lireMachine()), preferences })
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

/**
 * Prépare l'arborescence si besoin et rend la configuration de l'atelier.
 *
 * `nomPropose` vient de l'écran d'accueil du premier lancement. Il ne remplace
 * un nom déjà enregistré que s'il est fourni : rouvrir un atelier existant ne
 * doit pas en renommer l'artiste.
 */
export async function ouvrirAtelier(racine: string, nomPropose?: string): Promise<Atelier> {
  const dossiers = [DOSSIER_TABLEAUX, DOSSIER_PHOTOS, DOSSIER_INTERNE, DOSSIER_VIGNETTES, ...Object.values(DOSSIER_CARNET)]
  for (const dossier of dossiers) {
    await mkdir(join(racine, dossier), { recursive: true })
  }

  let brut: unknown = null
  try {
    brut = JSON.parse(await readFile(join(racine, FICHIER_ATELIER), 'utf8'))
  } catch {
    // Dossier neuf, ou fichier illisible : les valeurs par défaut suffisent.
  }

  const atelier = normaliserAtelier(brut, nomPropose ?? 'Atelier')
  const nomme =
    nomPropose !== undefined && nomPropose.trim() !== '' ? { ...atelier, artiste: nomPropose.trim() } : atelier
  await ecrireAtelier(racine, nomme)
  return nomme
}

export async function ecrireAtelier(racine: string, atelier: Atelier): Promise<void> {
  await mkdir(join(racine, DOSSIER_INTERNE), { recursive: true })
  await writeFileAtomic(join(racine, FICHIER_ATELIER), `${JSON.stringify(atelier, null, 2)}\n`, 'utf8')
}
