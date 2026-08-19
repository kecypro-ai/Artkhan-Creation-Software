import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

/**
 * Briques communes aux documents de l'atelier.
 *
 * Œuvres et fiches de carnet sont des fichiers Markdown à en-tête YAML : ils
 * partagent leur découpage, leurs coercitions et leur assemblage. Écrire ces
 * briques deux fois, c'était corriger chaque bogue à moitié.
 */

const EN_TETE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/

export interface DocumentLu {
  entete: Record<string, unknown>
  corps: string
}

export function decouper(brut: string): DocumentLu {
  const sansBom = brut.replace(/^﻿/, '')
  const m = EN_TETE.exec(sansBom)
  if (!m) return { entete: {}, corps: sansBom.trim() }

  let entete: Record<string, unknown> = {}
  try {
    const analyse: unknown = parseYaml(m[1] ?? '')
    if (analyse !== null && typeof analyse === 'object' && !Array.isArray(analyse)) {
      entete = analyse as Record<string, unknown>
    }
  } catch {
    // En-tête illisible : on garde le corps plutôt que de perdre le fichier.
  }

  return { entete, corps: (m[2] ?? '').trim() }
}

export function assembler(entete: Record<string, unknown>, corps: string): string {
  const yaml = stringifyYaml(entete, { lineWidth: 0 }).trimEnd()
  const texte = corps.trim()
  return texte === '' ? `---\n${yaml}\n---\n` : `---\n${yaml}\n---\n\n${texte}\n`
}

/** N'inscrit la clé que si elle porte une valeur : on n'écrit pas le vide. */
export function poser(entete: Record<string, unknown>, cle: string, valeur: unknown): void {
  if (valeur === null || valeur === undefined || valeur === '') return
  if (Array.isArray(valeur) && valeur.length === 0) return
  entete[cle] = valeur
}

/** Recopie les clés que l'application ne connaît pas, sans écraser les siennes. */
export function poserInconnues(entete: Record<string, unknown>, extra: Record<string, unknown>): void {
  for (const [cle, valeur] of Object.entries(extra)) {
    if (!(cle in entete)) entete[cle] = valeur
  }
}

/** Sépare les clés connues du reste, que l'on conservera tel quel. */
export function inconnues(entete: Record<string, unknown>, connues: Set<string>): Record<string, unknown> {
  const reste: Record<string, unknown> = {}
  for (const [cle, valeur] of Object.entries(entete)) {
    if (!connues.has(cle)) reste[cle] = valeur
  }
  return reste
}

export function texte(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

export function nombre(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    // Tolère « 120 cm », « 1 200,50 » : ces fichiers seront édités à la main.
    const n = Number(v.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) && v.trim() !== '' ? n : null
  }
  return null
}

export function listeTexte(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(texte).filter((s) => s !== '')
  const seul = texte(v)
  return seul === '' ? [] : [seul]
}

/**
 * Nom lisible dans un explorateur, sans caractère interdit par le système.
 *
 * Un seul jeu de caractères pour tout ce que l'application nomme — œuvres,
 * fiches, photos — sinon deux fichiers voisins suivent deux règles.
 */
export function assainirNom(nom: string, secours = ''): string {
  const propre = nom
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return propre === '' ? secours : propre
}
