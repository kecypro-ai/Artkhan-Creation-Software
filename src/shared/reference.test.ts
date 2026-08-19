import { describe, expect, it } from 'vitest'
import { composerRef, normaliserSerie, numeroDe, refComplete } from './reference'

describe('numéro', () => {
  it('remplit sur quatre chiffres', () => {
    expect(composerRef('CK', 1)).toBe('CK-0001')
    expect(composerRef('CK', 312)).toBe('CK-0312')
  })

  it('ne tronque pas au-delà de dix mille œuvres', () => {
    expect(composerRef('CK', 12345)).toBe('CK-12345')
  })

  it('relit un numéro quel que soit son remplissage', () => {
    // Les ateliers ouverts avant l'élargissement contiennent des « CK-031 » :
    // sans cette lecture, « CK-0031 » irait à une seconde œuvre.
    expect(numeroDe('CK-031', 'CK')).toBe(31)
    expect(numeroDe('CK-0031', 'CK')).toBe(31)
    expect(numeroDe('CK-0031-SKRATON', 'CK')).toBe(31)
  })

  it('ignore une référence d’un autre préfixe ou informe', () => {
    expect(numeroDe('AB-0031', 'CK')).toBeNull()
    expect(numeroDe('sans numéro', 'CK')).toBeNull()
  })
})

describe('série dans la référence', () => {
  it('ajoute la série en suffixe', () => {
    expect(refComplete({ ref: 'CK-0031', serie: 'Skraton' })).toBe('CK-0031-SKRATON')
  })

  it('rend la référence nue sans série', () => {
    expect(refComplete({ ref: 'CK-0031', serie: '' })).toBe('CK-0031')
    expect(refComplete({ ref: 'CK-0031', serie: '   ' })).toBe('CK-0031')
  })

  it('normalise accents, espaces et ponctuation', () => {
    expect(normaliserSerie('Les Mains ouvertes')).toBe('LES-MAINS-OUVERTES')
    expect(normaliserSerie('Été à Beni')).toBe('ETE-A-BENI')
    expect(normaliserSerie('  n°3 / bis  ')).toBe('N-3-BIS')
  })
})
