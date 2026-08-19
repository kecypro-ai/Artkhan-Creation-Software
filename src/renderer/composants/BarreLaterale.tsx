import { useEffect, useState } from 'react'
import { Check, FolderOpen, Image, LayoutGrid, Minus, Pencil, Plus, Repeat, ScrollText, Store, Users } from 'lucide-react'
import type { Anomalies, Atelier, Theme } from '@shared/types'
import type { Rubrique } from '../etat/magasin'
import { LIBELLE_THEME, pourcentageZoom, ZOOM_MAX, ZOOM_MIN } from '@shared/types'

const RUBRIQUES: { cle: Rubrique; libelle: string; Icone: typeof LayoutGrid; prete: boolean }[] = [
  { cle: 'tableaux', libelle: 'Tableaux', Icone: LayoutGrid, prete: true },
  { cle: 'acheteurs', libelle: 'Acheteurs', Icone: Users, prete: true },
  { cle: 'depots', libelle: 'Dépôts', Icone: Store, prete: true },
  { cle: 'certificats', libelle: 'Certificats', Icone: ScrollText, prete: true },
  { cle: 'series', libelle: 'Séries', Icone: Image, prete: true }
]

const THEMES: Theme[] = ['auto', 'clair', 'sombre']

interface Props {
  atelier: Atelier | null
  total: number
  anomalies: Anomalies
  rubrique: Rubrique
  zoom: number
  theme: Theme
  onRubrique: (rubrique: Rubrique) => void
  onOuvrirDossier: () => void
  onChangerAtelier: () => void
  onRenommer: (nom: string, prefixe: string) => void
  onZoom: (niveau: number) => void
  onTheme: (theme: Theme) => void
}

export function BarreLaterale({
  atelier,
  total,
  anomalies,
  rubrique,
  zoom,
  theme,
  onRubrique,
  onOuvrirDossier,
  onChangerAtelier,
  onRenommer,
  onZoom,
  onTheme
}: Props): React.JSX.Element {
  const [edition, setEdition] = useState(false)
  const [nom, setNom] = useState('')
  const [prefixe, setPrefixe] = useState('')

  // Rouvrir l'éditeur doit toujours partir des valeurs réellement enregistrées,
  // pas d'une saisie abandonnée la fois précédente.
  useEffect(() => {
    if (!edition && atelier !== null) {
      setNom(atelier.artiste)
      setPrefixe(atelier.prefixeRef)
    }
  }, [edition, atelier])

  function valider(): void {
    if (nom.trim() === '') return
    onRenommer(nom, prefixe)
    setEdition(false)
  }

  return (
    <aside className="colonne-gauche">
      {edition ? (
        <div className="artiste artiste--edition">
          <label className="champ">
            <span className="champ__libelle">Votre nom</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') valider()
                if (e.key === 'Escape') setEdition(false)
              }}
              autoFocus
              spellCheck={false}
            />
          </label>

          <label className="champ">
            <span className="champ__libelle">Préfixe des références</span>
            <input
              value={prefixe}
              onChange={(e) => setPrefixe(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') valider()
                if (e.key === 'Escape') setEdition(false)
              }}
              maxLength={4}
              spellCheck={false}
            />
          </label>

          <p className="artiste__note">Les références déjà attribuées ne changent pas.</p>

          <div className="artiste__actions">
            <button className="bouton-primaire" onClick={valider} disabled={nom.trim() === ''}>
              <Check size={15} strokeWidth={2} aria-hidden />
              Enregistrer
            </button>
            <button onClick={() => setEdition(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="artiste">
          <div className="artiste__ligne">
            <span className="artiste__nom">{atelier?.artiste ?? 'Atelier'}</span>
            <button
              className="artiste__modifier"
              onClick={() => setEdition(true)}
              title="Modifier votre nom"
              aria-label="Modifier votre nom"
            >
              <Pencil size={13} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          <div className="artiste__lieu">Atelier · {atelier?.prefixeRef ?? '—'}</div>
        </div>
      )}

      <nav className="menu">
        {RUBRIQUES.map(({ cle, libelle, Icone, prete }) => (
          <button
            key={cle}
            className="menu__item"
            aria-current={rubrique === cle}
            disabled={!prete}
            onClick={() => onRubrique(cle)}
            title={prete ? undefined : 'À venir'}
          >
            <Icone size={17} strokeWidth={1.75} aria-hidden />
            {libelle}
          </button>
        ))}
      </nav>

      <div className="pied">
        <div>
          {total} tableau{total > 1 ? 'x' : ''}
        </div>
        {anomalies.sansPhoto > 0 && <div>{anomalies.sansPhoto} sans photo</div>}
        {anomalies.sansAnnee > 0 && <div>{anomalies.sansAnnee} sans année</div>}

        <div className="themes" role="group" aria-label="Apparence">
          {THEMES.map((t) => (
            <button key={t} aria-pressed={theme === t} onClick={() => onTheme(t)}>
              {LIBELLE_THEME[t]}
            </button>
          ))}
        </div>

        <div className="zoom" title="Ctrl + et Ctrl − font la même chose">
          <button onClick={() => onZoom(zoom - 1)} disabled={zoom <= ZOOM_MIN} aria-label="Réduire l’affichage">
            <Minus size={13} strokeWidth={2} aria-hidden />
          </button>
          <button className="zoom__taux" onClick={() => onZoom(0)} aria-label="Revenir à 100 %">
            {pourcentageZoom(zoom)} %
          </button>
          <button onClick={() => onZoom(zoom + 1)} disabled={zoom >= ZOOM_MAX} aria-label="Agrandir l’affichage">
            <Plus size={13} strokeWidth={2} aria-hidden />
          </button>
        </div>

        <button className="pied__lien" onClick={onOuvrirDossier}>
          <FolderOpen size={12} strokeWidth={1.75} aria-hidden /> Ouvrir le dossier
        </button>

        <button className="pied__lien" onClick={onChangerAtelier}>
          <Repeat size={12} strokeWidth={1.75} aria-hidden /> Changer d’atelier
        </button>
      </div>
    </aside>
  )
}
