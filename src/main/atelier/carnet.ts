import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { shell } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import type { Fiche, TypeCarnet } from '@shared/carnet'
import { DOSSIER_CARNET, ecrireFiche, ficheVide, lireFiche, memeNom, nomFichierFiche } from '@shared/carnet'
import { dansAtelier } from './chemins'

/**
 * Lecture et écriture des carnets, sur le même modèle que les tableaux.
 *
 * Le type de carnet ne change que le dossier : tout le reste est commun, y
 * compris la tolérance aux fichiers abîmés et le passage par la corbeille.
 */

async function fichiers(racine: string, type: TypeCarnet): Promise<string[]> {
  try {
    const entrees = await readdir(join(racine, DOSSIER_CARNET[type]), { withFileTypes: true })
    return entrees
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, 'fr'))
  } catch {
    return []
  }
}

export async function listerFiches(racine: string, type: TypeCarnet): Promise<Fiche[]> {
  const dossier = DOSSIER_CARNET[type]
  const fiches: Fiche[] = []

  for (const nom of await fichiers(racine, type)) {
    try {
      const brut = await readFile(join(racine, dossier, nom), 'utf8')
      fiches.push(lireFiche(brut, `${dossier}/${nom}`, nom.replace(/\.md$/i, '')))
    } catch {
      // Fiche illisible : le carnet n'est pas le catalogue, on passe. Le nom
      // reste de toute façon présent sur les œuvres qui le citent.
    }
  }

  return fiches.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

async function poser(racine: string, type: TypeCarnet, fiche: Fiche): Promise<Fiche> {
  const relatif = `${DOSSIER_CARNET[type]}/${nomFichierFiche(fiche.nom)}`
  const absolu = dansAtelier(racine, relatif)
  if (absolu === null) throw new Error(`Chemin refusé : ${relatif}`)

  await mkdir(join(racine, DOSSIER_CARNET[type]), { recursive: true })
  const complete: Fiche = { ...fiche, fichier: relatif }
  await writeFileAtomic(absolu, ecrireFiche(complete), 'utf8')
  return complete
}

export async function enregistrerFiche(racine: string, type: TypeCarnet, fiche: Fiche): Promise<Fiche> {
  const pose = await poser(racine, type, fiche)

  // Le nom a changé : le fichier suit, pour que le dossier reste lisible sans
  // l'application. L'ancien part à la corbeille, jamais au néant.
  if (fiche.fichier !== '' && fiche.fichier !== pose.fichier) {
    const ancien = dansAtelier(racine, fiche.fichier)
    if (ancien !== null) {
      try {
        await shell.trashItem(ancien)
      } catch {
        /* Fichier déjà déplacé : la fiche à jour existe, c'est l'essentiel. */
      }
    }
  }

  return pose
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
    await poser(racine, type, ficheVide(nom))
  }
}

export async function supprimerFiche(racine: string, type: TypeCarnet, nom: string): Promise<void> {
  const existante = (await listerFiches(racine, type)).find((f) => memeNom(f.nom, nom))
  if (existante === undefined) return
  const absolu = dansAtelier(racine, existante.fichier)
  if (absolu !== null) await shell.trashItem(absolu)
}
