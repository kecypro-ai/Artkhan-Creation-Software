import type { Tableau } from './types'

/**
 * Mise en mots d'une œuvre, écrite une fois pour toutes.
 *
 * La carte, la liste, la fiche d'un acheteur et le certificat parlaient
 * chacun des mêmes données dans leurs propres termes : « 2021 » ici, « vers
 * 2021 » là, un tiret ailleurs. Une œuvre doit se lire pareil partout, sans
 * quoi l'artiste doute de ce qu'il voit.
 */

const ABSENT = '—'

export function anneeTexte(t: Pick<Tableau, 'annee' | 'certitude'>, absent = ABSENT): string {
  if (t.annee === null) return absent
  return t.certitude === 'approximative' ? `vers ${t.annee}` : String(t.annee)
}

export function dimensionsTexte(
  t: Pick<Tableau, 'hauteur' | 'largeur'>,
  { absent = ABSENT, unite = 'cm' } = {}
): string {
  if (t.hauteur === null || t.largeur === null) return absent
  return `${t.hauteur} × ${t.largeur}${unite === '' ? '' : ` ${unite}`}`
}

export function titreTexte(t: Pick<Tableau, 'titre'>): string {
  return t.titre.trim() === '' ? 'Sans titre' : t.titre.trim()
}

export function sansTitre(t: Pick<Tableau, 'titre'>): boolean {
  return t.titre.trim() === ''
}

/**
 * Résumé d'une ligne, qui nomme les trous plutôt que de les masquer.
 *
 * « Année à vérifier » est une information utile ; une case vide ne l'est pas.
 */
export function resumeOeuvre(t: Tableau, { avecPhoto = true } = {}): string {
  const morceaux: string[] = [t.annee === null ? 'Année à vérifier' : anneeTexte(t)]

  const dimensions = dimensionsTexte(t, { absent: '' })
  if (dimensions !== '') morceaux.push(dimensions)
  if (avecPhoto && t.photos.length === 0) morceaux.push('photo manquante')

  return morceaux.join(' · ')
}
