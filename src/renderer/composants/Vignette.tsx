import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { urlVignette } from '@shared/medias'

interface Props {
  photo: string | undefined
  alt: string
  /** « carte » occupe la largeur disponible, « ligne » tient dans un tableau. */
  taille?: 'carte' | 'ligne'
}

/**
 * Cadre d'image tolérant.
 *
 * Une photo peut avoir été déplacée ou supprimée hors de l'application : le
 * cadre vide est un état normal du catalogue, pas une erreur à signaler.
 */
export function Vignette({ photo, alt, taille = 'carte' }: Props): React.JSX.Element {
  const classe = taille === 'ligne' ? 'vignette vignette--ligne' : 'vignette'
  const [echec, setEchec] = useState(false)

  if (photo === undefined || echec) {
    return (
      <div className={`${classe} vignette--vide`}>
        <ImageOff size={taille === 'ligne' ? 14 : 22} strokeWidth={1.5} aria-hidden />
      </div>
    )
  }

  return (
    <div className={classe}>
      <img src={urlVignette(photo)} alt={alt} loading="lazy" onError={() => setEchec(true)} />
    </div>
  )
}
