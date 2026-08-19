import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ImageOff } from 'lucide-react'
import type { Fiche, TypeCarnet } from '@shared/carnet'
import { ficheVide, formaterMontant, LIBELLE_CARNET, memeNom, nomsCites, oeuvresDe, totaux } from '@shared/carnet'
import { urlVignette } from '@shared/medias'
import type { Tableau } from '@shared/types'

const DELAI_ENREGISTREMENT = 600

function ligneOeuvre(t: Tableau): string {
  const bouts: string[] = []
  if (t.annee !== null) bouts.push(String(t.annee))
  if (t.hauteur !== null && t.largeur !== null) bouts.push(`${t.hauteur} × ${t.largeur} cm`)
  return bouts.join(' · ')
}

interface Props {
  type: TypeCarnet
  fiches: Fiche[]
  tableaux: Tableau[]
  onEnregistrer: (type: TypeCarnet, fiche: Fiche) => void
  onOuvrirTableau: (ref: string) => void
}

export function VueCarnet({ type, fiches, tableaux, onEnregistrer, onOuvrirTableau }: Props): React.JSX.Element {
  const [ouvert, setOuvert] = useState<string | null>(null)
  const libelle = LIBELLE_CARNET[type]

  // Le catalogue fait foi : un nom cité par une œuvre doit apparaître même si
  // sa fiche a été effacée du dossier entre-temps.
  const noms = nomsCites(tableaux, type)
  const complet: Fiche[] = [
    ...fiches,
    ...noms.filter((n) => !fiches.some((f) => memeNom(f.nom, n))).map((n) => ficheVide(n))
  ].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

  const fiche = ouvert === null ? null : (complet.find((f) => memeNom(f.nom, ouvert)) ?? null)

  if (fiche === null) {
    return (
      <>
        <div className="outils">
          <div className="outils__ligne">
            <h1 className="rubrique__titre">{libelle.pluriel}</h1>
            <span className="colonne__compte">{complet.length}</span>
          </div>
        </div>

        <div className="catalogue">
          {complet.length === 0 ? (
            <p className="vide-total">
              {type === 'acheteurs'
                ? 'Aucun acheteur pour l’instant. Renseignez-en un sur un tableau vendu : sa fiche s’ouvrira toute seule.'
                : 'Aucun lieu de dépôt. Passez un tableau en dépôt et indiquez où : le lieu apparaîtra ici.'}
            </p>
          ) : (
            <div className="lignes">
              <table>
                <thead>
                  <tr>
                    <th>{libelle.singulier}</th>
                    <th className="num">Œuvres</th>
                    {type !== 'series' && (
                      <th className="num">{type === 'acheteurs' ? 'Total' : 'Sur place'}</th>
                    )}
                    {type !== 'series' && <th>Contact</th>}
                  </tr>
                </thead>
                <tbody>
                  {complet.map((f) => {
                    const oeuvres = oeuvresDe(tableaux, type, f.nom)
                    const sommes = totaux(oeuvres)
                    return (
                      <tr key={f.nom} onClick={() => setOuvert(f.nom)} tabIndex={0}>
                        <td className="lignes__titre">{f.nom}</td>
                        <td className="num">{oeuvres.length}</td>
                        {type !== 'series' && (
                          <td className="num">
                            {type === 'depots'
                              ? oeuvres.length
                              : sommes.length === 0
                                ? '—'
                                : sommes.map((s) => formaterMontant(s.montant, s.devise)).join(' + ')}
                          </td>
                        )}
                        {type !== 'series' && (
                          <td className="lignes__lieu">{f.email || f.telephone || f.contact || '—'}</td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )
  }

  return (
    <FicheCarnet
      type={type}
      fiche={fiche}
      oeuvres={oeuvresDe(tableaux, type, fiche.nom)}
      onRetour={() => setOuvert(null)}
      onEnregistrer={onEnregistrer}
      onOuvrirTableau={onOuvrirTableau}
    />
  )
}

interface PropsFiche {
  type: TypeCarnet
  fiche: Fiche
  oeuvres: Tableau[]
  onRetour: () => void
  onEnregistrer: (type: TypeCarnet, fiche: Fiche) => void
  onOuvrirTableau: (ref: string) => void
}

function FicheCarnet({
  type,
  fiche,
  oeuvres,
  onRetour,
  onEnregistrer,
  onOuvrirTableau
}: PropsFiche): React.JSX.Element {
  const [brouillon, setBrouillon] = useState<Fiche>(fiche)
  const [sale, setSale] = useState(false)
  const nomAffiche = useRef(fiche.nom)
  const sommes = totaux(oeuvres)

  useEffect(() => {
    if (nomAffiche.current !== fiche.nom) {
      nomAffiche.current = fiche.nom
      setBrouillon(fiche)
      setSale(false)
    }
  }, [fiche])

  // Même enregistrement continu que pour les œuvres : rien à valider.
  useEffect(() => {
    if (!sale) return
    const minuteur = setTimeout(() => {
      onEnregistrer(type, brouillon)
      setSale(false)
    }, DELAI_ENREGISTREMENT)
    return () => clearTimeout(minuteur)
  }, [sale, brouillon, type, onEnregistrer])

  function modifier(champs: Partial<Fiche>): void {
    setBrouillon((b) => ({ ...b, ...champs }))
    setSale(true)
  }

  return (
    <div className="fiche">
      <header className="fiche__entete">
        <button className="fiche__retour" onClick={onRetour}>
          <ArrowLeft size={17} strokeWidth={1.75} aria-hidden />
          {LIBELLE_CARNET[type].pluriel}
        </button>
        <span className="fiche__titre">{brouillon.nom}</span>
        <span className="fiche__etat" aria-live="polite">
          {sale ? 'Enregistrement…' : ''}
        </span>
      </header>

      <div className="fiche__corps fiche__corps--carnet">
        <div className="formulaire">
          {type !== 'series' && (
          <div className="rangee">
            <label className="champ">
              <span className="champ__libelle">Courriel</span>
              <input value={brouillon.email} onChange={(e) => modifier({ email: e.target.value })} placeholder="—" />
            </label>
            <label className="champ">
              <span className="champ__libelle">Téléphone</span>
              <input
                value={brouillon.telephone}
                onChange={(e) => modifier({ telephone: e.target.value })}
                placeholder="—"
              />
            </label>
          </div>
          )}

          {type === 'depots' && (
            <label className="champ">
              <span className="champ__libelle">Personne à joindre</span>
              <input
                value={brouillon.contact}
                onChange={(e) => modifier({ contact: e.target.value })}
                placeholder="—"
              />
            </label>
          )}

          {type !== 'series' && (
            <label className="champ">
              <span className="champ__libelle">Adresse</span>
              <input
                value={brouillon.adresse}
                onChange={(e) => modifier({ adresse: e.target.value })}
                placeholder="—"
              />
            </label>
          )}

          <label className="champ">
            <span className="champ__libelle">Notes</span>
            <textarea
              value={brouillon.notes}
              onChange={(e) => modifier({ notes: e.target.value })}
              placeholder={type === 'series' ? 'Période, intention, contexte' : 'Conditions, commission, souvenirs'}
            />
          </label>
        </div>

        <section className="oeuvres">
          <header className="oeuvres__entete">
            <h2 className="oeuvres__titre">
              {type === 'acheteurs' ? 'Œuvres achetées' : type === 'depots' ? 'Œuvres déposées' : 'Œuvres de la série'} ·{' '}
            {oeuvres.length}
            </h2>
            {type === 'acheteurs' && sommes.length > 0 && (
              <div className="oeuvres__total">
                {sommes.map((s) => (
                  <span key={s.devise}>{formaterMontant(s.montant, s.devise)}</span>
                ))}
              </div>
            )}
          </header>

          {oeuvres.length === 0 ? (
            <p className="colonne__vide">Aucune œuvre rattachée</p>
          ) : (
            <ul className="oeuvres__liste">
              {oeuvres.map((t) => {
                const photo = t.photos[0]
                return (
                  <li key={t.ref}>
                    <button onClick={() => onOuvrirTableau(t.ref)}>
                      {photo === undefined ? (
                        <span className="lignes__vide">
                          <ImageOff size={14} strokeWidth={1.5} aria-hidden />
                        </span>
                      ) : (
                        <img src={urlVignette(photo)} alt="" loading="lazy" />
                      )}

                      <span className="oeuvres__nom">
                        <span className={t.titre.trim() === '' ? 'lignes__titre--absent' : ''}>
                          {t.titre.trim() === '' ? 'Sans titre' : t.titre}
                        </span>
                        <span className="oeuvres__meta">{ligneOeuvre(t)}</span>
                      </span>

                      <span className="oeuvres__prix">
                        {t.prix === null ? '' : formaterMontant(t.prix, t.devise.trim() || 'EUR')}
                        {t.dateVente !== '' && <span className="oeuvres__date">{t.dateVente}</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
