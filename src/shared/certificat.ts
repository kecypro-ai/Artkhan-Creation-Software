import { dimensionsTexte } from './libelles'
import { urlMedia } from './medias'
import { refComplete } from './reference'
import type { Atelier, Tableau } from './types'

/**
 * Gabarit du certificat d'authenticité, en une page A4 autonome.
 *
 * Fonction pure rendant du HTML complet, CSS compris. Elle est servie deux
 * fois — en aperçu dans une iframe côté page, et chargée dans une fenêtre
 * invisible pour le PDF et l'impression — de sorte que ce que l'artiste voit
 * à l'écran est exactement ce qui sort de l'imprimante. Un second gabarit
 * pour l'impression finirait tôt ou tard par diverger du premier.
 *
 * Aucune couleur de l'application ici : le certificat s'imprime sur du papier
 * blanc et ne suit pas le thème de l'interface.
 */

function echapper(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
]

/** « 2024-04-12 » → « 12 avril 2024 », comme sur le modèle d'origine. */
function dateEnToutesLettres(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (m === null) return iso.trim()
  const jour = Number(m[3])
  const mois = MOIS[Number(m[2]) - 1] ?? ''
  return `${jour} ${mois} ${m[1]}`
}

function mesures(t: Tableau): string {
  return dimensionsTexte(t, { absent: '', unite: 'cms' })
}

/** « Paris, 2024 » — chaque moitié est facultative. */
function lieuEtAnnee(t: Tableau): string {
  const annee = t.annee === null ? '' : String(t.annee)
  return [t.lieuRealisation.trim(), annee].filter((x) => x !== '').join(', ')
}

/**
 * Un certificat n'invente rien : une ligne sans valeur ne s'imprime pas.
 *
 * Laisser « Support : » suivi d'un blanc sur un document signé invite à le
 * remplir après coup, à la main, par n'importe qui.
 */
function ligne(intitule: string, valeur: string): string {
  const propre = valeur.trim()
  return propre === '' ? '' : `<p><strong>${echapper(intitule)}</strong> : ${echapper(propre)}</p>`
}

export function htmlCertificat(t: Tableau, atelier: Atelier): string {
  const photo = t.photos[0]
  const titre = t.titre.trim() === '' ? 'Sans titre' : t.titre.trim()
  const limitee = t.edition === 'limitee'
  const coche = (actif: boolean): string => (actif ? '■' : '☐')

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Certificat — ${echapper(refComplete(t))}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #fff;
    color: #000;
    font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    position: relative;
    width: 210mm;
    min-height: 297mm;
    padding: 12mm;
    overflow: hidden;
  }
  .cadre {
    position: relative;
    height: 273mm;
    border: 2.5pt solid #000;
    padding: 14mm 16mm;
    display: flex;
    flex-direction: column;
  }
  /* Le filigrane passe sous le texte : il authentifie sans gêner la lecture. */
  .filigrane {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 44pt;
    font-weight: 700;
    color: rgba(0, 0, 0, 0.06);
    white-space: nowrap;
    letter-spacing: 0.04em;
    pointer-events: none;
    z-index: 0;
  }
  .contenu { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
  h1 { margin: 6mm 0 2mm; text-align: center; font-size: 17pt; letter-spacing: 0.01em; }
  .numero { text-align: center; font-size: 10pt; letter-spacing: 0.06em; }
  .contenu > h1 + .preambule, .contenu > .numero + .preambule { margin-top: 10mm; }
  p { margin: 0 0 3.4mm; }
  .preambule { margin-bottom: 8mm; }
  .preambule em { font-style: italic; }
  .oeuvre { margin-bottom: 6mm; font-size: 12pt; }
  .edition { margin-bottom: 7mm; }
  .edition span { margin-right: 4mm; font-family: 'Segoe UI Symbol', Arial, sans-serif; }
  .mention { margin: 8mm 0; font-style: italic; line-height: 1.6; }
  .bas { margin-top: auto; display: flex; align-items: flex-end; gap: 10mm; }
  .signature { flex: 1; }
  .signature p { margin-bottom: 9mm; }
  .photo {
    width: 62mm;
    flex: none;
    box-shadow: 3mm 3mm 6mm rgba(0, 0, 0, 0.28);
  }
  .photo img { width: 100%; display: block; }
</style>
</head>
<body>
  <div class="page">
    <div class="cadre">
      ${atelier.filigrane.trim() === '' ? '' : `<div class="filigrane">${echapper(atelier.filigrane)}</div>`}

      <div class="contenu">
        <h1>CERTIFICAT D’AUTHENTICITÉ</h1>
        ${
          t.certificat.trim() === ''
            ? ''
            : `<p class="numero">n° ${echapper(t.certificat.trim())}</p>`
        }

        <div class="preambule">
          ${ligne('Je soussigné', atelier.artiste)}
          <p><em>certifie de l’œuvre désignée ci-dessous :</em></p>
        </div>

        <p class="oeuvre"><strong>Titre de l’œuvre</strong> : «&nbsp;<strong>${echapper(titre)}</strong>&nbsp;»</p>

        <p class="edition">
          <span>Original ${coche(!limitee)}</span>
          <span>Édition limitée ${coche(limitee)}</span>
          ${limitee && t.editionNumero.trim() !== '' ? `<span>n° ${echapper(t.editionNumero)}</span>` : '<span>n°</span>'}
        </p>

        ${ligne('Nom de l’artiste', atelier.artiste)}
        ${ligne('Technique et matériaux', t.technique)}
        ${ligne('Support', t.support)}
        ${ligne('Dimensions', mesures(t))}
        ${ligne('Année et lieu de réalisation', lieuEtAnnee(t))}
        ${ligne('Référence', refComplete(t))}

        <p class="mention">${echapper(atelier.mentionLegale)}</p>

        <div class="bas">
          <div class="signature">
            ${ligne('Date du certificat', dateEnToutesLettres(t.certificatDate))}
            <p><strong>Signature de l’artiste</strong> :</p>
          </div>
          ${photo === undefined ? '' : `<div class="photo"><img src="${echapper(urlMedia(photo))}" alt=""></div>`}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}
