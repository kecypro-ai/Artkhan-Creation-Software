import { ImagePlus, X } from 'lucide-react'
import { urlMedia } from '@shared/medias'

interface Props {
  photos: string[]
  active: number
  alt: string
  onChoisir: (index: number) => void
  onAjouter: () => void
  onRetirer: (photo: string) => void
}

export function Pellicule({ photos, active, alt, onChoisir, onAjouter, onRetirer }: Props): React.JSX.Element {
  const affichee = photos[active] ?? photos[0]

  return (
    <div className="photos">
      <button className="depot-photo" onClick={onAjouter}>
        {affichee === undefined ? (
          <>
            <ImagePlus size={26} strokeWidth={1.5} aria-hidden />
            <span className="depot-photo__libelle">Ajouter des photos</span>
            <span className="depot-photo__aide">Face, dos, signature</span>
          </>
        ) : (
          <img src={urlMedia(affichee)} alt={alt} />
        )}
      </button>

      {photos.length > 0 && (
        <div className="pellicule">
          {photos.map((photo, i) => (
            <div key={photo} className="pellicule__case" aria-current={i === active}>
              <img
                src={urlMedia(photo)}
                alt={`Photo ${i + 1}`}
                onClick={() => onChoisir(i)}
                style={{ cursor: 'pointer' }}
              />
              <button
                className="pellicule__retirer"
                onClick={() => onRetirer(photo)}
                title="Retirer cette photo"
                aria-label="Retirer cette photo"
              >
                <X size={13} strokeWidth={2} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
