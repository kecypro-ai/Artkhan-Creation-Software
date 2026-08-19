import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ImagePlus, List, Trash2, X } from 'lucide-react'
import { DEVISES, devisesDisponibles, normaliserDevise } from '@shared/devises'
import { urlMedia } from '@shared/medias'
import { refComplete } from '@shared/reference'
import { ChoixCarnet } from '../composants/ChoixCarnet'
import { VoletCertificat } from '../composants/VoletCertificat'
import type { Atelier, BrouillonTableau, Certitude, Statut, Tableau } from '@shared/types'
import { LIBELLE_CERTITUDE, LIBELLE_STATUT, STATUTS } from '@shared/types'
import { versBrouillon, type Enregistrement } from '../etat/magasin'

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

const DELAI_ENREGISTREMENT = 600
const AUTRE_DEVISE = ' autre'

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
  atelier: Atelier | null
  pdfCree: boolean
  occupeCertificat: boolean
  /** Codes déjà employés dans l'atelier, proposés en plus de la liste. */
  devisesEmployees: string[]
  onRetour: () => void
  onEnregistrer: (ref: string, brouillon: BrouillonTableau) => void
  onSupprimer: (ref: string) => void
  onImporterPhotos: (ref: string) => void
  onRetirerPhoto: (ref: string, photo: string) => void
  onCertificatPdf: (ref: string) => void
  onCertificatImprimer: (ref: string) => void
  onCertificatOuvrir: (ref: string) => void
}

