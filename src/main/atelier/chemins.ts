import { isAbsolute, relative, resolve, sep } from 'node:path'

export const DOSSIER_TABLEAUX = 'Tableaux'
export const DOSSIER_PHOTOS = 'Photos'
export const DOSSIER_INTERNE = '.artkhan'
export const DOSSIER_VIGNETTES = `${DOSSIER_INTERNE}/vignettes`
export const FICHIER_ATELIER = `${DOSSIER_INTERNE}/atelier.json`

/**
 * Résout un chemin relatif à l'intérieur du dossier d'atelier, ou rend null.
 *
 * Les chemins viennent en partie du renderer et en partie de fichiers écrits
 * à la main : aucun des deux n'est digne de confiance. Tout ce qui remonte
 * au-dessus de la racine est refusé plutôt que corrigé, pour que
 * l'application ne puisse jamais lire ni écrire ailleurs que dans l'atelier.
 */
export function dansAtelier(racine: string, relatif: string): string | null {
  if (relatif === '' || isAbsolute(relatif)) return null
  const absolu = resolve(racine, relatif)
  const rel = relative(racine, absolu)
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return null
  return absolu
}

/** Chemin relatif normalisé en séparateurs « / », pour tenir dans un fichier. */
export function versRelatif(racine: string, absolu: string): string {
  return relative(racine, absolu).split(sep).join('/')
}
