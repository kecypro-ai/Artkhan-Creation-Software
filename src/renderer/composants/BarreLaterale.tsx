import { FolderOpen, Image, LayoutGrid, Repeat, ScrollText, Users } from 'lucide-react'
import type { Anomalies, Atelier } from '@shared/types'

const RUBRIQUES = [
  { cle: 'tableaux', libelle: 'Tableaux', Icone: LayoutGrid, prete: true },
  { cle: 'acheteurs', libelle: 'Acheteurs', Icone: Users, prete: false },
  { cle: 'certificats', libelle: 'Certificats', Icone: ScrollText, prete: false },
  { cle: 'series', libelle: 'Séries', Icone: Image, prete: false }
] as const

interface Props {
  atelier: Atelier | null
  total: number
  anomalies: Anomalies
  onOuvrirDossier: () => void
  onChangerAtelier: () => void
}

export function BarreLaterale({
  atelier,
  total,
  anomalies,
  onOuvrirDossier,
  onChangerAtelier
}: Props): React.JSX.Element {
  return (
    <aside className="colonne-gauche">
      <div className="artiste">
        <div className="artiste__nom">{atelier?.artiste ?? 'Atelier'}</div>
        <div className="artiste__lieu">Atelier</div>
      </div>

      <nav className="menu">
        {RUBRIQUES.map(({ cle, libelle, Icone, prete }) => (
          <button
            key={cle}
            className="menu__item"
            aria-current={prete}
            disabled={!prete}
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
