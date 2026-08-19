import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import type { Certitude, Edition, Statut, Tableau } from './types'
import { STATUTS } from './types'

/**
 * Lecture et écriture du format de fichier.
 *
 * C'est la pièce la plus importante du projet : elle seule décide de ce
 * qu'on retrouvera dans dix ans en ouvrant le dossier sans l'application.
 * Deux règles la gouvernent.
 *
 * 1. On ne perd rien. Un en-tête abîmé à la main ne fait pas disparaître
 *    l'œuvre : chaque champ retombe sur une valeur par défaut, et les clés
 *    inconnues sont conservées telles quelles.
 * 2. On n'écrit pas le vide. Une clé sans valeur n'est pas sérialisée, pour
 *    que le fichier reste lisible par un humain.
 */

const CLES_CONNUES = new Set([
  'ref',
  'titre',
  'annee',
  'certitude',
  'technique',
  'hauteur',
  'largeur',
  'statut',
  'lieu',
  'serie',
  'photos',
  'prix',
  'devise',
  'acheteur',
  'certificat',
  'dateVente',
  'support',
  'lieuRealisation',
  'edition',
  'editionNumero',
  'certificatDate',
  'cree',
  'modifie'
])

function texte(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

function nombre(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    // Tolère « 120 cm », « 1 200,50 » : ces fichiers seront édités à la main.
    const n = Number(v.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''))
    return Number.isFinite(n) && v.trim() !== '' ? n : null
  }
  return null
}

function statut(v: unknown): Statut {
  const s = texte(v).toLowerCase()
  return (STATUTS as readonly string[]).includes(s) ? (s as Statut) : 'atelier'
}

function certitude(v: unknown): Certitude {
  const c = texte(v).toLowerCase()
  if (c === 'certaine' || c === 'approximative' || c === 'inconnue') return c
  return 'certaine'
}

function edition(v: unknown): Edition {
  return texte(v).toLowerCase() === 'limitee' ? 'limitee' : 'original'
}

function listeTexte(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(texte).filter((s) => s !== '')
  const seul = texte(v)
  return seul === '' ? [] : [seul]
}

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

export function lireTableau(brut: string, fichier: string, refSecours: string): Tableau {
  const { entete, corps } = decouper(brut)

  const extra: Record<string, unknown> = {}
  for (const [cle, valeur] of Object.entries(entete)) {
    if (!CLES_CONNUES.has(cle)) extra[cle] = valeur
  }

  return {
    ref: texte(entete['ref']) || refSecours,
    titre: texte(entete['titre']),
    annee: nombre(entete['annee']),
    certitude: certitude(entete['certitude']),
    technique: texte(entete['technique']),
    hauteur: nombre(entete['hauteur']),
    largeur: nombre(entete['largeur']),
    statut: statut(entete['statut']),
    lieu: texte(entete['lieu']),
    serie: texte(entete['serie']),
    photos: listeTexte(entete['photos']),
    prix: nombre(entete['prix']),
    devise: texte(entete['devise']),
    acheteur: texte(entete['acheteur']),
    certificat: texte(entete['certificat']),
    dateVente: texte(entete['dateVente']),
    support: texte(entete['support']),
    lieuRealisation: texte(entete['lieuRealisation']),
    edition: edition(entete['edition']),
    editionNumero: texte(entete['editionNumero']),
    certificatDate: texte(entete['certificatDate']),
    notes: corps,
    cree: texte(entete['cree']),
    modifie: texte(entete['modifie']),
    extra,
    fichier
  }
}

export function ecrireTableau(t: Tableau): string {
  const entete: Record<string, unknown> = { ref: t.ref }

  const poser = (cle: string, valeur: unknown): void => {
    if (valeur === null || valeur === '' || valeur === undefined) return
    if (Array.isArray(valeur) && valeur.length === 0) return
    entete[cle] = valeur
  }

  poser('titre', t.titre)
  poser('annee', t.annee)
  // La certitude n'a de sens qu'en présence d'une année, et « certaine » va
  // de soi : on ne l'écrit que lorsqu'elle nuance réellement quelque chose.
  if (t.annee !== null && t.certitude !== 'certaine') entete['certitude'] = t.certitude
  poser('technique', t.technique)
  poser('hauteur', t.hauteur)
  poser('largeur', t.largeur)
  entete['statut'] = t.statut
  poser('lieu', t.lieu)
  poser('serie', t.serie)
  poser('photos', t.photos)

  if (t.statut === 'vendu') {
    poser('prix', t.prix)
    poser('devise', t.prix === null ? '' : t.devise)
    poser('acheteur', t.acheteur)
    poser('certificat', t.certificat)
    poser('dateVente', t.dateVente)
  }

  poser('support', t.support)
  poser('lieuRealisation', t.lieuRealisation)
  // « original » va de soi : seule une édition limitée mérite d'être écrite.
  if (t.edition === 'limitee') {
    entete['edition'] = t.edition
    poser('editionNumero', t.editionNumero)
  }
  poser('certificatDate', t.certificatDate)

  poser('cree', t.cree)
  poser('modifie', t.modifie)

  for (const [cle, valeur] of Object.entries(t.extra)) {
    if (!(cle in entete)) entete[cle] = valeur
  }

  const yaml = stringifyYaml(entete, { lineWidth: 0 }).trimEnd()
  const corps = t.notes.trim()
  return corps === '' ? `---\n${yaml}\n---\n` : `---\n${yaml}\n---\n\n${corps}\n`
}

/** Nom de fichier lisible dans un explorateur, sans caractère interdit. */
export function nomFichier(ref: string, titre: string): string {
  const propre = titre
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
  return propre === '' ? `${ref}.md` : `${ref} ${propre}.md`
}
