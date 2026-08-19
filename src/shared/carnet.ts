import { stringify as stringifyYaml } from 'yaml'
import { decouper } from './document'
import type { Tableau } from './types'

/**
 * Carnet d'adresses : acheteurs et lieux de dépôt.
 *
 * Les deux demandent rigoureusement la même chose — une fiche par nom, créée
 * dès qu'un nom apparaît sur une œuvre, et la liste des œuvres rattachées.
 * Un seul mécanisme les porte, paramétré par le dossier et par le champ de
 * l'œuvre qui l'alimente. Écrire deux fois ce code, ce serait deux fois les
 * mêmes bogues.
 */
export type TypeCarnet = 'acheteurs' | 'depots'

export const DOSSIER_CARNET: Record<TypeCarnet, string> = {
  acheteurs: 'Acheteurs',
  depots: 'Depots'
}

export const LIBELLE_CARNET: Record<TypeCarnet, { pluriel: string; singulier: string; nouveau: string }> = {
  acheteurs: { pluriel: 'Acheteurs', singulier: 'Acheteur', nouveau: 'Nouvel acheteur…' },
  depots: { pluriel: 'Dépôts', singulier: 'Lieu de dépôt', nouveau: 'Nouveau lieu…' }
}

export interface Fiche {
  nom: string
  email: string
  telephone: string
  adresse: string
  /** Personne à joindre dans une galerie ; vide pour un particulier. */
  contact: string
  notes: string
  extra: Record<string, unknown>
  fichier: string
}

const CLES_CONNUES = new Set(['nom', 'email', 'telephone', 'adresse', 'contact'])

function texte(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

export function ficheVide(nom: string): Fiche {
  return { nom, email: '', telephone: '', adresse: '', contact: '', notes: '', extra: {}, fichier: '' }
}

export function lireFiche(brut: string, fichier: string, nomSecours: string): Fiche {
  const { entete, corps } = decouper(brut)

  const extra: Record<string, unknown> = {}
  for (const [cle, valeur] of Object.entries(entete)) {
    if (!CLES_CONNUES.has(cle)) extra[cle] = valeur
  }

  return {
    nom: texte(entete['nom']) || nomSecours,
    email: texte(entete['email']),
    telephone: texte(entete['telephone']),
    adresse: texte(entete['adresse']),
    contact: texte(entete['contact']),
    notes: corps,
    extra,
    fichier
  }
}

export function ecrireFiche(f: Fiche): string {
  const entete: Record<string, unknown> = { nom: f.nom }
  for (const cle of ['email', 'telephone', 'adresse', 'contact'] as const) {
    if (f[cle] !== '') entete[cle] = f[cle]
  }
  for (const [cle, valeur] of Object.entries(f.extra)) {
    if (!(cle in entete)) entete[cle] = valeur
  }

  const yaml = stringifyYaml(entete, { lineWidth: 0 }).trimEnd()
  const corps = f.notes.trim()
  return corps === '' ? `---\n${yaml}\n---\n` : `---\n${yaml}\n---\n\n${corps}\n`
}

/** Comparaison souple : « galerie nord » et « Galerie Nord  » sont un seul lieu. */
export function memeNom(a: string, b: string): boolean {
  return a.trim().localeCompare(b.trim(), 'fr', { sensitivity: 'base' }) === 0
}

/** Nom porté par une œuvre pour ce carnet, ou chaîne vide si aucun. */
export function nomRattache(t: Tableau, type: TypeCarnet): string {
  if (type === 'acheteurs') return t.acheteur.trim()
  // Un lieu ne compte comme dépôt que si l'œuvre y est effectivement déposée :
  // le même champ sert d'emplacement pour une œuvre vendue ou offerte.
  return t.statut === 'depot' ? t.lieu.trim() : ''
}

export function oeuvresDe(tableaux: Tableau[], type: TypeCarnet, nom: string): Tableau[] {
  return tableaux.filter((t) => {
    const rattache = nomRattache(t, type)
    return rattache !== '' && memeNom(rattache, nom)
  })
}

/** Tous les noms cités par le catalogue, dédoublonnés et classés. */
export function nomsCites(tableaux: Tableau[], type: TypeCarnet): string[] {
  const vus: string[] = []
  for (const t of tableaux) {
    const nom = nomRattache(t, type)
    if (nom !== '' && !vus.some((autre) => memeNom(autre, nom))) vus.push(nom)
  }
  return vus.sort((a, b) => a.localeCompare(b, 'fr'))
}

export interface Total {
  devise: string
  montant: number
}

/**
 * Somme des ventes, regroupée par devise.
 *
 * Un artiste vend en euros comme en dollars : additionner les deux donnerait
 * un nombre qui ne veut rien dire. Les œuvres sans prix sont ignorées plutôt
 * que comptées à zéro — on ne sait pas, ce n'est pas gratuit.
 */
export function totaux(tableaux: Tableau[]): Total[] {
  const parDevise = new Map<string, number>()
  for (const t of tableaux) {
    if (t.prix === null) continue
    const devise = t.devise.trim() === '' ? 'EUR' : t.devise.trim().toUpperCase()
    parDevise.set(devise, (parDevise.get(devise) ?? 0) + t.prix)
  }
  return [...parDevise].map(([devise, montant]) => ({ devise, montant })).sort((a, b) => b.montant - a.montant)
}

export function formaterMontant(montant: number, devise: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: devise, maximumFractionDigits: 0 }).format(
    montant
  )
}

/** Nom de fichier lisible dans un explorateur, sans caractère interdit. */
export function nomFichierFiche(nom: string): string {
  const propre = nom
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return `${propre === '' ? 'Sans nom' : propre}.md`
}
