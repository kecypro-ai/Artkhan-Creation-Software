import { describe, expect, it } from 'vitest'
import { ecrireTableau, lireTableau, nomFichier } from './document'
import type { Tableau } from './types'

function tableau(partiel: Partial<Tableau> = {}): Tableau {
  return {
    ref: 'CK-031',
    titre: 'Femme au pagne',
    annee: 2021,
    certitude: 'certaine',
    technique: 'Huile sur toile',
    hauteur: 120,
    largeur: 80,
    statut: 'atelier',
    lieu: '',
    serie: '',
    photos: [],
    prix: null,
    devise: '',
    acheteur: '',
    certificat: '',
    dateVente: '',
    notes: '',
    cree: '2026-08-19',
    modifie: '2026-08-19',
    extra: {},
    fichier: 'Tableaux/CK-031 Femme au pagne.md',
    ...partiel
  }
}

describe('aller-retour', () => {
  it('restitue un tableau complet à l’identique', () => {
    const avant = tableau({
      statut: 'vendu',
      prix: 4500,
      devise: 'EUR',
      acheteur: 'Galerie Nord',
      certificat: 'CERT-0031',
      dateVente: '2023-04-12',
      lieu: 'Collection privée',
      photos: ['Photos/CK-031/face.jpg'],
      notes: 'Peint après le retour de Kinshasa.'
    })
    const apres = lireTableau(ecrireTableau(avant), avant.fichier, 'SECOURS')
    expect(apres).toEqual(avant)
  })

  it('conserve les champs inconnus ajoutés à la main', () => {
    const avant = tableau({ extra: { exposition: 'Biennale 2022', cadre: true } })
    const rendu = ecrireTableau(avant)
    expect(rendu).toContain('exposition: Biennale 2022')
    expect(lireTableau(rendu, avant.fichier, 'SECOURS').extra).toEqual(avant.extra)
  })
})

describe('lecture tolérante', () => {
  it('accepte un fichier sans en-tête et garde le texte', () => {
    const t = lireTableau('Juste des notes.', 'Tableaux/x.md', 'CK-009')
    expect(t.ref).toBe('CK-009')
    expect(t.notes).toBe('Juste des notes.')
    expect(t.statut).toBe('atelier')
  })

  it('n’efface pas l’œuvre quand l’en-tête est illisible', () => {
    const t = lireTableau('---\ntitre: [oups\n---\n\nNotes.', 'Tableaux/x.md', 'CK-010')
    expect(t.ref).toBe('CK-010')
    expect(t.notes).toBe('Notes.')
  })

  it('récupère les dimensions saisies avec une unité', () => {
    const t = lireTableau('---\nhauteur: 120 cm\nlargeur: "80"\n---', 'x.md', 'CK-011')
    expect(t.hauteur).toBe(120)
    expect(t.largeur).toBe(80)
  })

  it('retombe sur des valeurs sûres quand statut et certitude sont fantaisistes', () => {
    const t = lireTableau('---\nstatut: perdu\ncertitude: peut-être\n---', 'x.md', 'CK-012')
    expect(t.statut).toBe('atelier')
    expect(t.certitude).toBe('certaine')
  })

  it('accepte une photo unique écrite sans liste', () => {
    const t = lireTableau('---\nphotos: Photos/a.jpg\n---', 'x.md', 'CK-013')
    expect(t.photos).toEqual(['Photos/a.jpg'])
  })
})

describe('écriture', () => {
  it('omet les champs vides pour garder le fichier lisible', () => {
    const rendu = ecrireTableau(tableau({ annee: null, technique: '', hauteur: null }))
    expect(rendu).not.toContain('annee')
    expect(rendu).not.toContain('technique')
    expect(rendu).not.toContain('hauteur')
    expect(rendu).toContain('titre: Femme au pagne')
  })

  it('n’écrit le volet vente que pour un tableau vendu', () => {
    const vente = { prix: 4500, devise: 'EUR', acheteur: 'Galerie Nord' }
    expect(ecrireTableau(tableau({ statut: 'atelier', ...vente }))).not.toContain('acheteur')
    expect(ecrireTableau(tableau({ statut: 'vendu', ...vente }))).toContain('acheteur: Galerie Nord')
  })

  it('tait la certitude quand elle va de soi', () => {
    expect(ecrireTableau(tableau({ certitude: 'certaine' }))).not.toContain('certitude')
    expect(ecrireTableau(tableau({ certitude: 'inconnue' }))).toContain('certitude: inconnue')
  })
})

describe('nom de fichier', () => {
  it('reste lisible dans un explorateur', () => {
    expect(nomFichier('CK-031', 'Femme au pagne')).toBe('CK-031 Femme au pagne.md')
  })

  it('se réduit à la référence pour un tableau sans titre', () => {
    expect(nomFichier('CK-031', '   ')).toBe('CK-031.md')
  })

  it('neutralise les caractères interdits par le système de fichiers', () => {
    expect(nomFichier('CK-031', 'Étude n°3 : mère / enfant')).toBe('CK-031 Étude n°3 mère enfant.md')
  })
})
