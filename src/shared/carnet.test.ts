import { describe, expect, it } from 'vitest'
import { ecrireFiche, ficheVide, lireFiche, memeNom, nomsCites, oeuvresDe, totaux } from './carnet'
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
    notes: '',
    cree: '2026-01-01',
    modifie: '2026-01-01',
    extra: {},
    fichier: '',
    ...partiel
  }
}

describe('fiche', () => {
  it('fait l’aller-retour sans rien perdre', () => {
    const avant = {
      ...ficheVide('Galerie Nord'),
      email: 'contact@nord.fr',
      telephone: '01 23 45 67 89',
      adresse: '12 rue des Arts, Paris',
      contact: 'Mme Lemoine',
      notes: 'Dépôt-vente, commission 40 %.',
      extra: { siret: '123456789' }
    }
    expect(lireFiche(ecrireFiche(avant), '', 'SECOURS')).toEqual({ ...avant, fichier: '' })
  })

  it('n’écrit pas les champs vides', () => {
    const rendu = ecrireFiche(ficheVide('Musée'))
    expect(rendu).toContain('nom: Musée')
    expect(rendu).not.toContain('email')
    expect(rendu).not.toContain('telephone')
  })

  it('retombe sur le nom de fichier si l’en-tête a perdu le sien', () => {
    expect(lireFiche('Juste des notes.', 'Acheteurs/x.md', 'Galerie Sud').nom).toBe('Galerie Sud')
  })
})

describe('rattachement', () => {
  const catalogue = [
    t({ ref: 'A', statut: 'vendu', acheteur: 'Galerie Nord', prix: 4000, devise: 'EUR' }),
    t({ ref: 'B', statut: 'vendu', acheteur: 'galerie nord', prix: 2000, devise: 'EUR' }),
    t({ ref: 'C', statut: 'vendu', acheteur: 'Musée', prix: 1500, devise: 'CAD' }),
    t({ ref: 'D', statut: 'depot', lieu: 'Galerie Nord' }),
    t({ ref: 'E', statut: 'vendu', acheteur: 'Musée', lieu: 'Galerie Nord' })
  ]

  it('regroupe les graphies d’un même nom', () => {
    expect(memeNom('Galerie Nord', ' galerie  nord')).toBe(false)
    expect(memeNom('Galerie Nord', ' galerie nord ')).toBe(true)
    expect(oeuvresDe(catalogue, 'acheteurs', 'GALERIE NORD').map((x) => x.ref)).toEqual(['A', 'B'])
  })

  it('ne compte comme dépôt que les œuvres réellement déposées', () => {
    // L'œuvre E porte « Galerie Nord » en lieu, mais elle est vendue : c'est
    // l'emplacement actuel du tableau, pas un dépôt en cours.
    expect(oeuvresDe(catalogue, 'depots', 'Galerie Nord').map((x) => x.ref)).toEqual(['D'])
  })

  it('liste les noms cités, dédoublonnés et classés', () => {
    expect(nomsCites(catalogue, 'acheteurs')).toEqual(['Galerie Nord', 'Musée'])
    expect(nomsCites(catalogue, 'depots')).toEqual(['Galerie Nord'])
  })
})

describe('totaux', () => {
  it('sépare les devises au lieu de les additionner', () => {
    const ventes = [
      t({ prix: 4000, devise: 'EUR' }),
      t({ prix: 2000, devise: 'eur' }),
      t({ prix: 1500, devise: 'CAD' })
    ]
    expect(totaux(ventes)).toEqual([
      { devise: 'EUR', montant: 6000 },
      { devise: 'CAD', montant: 1500 }
    ])
  })

  it('ignore les œuvres sans prix plutôt que de les compter à zéro', () => {
    expect(totaux([t({ prix: 900, devise: 'EUR' }), t({ prix: null })])).toEqual([{ devise: 'EUR', montant: 900 }])
  })

  it('suppose l’euro quand la devise manque', () => {
    expect(totaux([t({ prix: 500, devise: '' })])).toEqual([{ devise: 'EUR', montant: 500 }])
  })

  it('ne rend rien quand aucune vente n’est chiffrée', () => {
    expect(totaux([t({ prix: null })])).toEqual([])
  })
})
