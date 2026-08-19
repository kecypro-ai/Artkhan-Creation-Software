import { useState } from 'react'
import { List } from 'lucide-react'
import { DEVISES, devisesDisponibles, normaliserDevise } from '@shared/devises'
import type { BrouillonTableau } from '@shared/types'
import { ChoixCarnet } from './ChoixCarnet'

const AUTRE = ' autre'

interface Props {
  brouillon: BrouillonTableau
  acheteurs: string[]
  /** Codes déjà employés dans l'atelier, proposés en plus de la liste. */
  devisesEmployees: string[]
  onModifier: (champs: Partial<BrouillonTableau>) => void
}

/**
 * Prix, acheteur, date et certificat.
 *
 * N'apparaît qu'au statut « Vendu ». Un formulaire qui grandit selon le
 * contexte est plus simple qu'un formulaire complet dont on ignore la moitié.
 */
export function VoletVente({ brouillon, acheteurs, devisesEmployees, onModifier }: Props): React.JSX.Element {
  const [devisePersonnalisee, setDevisePersonnalisee] = useState(
    () => brouillon.devise !== '' && !DEVISES.some((d) => d.code === brouillon.devise)
  )

  return (
    <section className="volet">
      <h3 className="volet__titre">Vente</h3>

      <div className="rangee">
        <label className="champ">
          <span className="champ__libelle">Prix</span>
          <input
            value={brouillon.prix === null ? '' : String(brouillon.prix)}
            onChange={(e) => {
              const n = Number(e.target.value.replace(',', '.').trim())
              onModifier({ prix: e.target.value.trim() === '' || !Number.isFinite(n) ? null : n })
            }}
            inputMode="decimal"
            placeholder="Facultatif"
          />
        </label>

        <div className="champ">
          <span className="champ__libelle">Devise</span>
          {devisePersonnalisee ? (
            <div className="choix-carnet">
              <input
                value={brouillon.devise}
                onChange={(e) => onModifier({ devise: normaliserDevise(e.target.value) })}
                placeholder="Code à trois lettres"
                maxLength={3}
                autoFocus
                spellCheck={false}
              />
              <button
                className="icone"
                onClick={() => setDevisePersonnalisee(false)}
                title="Choisir dans la liste"
                aria-label="Choisir dans la liste"
              >
                <List size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          ) : (
            <select
              value={brouillon.devise || 'EUR'}
              onChange={(e) => {
                if (e.target.value === AUTRE) {
                  onModifier({ devise: '' })
                  setDevisePersonnalisee(true)
                } else {
                  onModifier({ devise: e.target.value })
                }
              }}
            >
              {devisesDisponibles(devisesEmployees, brouillon.devise).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.libelle}
                </option>
              ))}
              <option value={AUTRE}>Ajouter une devise…</option>
            </select>
          )}
        </div>
      </div>

      <div className="champ">
        <span className="champ__libelle">Acheteur</span>
        <ChoixCarnet
          type="acheteurs"
          valeur={brouillon.acheteur}
          noms={acheteurs}
          placeholder="Nom, galerie, collection"
          onChange={(acheteur) => onModifier({ acheteur })}
        />
      </div>

      <label className="champ">
        <span className="champ__libelle">Date de vente</span>
        <input
          type="date"
          value={brouillon.dateVente}
          onChange={(e) => onModifier({ dateVente: e.target.value })}
        />
      </label>
    </section>
  )
}
