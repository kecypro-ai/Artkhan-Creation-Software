import { useEffect, useState } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { titreTexte } from '@shared/libelles'
import { refComplete } from '@shared/reference'
import type { Atelier, BrouillonTableau, Certitude, Statut, Tableau } from '@shared/types'
import { LIBELLE_CERTITUDE, LIBELLE_STATUT, STATUTS } from '@shared/types'
import { ChoixCarnet } from '../composants/ChoixCarnet'
import { Pellicule } from '../composants/Pellicule'
import { VoletCertificat } from '../composants/VoletCertificat'
import { VoletVente } from '../composants/VoletVente'
import { versBrouillon, type Enregistrement } from '../etat/magasin'
import { useBrouillon } from '../etat/useBrouillon'

const TECHNIQUES = [
  'Huile sur toile',
  'Acrylique sur toile',
  'Huile sur panneau',
  'Technique mixte',
  'Aquarelle',
  'Encre',
  'Pastel',
  'Fusain'
]

const CERTITUDES: Certitude[] = ['certaine', 'approximative', 'inconnue']

function nombreOuNull(v: string): number | null {
  const nettoye = v.replace(',', '.').trim()
  if (nettoye === '') return null
  const n = Number(nettoye)
  return Number.isFinite(n) ? n : null
}

function afficher(n: number | null): string {
  return n === null ? '' : String(n)
}

/** Le champ « lieu » ne demande pas la même chose selon le statut. */
function libelleLieu(statut: Statut): string {
  if (statut === 'depot') return 'Chez qui, ou dans quelle galerie ?'
  if (statut === 'vendu') return 'Où se trouve-t-il aujourd’hui ?'
  if (statut === 'offert') return 'Offert à qui ?'
  return 'Emplacement dans l’atelier'
}

interface Props {
  tableau: Tableau
  enregistrement: Enregistrement
  acheteurs: string[]
  depots: string[]
  series: string[]
  devisesEmployees: string[]
  atelier: Atelier | null
  cheminPdf: string | null
  occupeCertificat: boolean
  onRetour: () => void
  onEnregistrer: (ref: string, brouillon: BrouillonTableau) => void
  onSupprimer: (ref: string) => void
  onImporterPhotos: (ref: string) => void
  onRetirerPhoto: (ref: string, photo: string) => void
  onCertificatPdf: (ref: string) => void
  onCertificatImprimer: (ref: string) => void
  onCertificatOuvrir: (fichier: string) => void
}

