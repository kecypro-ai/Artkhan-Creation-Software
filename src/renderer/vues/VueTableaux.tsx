import { Plus, Search } from 'lucide-react'
import type { Statut, Tableau } from '@shared/types'
import { LIBELLE_STATUT } from '@shared/types'
import { CarteTableau } from '../composants/CarteTableau'

const COLONNES: { statut: Statut; nom: string; toujours: boolean }[] = [
  { statut: 'atelier', nom: LIBELLE_STATUT.atelier, toujours: true },
  { statut: 'depot', nom: LIBELLE_STATUT.depot, toujours: true },
  { statut: 'vendu', nom: 'Vendus', toujours: true },
  // « Offert » n'occupe une colonne que s'il y a quelque chose à y montrer :
  // trois colonnes respirent mieux que quatre, dont une vide.
  { statut: 'offert', nom: 'Offerts', toujours: false }
]

interface Props {
  tableaux: Tableau[]
  recherche: string
  onRecherche: (v: string) => void
  onAjouter: () => void
  onOuvrir: (ref: string) => void
}

export function VueTableaux({ tableaux, recherche, onRecherche, onAjouter, onOuvrir }: Props): React.JSX.Element {
  const planches = COLONNES.map((c) => ({
    ...c,
    tableaux: tableaux.filter((t) => t.statut === c.statut)
  })).filter((c) => c.toujours || c.tableaux.length > 0)

  const filtre = recherche.trim() !== ''

  return (
    <>
      <div className="entete">
        <div className="recherche">
          <Search className="recherche__icone" size={17} strokeWidth={1.75} aria-hidden />
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher un tableau"
            spellCheck={false}
            aria-label="Rechercher un tableau"
          />
        </div>

        <button className="bouton-primaire" onClick={onAjouter}>
          <Plus size={17} strokeWidth={2.25} aria-hidden />
          Ajouter un tableau
        </button>
      </div>

      {tableaux.length === 0 ? (
        <div className="vide-total">
          {filtre ? 'Aucun tableau ne correspond à cette recherche.' : 'Votre atelier est vide. Ajoutez un premier tableau.'}
        </div>
      ) : (
        <div className="planches" style={{ gridTemplateColumns: `repeat(${planches.length}, minmax(0, 1fr))` }}>
          {planches.map((colonne) => (
            <section key={colonne.statut}>
              <header className="colonne__titre">
                <h2 className="colonne__nom">{colonne.nom}</h2>
                <span className="colonne__compte">{colonne.tableaux.length}</span>
              </header>

              <div className="colonne__liste">
                {colonne.tableaux.length === 0 ? (
                  <p className="colonne__vide">Aucun tableau</p>
                ) : (
                  colonne.tableaux.map((t) => <CarteTableau key={t.ref} tableau={t} onOuvrir={onOuvrir} />)
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
