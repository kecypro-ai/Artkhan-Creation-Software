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
