import type { Tableau } from '@shared/types'
import { Vignette } from './Vignette'

/**
 * Résume une œuvre en une ligne, sans jamais inventer.
 *
 * Un catalogue reconstitué de mémoire est plein de trous : plutôt que de
 * masquer les fiches incomplètes, la carte les nomme. « Année à vérifier »
 * est une information utile, une case vide ne l'est pas.
 */
export function ligneMeta(t: Tableau): string {
  const morceaux: string[] = []

  if (t.annee === null) morceaux.push('Année à vérifier')
  else morceaux.push(t.certitude === 'approximative' ? `vers ${t.annee}` : String(t.annee))

  if (t.hauteur !== null && t.largeur !== null) morceaux.push(`${t.hauteur} × ${t.largeur} cm`)
  if (t.photos.length === 0) morceaux.push('photo manquante')

  return morceaux.join(' · ')
}

interface Props {
  tableau: Tableau
  onOuvrir: (ref: string) => void
}

export function CarteTableau({ tableau, onOuvrir }: Props): React.JSX.Element {
  const sansTitre = tableau.titre.trim() === ''

  return (
    <button className="carte" onClick={() => onOuvrir(tableau.ref)}>
      <Vignette photo={tableau.photos[0]} alt={sansTitre ? tableau.ref : tableau.titre} />

      <div className={sansTitre ? 'carte__titre carte__titre--absent' : 'carte__titre'}>
        {sansTitre ? 'Sans titre' : tableau.titre}
      </div>

      <div className="carte__meta">{ligneMeta(tableau)}</div>

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
