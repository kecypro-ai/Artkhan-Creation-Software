import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { urlVignette } from '@shared/medias'

interface Props {
  photo: string | undefined
  alt: string
}

/**
 * Cadre d'image tolérant.
 *
 * Une photo peut avoir été déplacée ou supprimée hors de l'application : le
 * cadre vide est un état normal du catalogue, pas une erreur à signaler.
 */
export function Vignette({ photo, alt }: Props): React.JSX.Element {
  const [echec, setEchec] = useState(false)

  if (photo === undefined || echec) {
    return (
      <div className="vignette vignette--vide">
        <ImageOff size={22} strokeWidth={1.5} aria-hidden />
      </div>
    )
  }

  return (
    <div className="vignette">
      <img src={urlVignette(photo)} alt={alt} loading="lazy" onError={() => setEchec(true)} />
    </div>
  )
}
