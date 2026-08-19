import type { Tableau } from './types'

/**
 * Référence d'une œuvre : identité stable et référence affichée.
 *
 * `ref` — « CK-0031 » — est l'identité. Elle est écrite dans l'en-tête du
 * fichier, sert à retrouver l'œuvre et ne change jamais.
 *
 * La référence affichée y ajoute la série : « CK-0031-SKRATON ». C'est elle
 * que l'artiste écrit au dos de la toile et qui figure sur le certificat.
 * Elle est calculée, jamais enregistrée : une œuvre peut rejoindre une série
 * ou en sortir, et sa référence suit sans que son identité bouge — sinon le
 * dossier de ses photos et tout ce qui la désigne casseraient au premier
 * changement d'avis.
 */

const LARGEUR_NUMERO = 4

const ACCENTS = /[̀-ͯ]/g

/** « Les Mains ouvertes » → « LES-MAINS-OUVERTES ». */
export function normaliserSerie(serie: string): string {
  return serie
    .normalize('NFD')
    .replace(ACCENTS, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function refComplete(t: Pick<Tableau, 'ref' | 'serie'>): string {
  const serie = normaliserSerie(t.serie)
  return serie === '' ? t.ref : `${t.ref}-${serie}`
}

export function composerRef(prefixe: string, numero: number): string {
  return `${prefixe}-${String(numero).padStart(LARGEUR_NUMERO, '0')}`
}

/**
 * Numéro contenu dans une référence, quel que soit son remplissage.
 *
 * Les ateliers ouverts avant l'élargissement à quatre chiffres contiennent des
 * « CK-031 » : sans cette lecture, « CK-0031 » serait attribué à une seconde
 * œuvre et deux toiles porteraient le même numéro.
 */
export function numeroDe(ref: string, prefixe: string): number | null {
  const m = new RegExp(`^${prefixe}-(\\d+)`, 'i').exec(ref.trim())
  if (m === null) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}
