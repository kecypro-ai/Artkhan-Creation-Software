/**
 * Devises proposées à la vente.
 *
 * La liste couvre les monnaies dans lesquelles l'atelier vend réellement,
 * plutôt que les cent soixante-dix de la norme ISO. Toute autre reste
 * saisissable à la main : la liste guide, elle n'enferme pas.
 *
 * Les deux francs CFA sont distingués — l'Afrique centrale et l'Afrique de
 * l'Ouest n'utilisent pas le même code, et un certificat mentionnant le
 * mauvais serait faux.
 */
export interface Devise {
  code: string
  libelle: string
}

export const DEVISES: Devise[] = [
  { code: 'EUR', libelle: 'Euro' },
  { code: 'USD', libelle: 'Dollar américain' },
  { code: 'XAF', libelle: 'Franc CFA — Afrique centrale' },
  { code: 'XOF', libelle: 'Franc CFA — Afrique de l’Ouest' },
  { code: 'CDF', libelle: 'Franc congolais' },
  { code: 'GBP', libelle: 'Livre sterling' },
  { code: 'CNY', libelle: 'Yuan' }
]

export function libelleDevise(code: string): string {
  return DEVISES.find((d) => d.code === code)?.libelle ?? code
}

/** Un code monétaire tient en trois lettres majuscules. */
export function normaliserDevise(saisie: string): string {
  return saisie
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 3)
}

/**
 * Codes à proposer : la liste maison, plus ceux déjà employés dans l'atelier.
 *
 * Une devise ajoutée à la main sur une vente réapparaît ainsi pour la
 * suivante, sans qu'il faille la retenir ni la déclarer quelque part.
 */
export function devisesDisponibles(employees: string[], courante: string): Devise[] {
  const liste = [...DEVISES]
  for (const code of [...employees, courante]) {
    const propre = normaliserDevise(code)
    if (propre !== '' && !liste.some((d) => d.code === propre)) {
      liste.push({ code: propre, libelle: propre })
    }
  }
  return liste
}
