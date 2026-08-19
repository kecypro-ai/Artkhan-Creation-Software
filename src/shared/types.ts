export type Statut = 'atelier' | 'depot' | 'vendu' | 'offert'

export const STATUTS: readonly Statut[] = ['atelier', 'depot', 'vendu', 'offert']

export const LIBELLE_STATUT: Record<Statut, string> = {
  atelier: 'À l’atelier',
  depot: 'En dépôt',
  vendu: 'Vendu',
  offert: 'Offert'
}

/**
 * Une année peut être sûre, approximative ou franchement inconnue.
 *
 * Un catalogue rétrospectif se construit de mémoire : imposer une date
 * certaine obligerait à inventer. Mieux vaut enregistrer le doute que le
 * dissimuler.
 */
export type Certitude = 'certaine' | 'approximative' | 'inconnue'

export const LIBELLE_CERTITUDE: Record<Certitude, string> = {
  certaine: 'Certaine',
  approximative: 'Approximative',
  inconnue: 'À vérifier'
}

/**
 * Réglages d'affichage du catalogue.
 *
 * Ils appartiennent à la machine, pas à l'atelier : deux ordinateurs peuvent
 * regarder le même dossier avec des habitudes différentes, et ces choix ne
 * décrivent pas les œuvres.
 */
export type ModeVue = 'lignes' | 'grille'
export type ColonneTri = 'titre' | 'ref' | 'annee' | 'ajout' | 'dimensions' | 'prix'
export type SensTri = 'asc' | 'desc'
export type PorteeRecherche = 'partout' | 'titre' | 'acheteur' | 'notes'
export type FiltreStatut = Statut | 'tous'

export const LIBELLE_TRI: Record<ColonneTri, string> = {
  titre: 'Titre',
  ref: 'Référence',
  annee: 'Année',
  ajout: 'Date d’ajout',
  dimensions: 'Dimensions',
  prix: 'Prix'
}

export const LIBELLE_PORTEE: Record<PorteeRecherche, string> = {
  partout: 'Partout',
  titre: 'Titre',
  acheteur: 'Acheteur',
  notes: 'Notes'
}

export interface Preferences {
  modeVue: ModeVue
  filtre: FiltreStatut
  tri: ColonneTri
  sens: SensTri
  portee: PorteeRecherche
  /**
   * Niveau de zoom d'Electron, logarithmique : facteur = 1,2 ^ niveau.
   * Zéro vaut 100 %. Voir ZOOM_MIN / ZOOM_MAX pour les bornes.
   */
  zoom: number
}

export const ZOOM_MIN = -4
export const ZOOM_MAX = 4

/** Pourcentage affiché à l'artiste, qui n'a pas à connaître les logarithmes. */
export function pourcentageZoom(niveau: number): number {
  return Math.round(1.2 ** niveau * 100)
}

export const PREFERENCES_DEFAUT: Preferences = {
  modeVue: 'grille',
  filtre: 'tous',
  tri: 'ajout',
  sens: 'desc',
  portee: 'partout',
  zoom: 0
}

export interface Tableau {
  /** Identité stable de l'œuvre. Le nom de fichier, lui, peut changer. */
  ref: string
  /** Vide = « Sans titre ». Un tableau sans nom reste un tableau. */
  titre: string
  annee: number | null
  certitude: Certitude
  technique: string
  hauteur: number | null
  largeur: number | null
  statut: Statut
  /** Galerie, ville, collection — selon le statut. */
  lieu: string
  serie: string
  /** Chemins relatifs à la racine du dossier d'atelier. */
  photos: string[]
  /** Volet vente : renseigné uniquement quand le statut le justifie. */
  prix: number | null
  devise: string
  acheteur: string
  certificat: string
  dateVente: string
  /** Corps du Markdown, libre. */
  notes: string
  cree: string
  modifie: string
  /**
   * Champs d'en-tête que l'application ne connaît pas.
   *
   * Le dossier appartient à l'artiste : il peut ajouter ses propres clés,
   * ou en garder d'une version future. On les relit et on les réécrit
   * telles quelles plutôt que de les effacer silencieusement.
   */
  extra: Record<string, unknown>
  /** Chemin relatif du .md. Déduit du disque, jamais écrit dans l'en-tête. */
  fichier: string
}

export type BrouillonTableau = Omit<Tableau, 'ref' | 'fichier' | 'cree' | 'modifie'>

export interface Atelier {
  artiste: string
  prefixeRef: string
  prochainNumero: number
}

export interface EtatAtelier {
  chemin: string | null
  atelier: Atelier | null
}

export interface Anomalies {
  sansPhoto: number
  sansAnnee: number
}

export interface Catalogue {
  tableaux: Tableau[]
  anomalies: Anomalies
  /** Fichiers illisibles, signalés sans bloquer le reste du catalogue. */
  echecs: { fichier: string; erreur: string }[]
}

export type DiagSharp =
  | {
      ok: true
      sharpVersion: string
      libvipsVersion: string
      source: { largeur: number; hauteur: number; format: string; octets: number }
      vignette: { largeur: number; hauteur: number; octets: number }
      dureeMs: number
      empaquete: boolean
    }
  | { ok: false; erreur: string; empaquete: boolean }

/**
 * Surface exposée au renderer par le preload.
 *
 * Déclarée ici, dans le domaine partagé, et non dérivée de l'objet du
 * preload : le renderer ne doit jamais importer de code Node, et les deux
 * projets TypeScript restent étanches.
 */
export interface ApiAtelier {
  diagSharp: (chemin: string) => Promise<DiagSharp>

  atelierEtat: () => Promise<EtatAtelier>
  atelierChoisir: () => Promise<EtatAtelier>
  /** Premier lancement : le nom saisi devient celui de l'artiste. */
  atelierCreer: (nom: string) => Promise<EtatAtelier>
  atelierOuvrirDossier: () => Promise<void>
  /** Le préfixe ne vaut que pour les références à venir ; l'ancien reste. */
  atelierRenommer: (nom: string, prefixe: string) => Promise<EtatAtelier>

  lirePreferences: () => Promise<Preferences>
  ecrirePreferences: (preferences: Preferences) => Promise<void>
  reglerZoom: (niveau: number) => Promise<number>
  /** Le zoom change aussi au clavier ; rend de quoi se désabonner. */
  surZoom: (rappel: (niveau: number) => void) => () => void

  listerTableaux: () => Promise<Catalogue>
  creerTableau: (brouillon: BrouillonTableau) => Promise<Tableau>
  enregistrerTableau: (ref: string, brouillon: BrouillonTableau) => Promise<Tableau>
  supprimerTableau: (ref: string) => Promise<void>

  importerPhotos: (ref: string) => Promise<Tableau>
  retirerPhoto: (ref: string, photo: string) => Promise<Tableau>
  revelerTableau: (ref: string) => Promise<void>
}
