import { stat } from 'node:fs/promises'
import { listerTableaux } from './atelier/depot'
import { vignette } from './vignettes'

/**
 * Contrôle sans fenêtre d'un atelier réel, destiné à l'application empaquetée.
 *
 * L'empaquetage est le moment où les choses cassent : sharp est extrait de
 * l'archive asar, les chemins changent, le processus n'a plus de console. Un
 * contrôle qui exige de cliquer dans l'interface ne serait jamais fait. Celui-ci
 * s'exécute avant le verrou d'instance unique, donc sans déranger une fenêtre
 * déjà ouverte, et rend un compte rendu lisible par une machine.
 */
export interface Verification {
  ok: boolean
  empaquete: boolean
  atelier: string
  tableaux: number
  avecPhoto: number
  illisibles: { fichier: string; erreur: string }[]
  vignette: { photo: string; octets: number } | null
  dureeMs: number
  erreur?: string
}

export async function verifierAtelier(racine: string, empaquete: boolean): Promise<Verification> {
  const debut = process.hrtime.bigint()
  const compteRendu: Verification = {
    ok: false,
    empaquete,
    atelier: racine,
    tableaux: 0,
    avecPhoto: 0,
    illisibles: [],
    vignette: null,
    dureeMs: 0
  }

  try {
    const catalogue = await listerTableaux(racine)
    compteRendu.tableaux = catalogue.tableaux.length
    compteRendu.avecPhoto = catalogue.tableaux.filter((t) => t.photos.length > 0).length
    compteRendu.illisibles = catalogue.echecs

    // Fabriquer une vignette pour de bon : c'est la seule façon de savoir que
    // sharp fonctionne depuis l'archive, sur une vraie photo de l'atelier.
    const premiere = catalogue.tableaux.find((t) => t.photos.length > 0)?.photos[0]
    if (premiere !== undefined) {
      const fabriquee = await vignette(racine, premiere)
      if (fabriquee !== null) {
        compteRendu.vignette = { photo: premiere, octets: (await stat(fabriquee)).size }
      }
    }

    compteRendu.ok = compteRendu.illisibles.length === 0 && (compteRendu.avecPhoto === 0 || compteRendu.vignette !== null)
  } catch (e) {
    compteRendu.erreur = e instanceof Error ? e.message : String(e)
  }

  compteRendu.dureeMs = Number(process.hrtime.bigint() - debut) / 1e6
  return compteRendu
}
