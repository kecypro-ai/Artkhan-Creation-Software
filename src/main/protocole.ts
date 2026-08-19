import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import { SCHEME_MEDIA, SCHEME_VIGNETTE } from '@shared/medias'
import { dansAtelier } from './atelier/chemins'
import { vignette } from './vignettes'

/**
 * Deux protocoles maison pour afficher les photos de l'atelier.
 *
 * Le renderer est en bac à sable et ne lit aucun fichier : il ne connaît que
 * des chemins relatifs, que le processus principal résout et vérifie. Rien ne
 * sort du dossier d'atelier, et un chemin forgé depuis la page ne peut pas
 * servir à lire ailleurs sur le disque.
 */
export function declarerProtocoles(): void {
  protocol.registerSchemesAsPrivileged(
    [SCHEME_VIGNETTE, SCHEME_MEDIA].map((scheme) => ({
      scheme,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true }
    }))
  )
}

function cheminDemande(requete: Request): string | null {
  return new URL(requete.url).searchParams.get('p')
}

function servir(absolu: string): Promise<Response> {
  return net.fetch(pathToFileURL(absolu).toString())
}

export function brancherProtocoles(racine: () => string | null): void {
  protocol.handle(SCHEME_VIGNETTE, async (requete) => {
    const base = racine()
    const photo = cheminDemande(requete)
    if (base === null || photo === null) return new Response(null, { status: 404 })

    const fabriquee = await vignette(base, photo)
    if (fabriquee === null) return new Response(null, { status: 404 })
    return servir(fabriquee)
  })

  protocol.handle(SCHEME_MEDIA, async (requete) => {
    const base = racine()
    const photo = cheminDemande(requete)
    if (base === null || photo === null) return new Response(null, { status: 404 })

    const absolu = dansAtelier(base, photo)
    if (absolu === null) return new Response(null, { status: 404 })
    return servir(absolu)
  })
}
