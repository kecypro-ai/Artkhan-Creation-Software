import { useEffect, useRef, useState } from 'react'
import { ExternalLink, FileDown, Printer } from 'lucide-react'
import { htmlCertificat } from '@shared/certificat'
import type { Atelier, BrouillonTableau, Edition, Tableau } from '@shared/types'

const SUPPORTS = ['Toile', 'Papier', 'Panneau de bois', 'Carton entoilé', 'Cuivre', 'Mur']
const EMPLACEMENTS = ['Recto', 'Verso', 'Dos du châssis', 'Angle inférieur droit', 'Angle inférieur gauche']

/** Largeur d'une page A4 en pixels CSS à 96 ppp, unité de rendu du gabarit. */
const A4_LARGEUR = 794
const A4_HAUTEUR = 1123

interface Props {
  tableau: Tableau
  brouillon: BrouillonTableau
  atelier: Atelier | null
  onModifier: (champs: Partial<BrouillonTableau>) => void
  onPdf: () => void
  onImprimer: () => void
  onOuvrir: () => void
  pdfCree: boolean
  occupe: boolean
}

export function VoletCertificat({
  tableau,
  brouillon,
  atelier,
  onModifier,
  onPdf,
  onImprimer,
  onOuvrir,
  pdfCree,
  occupe
}: Props): React.JSX.Element {
  const cadre = useRef<HTMLDivElement>(null)
  const [echelle, setEchelle] = useState(0.5)

  // L'aperçu doit rester une A4 fidèle : on rend le gabarit à sa taille réelle
  // puis on le réduit, plutôt que d'en refaire une version « pour l'écran »
  // qui finirait par ne plus ressembler à l'impression.
  useEffect(() => {
    const element = cadre.current
    if (element === null) return
    const observateur = new ResizeObserver(([entree]) => {
      if (entree !== undefined) setEchelle(entree.contentRect.width / A4_LARGEUR)
    })
    observateur.observe(element)
    return () => observateur.disconnect()
  }, [])

  const apercu: Tableau = { ...tableau, ...brouillon }
  const html =
    atelier === null
      ? ''
      : htmlCertificat(apercu, atelier)

  return (
    <div className="certificat">
      <div className="formulaire">
        <label className="champ">
          <span className="champ__libelle">Support</span>
          <input
            value={brouillon.support}
            onChange={(e) => onModifier({ support: e.target.value })}
            list="supports"
            placeholder="Toile"
          />
          <datalist id="supports">
            {SUPPORTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>

        <div className="rangee">
          <label className="champ">
            <span className="champ__libelle">Lieu de réalisation</span>
            <input
              value={brouillon.lieuRealisation}
              onChange={(e) => onModifier({ lieuRealisation: e.target.value })}
              placeholder={atelier?.ville === '' ? 'Paris' : atelier?.ville}
            />
          </label>

          <label className="champ">
            <span className="champ__libelle">Signature située</span>
            <input
              value={brouillon.emplacementSignature}
              onChange={(e) => onModifier({ emplacementSignature: e.target.value })}
              list="emplacements"
              placeholder="Recto"
            />
            <datalist id="emplacements">
              {EMPLACEMENTS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="champ">
          <span className="champ__libelle">Nature de l’œuvre</span>
          <div className="segments">
            {(['original', 'limitee'] as Edition[]).map((e) => (
              <button key={e} aria-pressed={brouillon.edition === e} onClick={() => onModifier({ edition: e })}>
                {e === 'original' ? 'Original' : 'Édition limitée'}
              </button>
            ))}
          </div>
        </div>

        {brouillon.edition === 'limitee' && (
          <label className="champ">
            <span className="champ__libelle">Numéro dans l’édition</span>
            <input
              value={brouillon.editionNumero}
              onChange={(e) => onModifier({ editionNumero: e.target.value })}
              placeholder="3 / 30"
            />
          </label>
        )}

        <div className="rangee">
          <label className="champ">
            <span className="champ__libelle">Date du certificat</span>
            <input
              type="date"
              value={brouillon.certificatDate}
              onChange={(e) => onModifier({ certificatDate: e.target.value })}
            />
          </label>

          <label className="champ">
            <span className="champ__libelle">Numéro de certificat</span>
            <input
              value={brouillon.certificat}
              onChange={(e) => onModifier({ certificat: e.target.value })}
              placeholder="Facultatif"
            />
          </label>
        </div>

        <div className="fiche__actions certificat__actions">
          <button className="bouton-primaire" onClick={onPdf} disabled={occupe || atelier === null}>
            <FileDown size={16} strokeWidth={1.75} aria-hidden />
            {occupe ? 'Génération…' : 'Enregistrer le PDF'}
          </button>

          <button onClick={onImprimer} disabled={occupe || atelier === null}>
            <Printer size={15} strokeWidth={1.75} aria-hidden /> Imprimer
          </button>

          {pdfCree && (
            <button onClick={onOuvrir}>
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden /> Ouvrir
            </button>
          )}
        </div>

        <p className="champ__aide certificat__note">
          Le PDF est enregistré dans le dossier « Certificats » de votre atelier.
        </p>
      </div>

      <div className="apercu">
        <div className="apercu__cadre" ref={cadre} style={{ height: A4_HAUTEUR * echelle }}>
          <iframe
            title="Aperçu du certificat"
            srcDoc={html}
            sandbox="allow-same-origin"
            style={{
              width: A4_LARGEUR,
              height: A4_HAUTEUR,
              transform: `scale(${echelle})`,
              transformOrigin: 'top left'
            }}
          />
        </div>
      </div>
    </div>
  )
}