export function VueFiche({
  tableau,
  enregistrement,
  acheteurs,
  depots,
  series,
  devisesEmployees,
  atelier,
  cheminPdf,
  occupeCertificat,
  onRetour,
  onEnregistrer,
  onSupprimer,
  onImporterPhotos,
  onRetirerPhoto,
  onCertificatPdf,
  onCertificatImprimer,
  onCertificatOuvrir
}: Props): React.JSX.Element {
  const [onglet, setOnglet] = useState<'fiche' | 'certificat'>('fiche')
  const [apercu, setApercu] = useState(0)

  const {
    valeur: brouillon,
    sale,
    modifier,
    remplacer,
    forcer
  } = useBrouillon(versBrouillon(tableau), tableau.ref, (v) => onEnregistrer(tableau.ref, v))

  // Les photos changent hors du formulaire, par l'import ou le retrait.
  useEffect(() => {
    remplacer({ photos: tableau.photos })
    setApercu(0)
  }, [tableau.photos, remplacer])

  function retour(): void {
    forcer()
    onRetour()
  }

  return (
    <div className="fiche">
      <header className="fiche__entete">
        <button className="fiche__retour" onClick={retour}>
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden />
          Tableaux
        </button>
        <span className="fiche__titre">{titreTexte(brouillon)}</span>
        <span className="fiche__etat" aria-live="polite">
          {sale || enregistrement === 'en-cours'
            ? 'Enregistrement…'
            : enregistrement === 'enregistre'
              ? 'Enregistré'
              : ''}
        </span>
        <span className="fiche__ref">{refComplete({ ref: tableau.ref, serie: brouillon.serie })}</span>
      </header>

      <nav className="onglets onglets--fiche">
        <button aria-pressed={onglet === 'fiche'} onClick={() => setOnglet('fiche')}>
          Fiche
        </button>
        <button aria-pressed={onglet === 'certificat'} onClick={() => setOnglet('certificat')}>
          Certificat
        </button>
      </nav>

      {onglet === 'certificat' ? (
        <VoletCertificat
          tableau={tableau}
          brouillon={brouillon}
          atelier={atelier}
          onModifier={modifier}
          onPdf={() => onCertificatPdf(tableau.ref)}
          onImprimer={() => onCertificatImprimer(tableau.ref)}
          onOuvrir={() => cheminPdf !== null && onCertificatOuvrir(cheminPdf)}
          pdfCree={cheminPdf !== null}
          occupe={occupeCertificat}
        />
      ) : (
        <div className="fiche__corps">
          <Pellicule
            photos={brouillon.photos}
            active={apercu}
            alt={titreTexte(brouillon)}
            onChoisir={setApercu}
            onAjouter={() => onImporterPhotos(tableau.ref)}
            onRetirer={(photo) => onRetirerPhoto(tableau.ref, photo)}
          />

          <div className="formulaire">
            <label className="champ">
              <span className="champ__libelle">Titre du tableau</span>
              <input
                value={brouillon.titre}
                onChange={(e) => modifier({ titre: e.target.value })}
                placeholder="Sans titre"
              />
            </label>

            <div className="rangee">
              <label className="champ">
                <span className="champ__libelle">Année</span>
                <input
                  value={afficher(brouillon.annee)}
                  onChange={(e) => modifier({ annee: nombreOuNull(e.target.value) })}
                  placeholder="Inconnue"
                  inputMode="numeric"
                />
              </label>

              <label className="champ">
                <span className="champ__libelle">Certitude</span>
                <select
                  value={brouillon.certitude}
                  onChange={(e) => modifier({ certitude: e.target.value as Certitude })}
                >
                  {CERTITUDES.map((c) => (
                    <option key={c} value={c}>
                      {LIBELLE_CERTITUDE[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="champ">
              <span className="champ__libelle">Technique</span>
              <input
                value={brouillon.technique}
                onChange={(e) => modifier({ technique: e.target.value })}
                list="techniques"
                placeholder="Huile sur toile"
              />
              <datalist id="techniques">
                {TECHNIQUES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>

            <div className="rangee">
              <label className="champ">
                <span className="champ__libelle">Hauteur (cm)</span>
                <input
                  value={afficher(brouillon.hauteur)}
                  onChange={(e) => modifier({ hauteur: nombreOuNull(e.target.value) })}
                  inputMode="decimal"
                />
              </label>

              <label className="champ">
                <span className="champ__libelle">Largeur (cm)</span>
                <input
                  value={afficher(brouillon.largeur)}
                  onChange={(e) => modifier({ largeur: nombreOuNull(e.target.value) })}
                  inputMode="decimal"
                />
              </label>
            </div>

            <div className="champ">
              <span className="champ__libelle">Où se trouve le tableau ?</span>
              <div className="segments">
                {STATUTS.map((s) => (
                  <button key={s} aria-pressed={brouillon.statut === s} onClick={() => modifier({ statut: s })}>
                    {LIBELLE_STATUT[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="champ">
              <span className="champ__libelle">{libelleLieu(brouillon.statut)}</span>
              {brouillon.statut === 'depot' ? (
                <ChoixCarnet
                  type="depots"
                  valeur={brouillon.lieu}
                  noms={depots}
                  placeholder="Galerie, salon, prêt…"
                  onChange={(lieu) => modifier({ lieu })}
                />
              ) : (
                <input
                  value={brouillon.lieu}
                  onChange={(e) => modifier({ lieu: e.target.value })}
                  placeholder="Facultatif"
                />
              )}
            </div>

            {brouillon.statut === 'vendu' && (
              <VoletVente
                brouillon={brouillon}
                acheteurs={acheteurs}
                devisesEmployees={devisesEmployees}
                onModifier={modifier}
              />
            )}

            <div className="champ">
              <span className="champ__libelle">Série</span>
              <ChoixCarnet
                type="series"
                valeur={brouillon.serie}
                noms={series}
                placeholder="Aucune"
                onChange={(serie) => modifier({ serie })}
              />
              {brouillon.serie.trim() !== '' && (
                <span className="champ__aide">
                  La référence devient {refComplete({ ref: tableau.ref, serie: brouillon.serie })}
                </span>
              )}
            </div>

            <label className="champ">
              <span className="champ__libelle">Notes</span>
              <textarea
                value={brouillon.notes}
                onChange={(e) => modifier({ notes: e.target.value })}
                placeholder="Souvenirs, contexte, ce dont vous vous rappelez"
              />
            </label>

            <div className="fiche__actions">
              <button className="bouton-danger" onClick={() => onSupprimer(tableau.ref)}>
                <Trash2 size={15} strokeWidth={1.75} aria-hidden /> Mettre à la corbeille
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
