import { ArrowDownNarrowWide, ArrowUpNarrowWide, LayoutGrid, Plus, Rows3, Search } from 'lucide-react'
import { compter, ONGLETS } from '@shared/liste'
import type { ColonneTri, FiltreStatut, PorteeRecherche, Preferences, Tableau } from '@shared/types'
import { LIBELLE_PORTEE, LIBELLE_STATUT, LIBELLE_TRI } from '@shared/types'

const LIBELLE_ONGLET: Record<FiltreStatut, string> = {
  tous: 'Tous',
  atelier: LIBELLE_STATUT.atelier,
  depot: LIBELLE_STATUT.depot,
  vendu: 'Vendus',
  offert: 'Offerts'
}

const TRIS: ColonneTri[] = ['ajout', 'titre', 'ref', 'annee', 'dimensions', 'prix']
const PORTEES: PorteeRecherche[] = ['partout', 'titre', 'acheteur', 'notes']

interface Props {
  tableaux: Tableau[]
  recherche: string
  preferences: Preferences
  onRecherche: (v: string) => void
  onPreferences: (p: Partial<Preferences>) => void
  onAjouter: () => void
}

export function BarreOutils({
  tableaux,
  recherche,
  preferences,
  onRecherche,
  onPreferences,
  onAjouter
}: Props): React.JSX.Element {
  const comptes = compter(tableaux)

  // Un onglet vide reste visible — il dit quelque chose. « Offerts » fait
  // exception : la plupart des artistes n'offrent jamais, autant ne pas leur
  // imposer un onglet mort en permanence.
  const onglets = ONGLETS.filter((o) => o !== 'offert' || comptes.offert > 0 || preferences.filtre === 'offert')

  return (
    <div className="outils">
      <div className="outils__ligne">
        <div className="recherche">
          <Search className="recherche__icone" size={17} strokeWidth={1.75} aria-hidden />
          <input
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            placeholder="Rechercher un tableau"
            spellCheck={false}
            aria-label="Rechercher un tableau"
          />
          <select
            className="recherche__portee"
            value={preferences.portee}
            onChange={(e) => onPreferences({ portee: e.target.value as PorteeRecherche })}
            aria-label="Où chercher"
          >
            {PORTEES.map((p) => (
              <option key={p} value={p}>
                {LIBELLE_PORTEE[p]}
              </option>
            ))}
          </select>
        </div>

        <button className="bouton-primaire" onClick={onAjouter}>
          <Plus size={17} strokeWidth={2.25} aria-hidden />
          Ajouter un tableau
        </button>
      </div>

      <div className="outils__ligne">
        <nav className="onglets">
          {onglets.map((o) => (
            <button key={o} aria-pressed={preferences.filtre === o} onClick={() => onPreferences({ filtre: o })}>
              {LIBELLE_ONGLET[o]}
              <span className="onglets__compte">{comptes[o]}</span>
            </button>
          ))}
        </nav>

        <div className="outils__droite">
          <label className="tri">
            <span className="tri__libelle">Trier par</span>
            <select
              value={preferences.tri}
              onChange={(e) => onPreferences({ tri: e.target.value as ColonneTri })}
              aria-label="Trier par"
            >
              {TRIS.map((c) => (
                <option key={c} value={c}>
                  {LIBELLE_TRI[c]}
                </option>
              ))}
            </select>
          </label>

          <button
            className="icone"
            onClick={() => onPreferences({ sens: preferences.sens === 'asc' ? 'desc' : 'asc' })}
            title={preferences.sens === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            aria-label={preferences.sens === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
          >
            {preferences.sens === 'asc' ? (
              <ArrowUpNarrowWide size={17} strokeWidth={1.75} aria-hidden />
            ) : (
              <ArrowDownNarrowWide size={17} strokeWidth={1.75} aria-hidden />
            )}
          </button>

          <div className="bascule">
            <button
              aria-pressed={preferences.modeVue === 'lignes'}
              onClick={() => onPreferences({ modeVue: 'lignes' })}
              title="Affichage en liste"
              aria-label="Affichage en liste"
            >
              <Rows3 size={16} strokeWidth={1.75} aria-hidden />
            </button>
            <button
              aria-pressed={preferences.modeVue === 'grille'}
              onClick={() => onPreferences({ modeVue: 'grille' })}
              title="Affichage en grille"
              aria-label="Affichage en grille"
            >
              <LayoutGrid size={16} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
