import { anneeTexte, dimensionsTexte, sansTitre, titreTexte } from '@shared/libelles'
import { refComplete } from '@shared/reference'
import type { ColonneTri, Preferences, Tableau } from '@shared/types'
import { LIBELLE_STATUT } from '@shared/types'
import { Vignette } from './Vignette'

const COLONNES: { cle: ColonneTri | null; nom: string; classe?: string }[] = [
  { cle: null, nom: '' },
  { cle: 'titre', nom: 'Titre' },
  { cle: 'ref', nom: 'Référence' },
  { cle: 'annee', nom: 'Année', classe: 'num' },
  { cle: 'dimensions', nom: 'Dimensions', classe: 'num' },
  { cle: null, nom: 'Statut' },
  { cle: null, nom: 'Lieu' }
]

interface Props {
  tableaux: Tableau[]
  preferences: Preferences
  onTri: (colonne: ColonneTri) => void
  onOuvrir: (ref: string) => void
}

/**
 * Vue dense : une ligne par œuvre.
 *
 * C'est le mode utile quand on cherche plutôt que quand on contemple. La
 * vignette reste présente mais menue : sans elle, rien ne distingue deux
 * « Sans titre » l'un de l'autre.
 */
export function TableauLignes({ tableaux, preferences, onTri, onOuvrir }: Props): React.JSX.Element {
  return (
    <div className="lignes">
      <table>
        <thead>
          <tr>
            {COLONNES.map((c) => (
              <th key={c.nom} className={c.classe} aria-sort={c.cle === preferences.tri ? 'other' : undefined}>
                {c.cle === null ? (
                  c.nom
                ) : (
                  <button onClick={() => onTri(c.cle as ColonneTri)} aria-pressed={c.cle === preferences.tri}>
                    {c.nom}
                    {c.cle === preferences.tri && (
                      <span aria-hidden>{preferences.sens === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {tableaux.map((t) => {
            return (
              <tr key={t.ref} onClick={() => onOuvrir(t.ref)} tabIndex={0}>
                <td className="lignes__photo">
                  <Vignette photo={t.photos[0]} alt="" taille="ligne" />
                </td>

                <td className={sansTitre(t) ? 'lignes__titre lignes__titre--absent' : 'lignes__titre'}>
                  {titreTexte(t)}
                </td>

                <td className="ref">{refComplete(t)}</td>
                <td className="num">{anneeTexte(t)}</td>
                <td className="num">{dimensionsTexte(t, { unite: '' })}</td>

                <td>
                  <span className={`pastille pastille--${t.statut}`}>{LIBELLE_STATUT[t.statut]}</span>
                </td>

                <td className="lignes__lieu">{t.lieu === '' ? '—' : t.lieu}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