export function VueFiche({
  tableau,
  enregistrement,
  acheteurs,
  depots,
  series,
  atelier,
  pdfCree,
  occupeCertificat,
  devisesEmployees,
  onRetour,
  onEnregistrer,
  onSupprimer,
  onImporterPhotos,
  onRetirerPhoto,
  onCertificatPdf,
  onCertificatImprimer,
  onCertificatOuvrir
}: Props): React.JSX.Element {
  const [brouillon, setBrouillon] = useState<BrouillonTableau>(() => versBrouillon(tableau))
  const [sale, setSale] = useState(false)
  const [apercu, setApercu] = useState(0)
  const [onglet, setOnglet] = useState<'fiche' | 'certificat'>('fiche')
  const [devisePersonnalisee, setDevisePersonnalisee] = useState(
    () => tableau.devise !== '' && !DEVISES.some((d) => d.code === tableau.devise)
  )
  const refAffichee = useRef(tableau.ref)

  // Le catalogue se recharge après chaque enregistrement : ne réinitialiser la
  // saisie qu'en changeant d'œuvre, sinon la frappe en cours serait écrasée.
  useEffect(() => {
    if (refAffichee.current !== tableau.ref) {
      refAffichee.current = tableau.ref
      setBrouillon(versBrouillon(tableau))
      setSale(false)
      setApercu(0)
    }
  }, [tableau])

  // Les photos, elles, changent hors du formulaire : on les resynchronise.
  useEffect(() => {
    setBrouillon((b) => (b.photos === tableau.photos ? b : { ...b, photos: tableau.photos }))
  }, [tableau.photos])

  /**
   * Enregistrement continu, sans bouton « Enregistrer ».
   *
   * Le fichier existe dès la création de la fiche ; chaque pause dans la
   * frappe le met à jour. Rien à valider, donc rien à perdre en fermant.
   */
  useEffect(() => {
    if (!sale) return
    const minuteur = setTimeout(() => {
      onEnregistrer(tableau.ref, brouillon)
      setSale(false)
    }, DELAI_ENREGISTREMENT)
    return () => clearTimeout(minuteur)
  }, [sale, brouillon, tableau.ref, onEnregistrer])

  function modifier(champs: Partial<BrouillonTableau>): void {
    setBrouillon((b) => ({ ...b, ...champs }))
    setSale(true)
  }

  function retour(): void {
    if (sale) onEnregistrer(tableau.ref, brouillon)
    onRetour()
  }

  const photoActive = brouillon.photos[apercu] ?? brouillon.photos[0]

  return (
    <div className="fiche">
      <header className="fiche__entete">
        <button className="fiche__retour" onClick={retour}>
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden />
          Tableaux
        </button>
        <span className="fiche__titre">{brouillon.titre.trim() === '' ? 'Sans titre' : brouillon.titre}</span>
        <span className="fiche__etat" aria-live="polite">
          {sale || enregistrement === 'en-cours' ? 'Enregistrement…' : enregistrement === 'enregistre' ? 'Enregistré' : ''}
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
          onOuvrir={() => onCertificatOuvrir(tableau.ref)}
          pdfCree={pdfCree}
          occupe={occupeCertificat}
        />
      ) : (
      <div className="fiche__corps">
        <div className="photos">
          <button className="depot-photo" onClick={() => onImporterPhotos(tableau.ref)}>
            {photoActive === undefined ? (
              <>
                <ImagePlus size={26} strokeWidth={1.5} aria-hidden />
                <span className="depot-photo__libelle">Ajouter des photos</span>
                <span className="depot-photo__aide">Face, dos, signature</span>
              </>
            ) : (
              <img src={urlMedia(photoActive)} alt={brouillon.titre || tableau.ref} />
            )}
          </button>

          {brouillon.photos.length > 0 && (
            <div className="pellicule">
              {brouillon.photos.map((photo, i) => (
                <div key={photo} className="pellicule__case" aria-current={i === apercu}>
                  <img
                    src={urlMedia(photo)}
                    alt={`Photo ${i + 1}`}
                    onClick={() => setApercu(i)}
                    style={{ cursor: 'pointer' }}
                  />
                  <button
                    className="pellicule__retirer"
                    onClick={() => onRetirerPhoto(tableau.ref, photo)}
                    title="Retirer cette photo"
                    aria-label="Retirer cette photo"
                  >
                    <X size={13} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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

          {/*
            Le volet vente n'apparaît qu'au statut « Vendu ». Un formulaire qui
            grandit selon le contexte est plus simple qu'un formulaire complet
            dont on ignore la moitié.
          */}
          {brouillon.statut === 'vendu' && (
            <section className="volet">
              <h3 className="volet__titre">Vente</h3>

              <div className="rangee">
                <label className="champ">
                  <span className="champ__libelle">Prix</span>
                  <input
                    value={afficher(brouillon.prix)}
                    onChange={(e) => modifier({ prix: nombreOuNull(e.target.value) })}
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
                        onChange={(e) => modifier({ devise: normaliserDevise(e.target.value) })}
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
                        if (e.target.value === AUTRE_DEVISE) {
                          modifier({ devise: '' })
                          setDevisePersonnalisee(true)
                        } else {
                          modifier({ devise: e.target.value })
                        }
                      }}
                    >
                      {devisesDisponibles(devisesEmployees, brouillon.devise).map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} — {d.libelle}
                        </option>
                      ))}
                      <option value={AUTRE_DEVISE}>Ajouter une devise…</option>
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
                  onChange={(acheteur) => modifier({ acheteur })}
                />
              </div>

              <div className="rangee">
                <label className="champ">
                  <span className="champ__libelle">Date de vente</span>
                  <input
                    type="date"
                    value={brouillon.dateVente}
                    onChange={(e) => modifier({ dateVente: e.target.value })}
                  />
                </label>

                <label className="champ">
                  <span className="champ__libelle">Certificat</span>
                  <input
                    value={brouillon.certificat}
                    onChange={(e) => modifier({ certificat: e.target.value })}
                    placeholder="Numéro ou référence"
                  />
                </label>
              </div>
            </section>
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
              <span className="champ__aide">La référence devient {refComplete({ ref: tableau.ref, serie: brouillon.serie })}</span>
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
