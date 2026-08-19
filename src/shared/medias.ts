export const SCHEME_VIGNETTE = 'artkhan-thumb'
export const SCHEME_MEDIA = 'artkhan-media'

/**
 * Fabrique les adresses d'images servies par le processus principal.
 *
 * Le chemin voyage en paramètre de requête plutôt que dans l'hôte : Chromium
 * normalise l'hôte en minuscules, ce qui casserait « Photos/CK-031/Face.jpg ».
 * Ces deux fonctions vivent dans le domaine partagé pour que le renderer
 * compose ses adresses sans aller-retour avec le processus principal.
 */
export function urlVignette(photo: string): string {
  return `${SCHEME_VIGNETTE}://a/?p=${encodeURIComponent(photo)}`
}

export function urlMedia(photo: string): string {
  return `${SCHEME_MEDIA}://a/?p=${encodeURIComponent(photo)}`
}
