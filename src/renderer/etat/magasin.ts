import { create } from 'zustand'
import type { BrouillonTableau, Catalogue, EtatAtelier, Tableau } from '@shared/types'

export const BROUILLON_VIDE: BrouillonTableau = {
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
  devise: 'EUR',
  acheteur: '',
  certificat: '',
  dateVente: '',
  notes: '',
  extra: {}
}

export function versBrouillon(t: Tableau): BrouillonTableau {
  const { ref: _ref, fichier: _fichier, cree: _cree, modifie: _modifie, ...brouillon } = t
  return brouillon
}

const CATALOGUE_VIDE: Catalogue = {
  tableaux: [],
  anomalies: { sansPhoto: 0, sansAnnee: 0 },
  echecs: []
}

export type Enregistrement = 'repos' | 'en-cours' | 'enregistre'

interface Magasin {
  etat: EtatAtelier
  catalogue: Catalogue
  chargement: boolean
  recherche: string
  refOuverte: string | null
  erreur: string | null
  enregistrement: Enregistrement

  demarrer: () => Promise<void>
  choisirAtelier: () => Promise<void>
  rafraichir: () => Promise<void>
  setRecherche: (v: string) => void
  ouvrir: (ref: string | null) => void
  ajouter: () => Promise<void>
  enregistrer: (ref: string, brouillon: BrouillonTableau) => Promise<void>
  supprimer: (ref: string) => Promise<void>
  importerPhotos: (ref: string) => Promise<void>
  retirerPhoto: (ref: string, photo: string) => Promise<void>
  effacerErreur: () => void
}

function message(e: unknown): string {
  const brut = e instanceof Error ? e.message : String(e)
  // Electron préfixe les erreurs d'IPC ; l'artiste n'a pas à lire ça.
  return brut.replace(/^Error invoking remote method '[^']*':\s*/, '').replace(/^Error:\s*/, '')
}

export const useMagasin = create<Magasin>((set, get) => ({
  etat: { chemin: null, atelier: null },
  catalogue: CATALOGUE_VIDE,
  chargement: true,
  recherche: '',
  refOuverte: null,
  erreur: null,
  enregistrement: 'repos',

  demarrer: async () => {
    try {
      const etat = await window.atelier.atelierEtat()
      set({ etat })
      if (etat.chemin !== null) await get().rafraichir()
    } catch (e) {
      set({ erreur: message(e) })
    } finally {
      set({ chargement: false })
    }
  },

  choisirAtelier: async () => {
    set({ chargement: true, erreur: null })
    try {
      const etat = await window.atelier.atelierChoisir()
      set({ etat })
      if (etat.chemin !== null) await get().rafraichir()
    } catch (e) {
      set({ erreur: message(e) })
    } finally {
      set({ chargement: false })
    }
  },

  rafraichir: async () => {
    try {
      set({ catalogue: await window.atelier.listerTableaux() })
    } catch (e) {
      set({ erreur: message(e) })
    }
  },

  setRecherche: (recherche) => set({ recherche }),

  ouvrir: (refOuverte) => set({ refOuverte, enregistrement: 'repos' }),

  ajouter: async () => {
    try {
      // Le tableau existe sur le disque dès sa création : une saisie
      // interrompue par une fermeture ne se perd pas, et la référence
      // affichée dans la fiche est déjà la bonne.
      const cree = await window.atelier.creerTableau(BROUILLON_VIDE)
      await get().rafraichir()
      set({ refOuverte: cree.ref, enregistrement: 'repos' })
    } catch (e) {
      set({ erreur: message(e) })
    }
  },

  enregistrer: async (ref, brouillon) => {
    set({ enregistrement: 'en-cours' })
    try {
      await window.atelier.enregistrerTableau(ref, brouillon)
      await get().rafraichir()
      set({ enregistrement: 'enregistre' })
    } catch (e) {
      set({ erreur: message(e), enregistrement: 'repos' })
    }
  },

  supprimer: async (ref) => {
    try {
      await window.atelier.supprimerTableau(ref)
      set({ refOuverte: null })
      await get().rafraichir()
    } catch (e) {
      set({ erreur: message(e) })
    }
  },

  importerPhotos: async (ref) => {
    try {
      await window.atelier.importerPhotos(ref)
      await get().rafraichir()
    } catch (e) {
      set({ erreur: message(e) })
    }
  },

  retirerPhoto: async (ref, photo) => {
    try {
      await window.atelier.retirerPhoto(ref, photo)
      await get().rafraichir()
    } catch (e) {
      set({ erreur: message(e) })
    }
  },

  effacerErreur: () => set({ erreur: null })
}))

/**
 * Filtre le catalogue sur la saisie de recherche.
 *
 * La référence est incluse volontairement : c'est elle qui figure au dos des
 * toiles et sur les certificats, donc le premier terme qu'on cherchera.
 */
export function filtrer(tableaux: Tableau[], recherche: string): Tableau[] {
  const q = recherche.trim().toLowerCase()
  if (q === '') return tableaux
  return tableaux.filter((t) =>
    [t.titre, t.ref, t.technique, t.lieu, t.serie, t.acheteur, t.notes, t.annee === null ? '' : String(t.annee)]
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
}
