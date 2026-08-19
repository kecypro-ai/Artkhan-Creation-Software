import { resumeOeuvre, sansTitre, titreTexte } from '@shared/libelles'
import type { Tableau } from '@shared/types'
import { Vignette } from './Vignette'

interface Props {
  tableau: Tableau
  onOuvrir: (ref: string) => void
}

export function CarteTableau({ tableau, onOuvrir }: Props): React.JSX.Element {
  const absent = sansTitre(tableau)

  return (
    <button className="carte" onClick={() => onOuvrir(tableau.ref)}>
      <Vignette photo={tableau.photos[0]} alt={absent ? tableau.ref : tableau.titre} />

      <div className={absent ? 'carte__titre carte__titre--absent' : 'carte__titre'}>{titreTexte(tableau)}</div>

      <div className="carte__meta">{resumeOeuvre(tableau)}</div>

      {(tableau.lieu !== '' || tableau.serie !== '') && (
        <div className="carte__etiquettes">
          {tableau.lieu !== '' && (
            <span className={tableau.statut === 'vendu' ? 'etiquette etiquette--vendu' : 'etiquette'}>
              {tableau.lieu}
            </span>
          )}
          {tableau.serie !== '' && <span className="etiquette etiquette--serie">{tableau.serie}</span>}
        </div>
      )}
    </button>
  )
}
