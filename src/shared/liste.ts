import type { ColonneTri, FiltreStatut, PorteeRecherche, SensTri, Statut, Tableau } from './types'
import { STATUTS } from './types'

/**
 * Tri, filtrage et comptage du catalogue.
 *
 * Fonctions pures, à l'écart de React et du disque : ce sont elles qui décident
 * de ce que l'artiste voit, elles méritent donc d'être vérifiables seules.
 */

function cle(t: Tableau, colonne: ColonneTri): string | number | null {
  switch (colonne) {
    case 'titre':
      return t.titre.trim() === '' ? null : t.titre.trim()
    case 'ref':
      return t.ref === '' ? null : t.ref
    case 'annee':
      return t.annee
    case 'ajout':
      return t.cree === '' ? null : t.cree
    case 'dimensions':
      return t.hauteur === null || t.largeur === null ? null : t.hauteur * t.largeur
    case 'prix':
      return t.prix
  }
}

export function trier(tableaux: Tableau[], colonne: ColonneTri, sens: SensTri): Tableau[] {
  const signe = sens === 'asc' ? 1 : -1

  return [...tableaux].sort((a, b) => {
    const ka = cle(a, colonne)
    const kb = cle(b, colonne)

    // Ce qui manque reste en fin de liste dans les deux sens. Inverser un tri
    // ne doit pas faire remonter en tête les œuvres dont on ignore tout : ce
    // sont justement celles qu'on cherche le moins.
    if (ka === null && kb === null) return a.ref.localeCompare(b.ref, 'fr', { numeric: true })
    if (ka === null) return 1
    if (kb === null) return -1

    if (typeof ka === 'string' && typeof kb === 'string') {
      return signe * ka.localeCompare(kb, 'fr', { numeric: true, sensitivity: 'base' })
    }
    return signe * (Number(ka) - Number(kb))
  })
}

function champs(t: Tableau, portee: PorteeRecherche): string {
  switch (portee) {
    case 'titre':
      return t.titre
    case 'acheteur':
      return t.acheteur
    case 'notes':
      return t.notes
    case 'partout':
      // La référence est incluse volontairement : c'est elle qui figure au dos
      // des toiles et sur les certificats, donc le premier terme qu'on cherche.
      return [
        t.titre,
        t.ref,
        t.technique,
        t.lieu,
        t.serie,
        t.acheteur,
        t.notes,
        t.annee === null ? '' : String(t.annee)
      ].join(' ')
  }
}

export function filtrer(tableaux: Tableau[], recherche: string, portee: PorteeRecherche): Tableau[] {
  const q = recherche.trim().toLowerCase()
  if (q === '') return tableaux
  return tableaux.filter((t) => champs(t, portee).toLowerCase().includes(q))
}

export function parStatut(tableaux: Tableau[], statut: FiltreStatut): Tableau[] {
  return statut === 'tous' ? tableaux : tableaux.filter((t) => t.statut === statut)
}

export function compter(tableaux: Tableau[]): Record<FiltreStatut, number> {
  const comptes = { tous: tableaux.length } as Record<FiltreStatut, number>
  for (const s of STATUTS) comptes[s] = 0
  for (const t of tableaux) comptes[t.statut] += 1
  return comptes
}

/** Ordre d'affichage des onglets de statut. */
export const ONGLETS: FiltreStatut[] = ['tous', ...(STATUTS as Statut[])]
