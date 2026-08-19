import {
  assainirNom,
  assembler,
  decouper,
  inconnues,
  listeTexte,
  nombre,
  poser,
  poserInconnues,
  texte
} from './entete'
import type { Certitude, Edition, Statut, Tableau } from './types'
import { STATUTS } from './types'

/**
 * Lecture et écriture d'une œuvre.
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

export function lireTableau(brut: string, fichier: string, refSecours: string): Tableau {
  const { entete, corps } = decouper(brut)

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
    extra: inconnues(entete, CLES_CONNUES),
    fichier
  }
}

export function ecrireTableau(t: Tableau): string {
  const entete: Record<string, unknown> = { ref: t.ref }

  poser(entete, 'titre', t.titre)
  poser(entete, 'annee', t.annee)
  // La certitude n'a de sens qu'en présence d'une année, et « certaine » va
  // de soi : on ne l'écrit que lorsqu'elle nuance réellement quelque chose.
  if (t.annee !== null && t.certitude !== 'certaine') entete['certitude'] = t.certitude
  poser(entete, 'technique', t.technique)
  poser(entete, 'hauteur', t.hauteur)
  poser(entete, 'largeur', t.largeur)
  entete['statut'] = t.statut
  poser(entete, 'lieu', t.lieu)
  poser(entete, 'serie', t.serie)
  poser(entete, 'photos', t.photos)

  if (t.statut === 'vendu') {
    poser(entete, 'prix', t.prix)
    poser(entete, 'devise', t.prix === null ? '' : t.devise)
    poser(entete, 'acheteur', t.acheteur)
    poser(entete, 'certificat', t.certificat)
    poser(entete, 'dateVente', t.dateVente)
  }

  poser(entete, 'support', t.support)
  poser(entete, 'lieuRealisation', t.lieuRealisation)
  // « original » va de soi : seule une édition limitée mérite d'être écrite.
  if (t.edition === 'limitee') {
    entete['edition'] = t.edition
    poser(entete, 'editionNumero', t.editionNumero)
  }
  poser(entete, 'certificatDate', t.certificatDate)

  poser(entete, 'cree', t.cree)
  poser(entete, 'modifie', t.modifie)
  poserInconnues(entete, t.extra)

  return assembler(entete, t.notes)
}

/** Nom de fichier lisible dans un explorateur, sans caractère interdit. */
export function nomFichier(ref: string, titre: string): string {
  const propre = assainirNom(titre)
  return propre === '' ? `${ref}.md` : `${ref} ${propre}.md`
}
