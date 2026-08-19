import type { ColonneTri, Preferences, Tableau } from '@shared/types'
import { BarreOutils } from '../composants/BarreOutils'
import { CarteTableau } from '../composants/CarteTableau'
import { TableauLignes } from '../composants/TableauLignes'

interface Props {
  /** Catalogue entier, pour compter les onglets de statut. */
  tableaux: Tableau[]
  /** Sous-ensemble filtré et trié, réellement affiché. */
  visibles: Tableau[]
  recherche: string
  preferences: Preferences
  onRecherche: (v: string) => void
  onPreferences: (p: Partial<Preferences>) => void
  onAjouter: () => void
  onOuvrir: (ref: string) => void
}

export function VueTableaux({
  tableaux,
  visibles,
  recherche,
  preferences,
  onRecherche,
  onPreferences,
  onAjouter,
  onOuvrir
}: Props): React.JSX.Element {
  /** Recliquer sur la colonne déjà triée inverse le sens. */
  function trierPar(colonne: ColonneTri): void {
    if (colonne === preferences.tri) {
      onPreferences({ sens: preferences.sens === 'asc' ? 'desc' : 'asc' })
    } else {
      onPreferences({ tri: colonne, sens: 'asc' })
    }
  }

  return (
    <>
      {/* Hors du conteneur défilant : c'est ce qui rendait les en-têtes
          collants nécessaires, et ce sont eux qui cassaient l'affichage. */}
      <BarreOutils
        tableaux={tableaux}
        recherche={recherche}
        preferences={preferences}
        onRecherche={onRecherche}
        onPreferences={onPreferences}
        onAjouter={onAjouter}
      />

      <div className="catalogue">
        {visibles.length === 0 ? (
          <p className="vide-total">
            {tableaux.length === 0
              ? 'Votre atelier est vide. Ajoutez un premier tableau.'
              : 'Aucun tableau ne correspond.'}
          </p>
        ) : preferences.modeVue === 'lignes' ? (
          <TableauLignes tableaux={visibles} preferences={preferences} onTri={trierPar} onOuvrir={onOuvrir} />
        ) : (
          <div className="grille">
            {visibles.map((t) => (
              <CarteTableau key={t.ref} tableau={t} onOuvrir={onOuvrir} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
