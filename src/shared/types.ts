export type Statut = 'atelier' | 'depot' | 'vendu' | 'offert'

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
}
