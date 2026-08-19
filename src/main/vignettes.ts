import { createHash } from 'node:crypto'
import { mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { DOSSIER_VIGNETTES, dansAtelier } from './atelier/chemins'

export const LARGEUR_VIGNETTE = 480

/**
 * Fabrique et conserve les vignettes hors de la vue de l'artiste.
 *
 * Une photo d'atelier pèse 20 Mo ; en afficher trois cents d'un coup est
 * impossible. La vignette est calculée une fois puis relue, et le cache vit
 * dans un dossier caché de l'atelier : il se reconstruit tout seul si on
 * l'efface, et il suit le dossier lors d'une sauvegarde sans l'alourdir.
 *
 * La clé inclut la taille et la date du fichier source : retoucher une photo
 * en gardant son nom régénère la vignette sans intervention.
 */
export async function vignette(racine: string, photo: string): Promise<string | null> {
  const source = dansAtelier(racine, photo)
  if (source === null) return null

  let empreinte: string
  try {
    const info = await stat(source)
    if (!info.isFile()) return null
    empreinte = createHash('sha1')
      .update(`${photo}|${info.size}|${Math.round(info.mtimeMs)}|${LARGEUR_VIGNETTE}`)
      .digest('hex')
  } catch {
    return null
  }

  const dossier = join(racine, DOSSIER_VIGNETTES)
  const cible = join(dossier, `${empreinte}.webp`)

  try {
    await stat(cible)
    return cible
  } catch {
    // Absente du cache : on la fabrique.
  }

  try {
    await mkdir(dossier, { recursive: true })
    await sharp(source, { limitInputPixels: 512e6 })
      // Sans rotate(), une photo prise à la verticale s'affiche couchée.
      .rotate()
      .resize({ width: LARGEUR_VIGNETTE, height: LARGEUR_VIGNETTE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(cible)
    return cible
  } catch {
    // Fichier illisible ou format exotique : la carte affichera son cadre vide.
    return null
  }
}
