import { describe, expect, it } from 'vitest'
import { compter, filtrer, parStatut, trier } from './liste'
import type { Tableau } from './types'

function t(partiel: Partial<Tableau>): Tableau {
  return {
    ref: 'CK-001',
    titre: '',
    annee: null,
    certitude: 'certaine',
    technique: '',
    hauteur: null,
    largeur: null,
    statut: 'atelier',
    lieu: '',
    serie: '',
    photos: [],
    prix: null,
    devise: '',
    acheteur: '',
    certificat: '',
    dateVente: '',
    support: '',
    lieuRealisation: '',
    emplacementSignature: '',
    edition: 'original',
    editionNumero: '',
    certificatDate: '',
    notes: '',
    cree: '2026-01-01',
    modifie: '2026-01-01',
    extra: {},
    fichier: '',
    ...partiel
  }
}

const titres = (l: Tableau[]): string[] => l.map((x) => x.titre)

describe('tri', () => {
  const catalogue = [
    t({ ref: 'CK-002', titre: 'Zèbre', annee: 1990, hauteur: 10, largeur: 10, prix: 100 }),
    t({ ref: 'CK-010', titre: 'Aube', annee: 2020, hauteur: 100, largeur: 100, prix: 5000 }),
    t({ ref: 'CK-001', titre: 'Marché', annee: 2005, hauteur: 50, largeur: 50, prix: 900 })
  ]

  it('classe les titres selon l’alphabet français', () => {
    expect(titres(trier(catalogue, 'titre', 'asc'))).toEqual(['Aube', 'Marché', 'Zèbre'])
    expect(titres(trier(catalogue, 'titre', 'desc'))).toEqual(['Zèbre', 'Marché', 'Aube'])
  })

  it('ordonne les références par leur nombre, pas par leur texte', () => {
    // Un tri purement textuel placerait CK-010 avant CK-002.
    expect(trier(catalogue, 'ref', 'asc').map((x) => x.ref)).toEqual(['CK-001', 'CK-002', 'CK-010'])
  })

  it('classe par année, par surface et par prix', () => {
    expect(titres(trier(catalogue, 'annee', 'asc'))).toEqual(['Zèbre', 'Marché', 'Aube'])
    expect(titres(trier(catalogue, 'dimensions', 'desc'))).toEqual(['Aube', 'Marché', 'Zèbre'])
    expect(titres(trier(catalogue, 'prix', 'asc'))).toEqual(['Zèbre', 'Marché', 'Aube'])
  })

  it('laisse les valeurs absentes en fin de liste dans les deux sens', () => {
    const avecTrous = [t({ ref: 'A', titre: 'Connue', annee: 2000 }), t({ ref: 'B', titre: 'Inconnue' })]
    expect(titres(trier(avecTrous, 'annee', 'asc')).at(-1)).toBe('Inconnue')
    expect(titres(trier(avecTrous, 'annee', 'desc')).at(-1)).toBe('Inconnue')
  })

  it('ne modifie pas la liste reçue', () => {
    const origine = [...catalogue]
    trier(catalogue, 'titre', 'asc')
    expect(catalogue).toEqual(origine)
  })
})

describe('recherche', () => {
  const catalogue = [
    t({ ref: 'CK-001', titre: 'Nocturne', acheteur: 'Galerie Nord', notes: 'peint à Beni' }),
    t({ ref: 'CK-002', titre: 'Aurore', acheteur: 'Musée', notes: 'esquisse nocturne' })
  ]

  it('cherche partout par défaut, référence comprise', () => {
    expect(filtrer(catalogue, 'CK-002', 'partout')).toHaveLength(1)
    expect(filtrer(catalogue, 'nocturne', 'partout')).toHaveLength(2)
  })

  it('se restreint au champ demandé', () => {
    expect(titres(filtrer(catalogue, 'nocturne', 'titre'))).toEqual(['Nocturne'])
    expect(titres(filtrer(catalogue, 'nocturne', 'notes'))).toEqual(['Aurore'])
    expect(titres(filtrer(catalogue, 'galerie', 'acheteur'))).toEqual(['Nocturne'])
  })

  it('ignore la casse et rend tout sur une recherche vide', () => {
    expect(filtrer(catalogue, 'NOCTURNE', 'titre')).toHaveLength(1)
    expect(filtrer(catalogue, '   ', 'titre')).toHaveLength(2)
  })
})

describe('statuts', () => {
  const catalogue = [
    t({ ref: 'A', statut: 'atelier' }),
    t({ ref: 'B', statut: 'atelier' }),
    t({ ref: 'C', statut: 'vendu' })
  ]

  it('filtre par statut, « tous » ne retirant rien', () => {
    expect(parStatut(catalogue, 'atelier')).toHaveLength(2)
    expect(parStatut(catalogue, 'tous')).toHaveLength(3)
    expect(parStatut(catalogue, 'depot')).toHaveLength(0)
  })

  it('compte chaque statut, y compris ceux à zéro', () => {
    expect(compter(catalogue)).toEqual({ tous: 3, atelier: 2, depot: 0, vendu: 1, offert: 0 })
  })
})
