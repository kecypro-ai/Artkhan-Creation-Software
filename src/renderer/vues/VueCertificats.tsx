import { ExternalLink, ImageOff } from 'lucide-react'
import { urlVignette } from '@shared/medias'
import { refComplete } from '@shared/reference'
import type { CertificatEmis, Tableau } from '@shared/types'

function poids(octets: number): string {
  return `${Math.round(octets / 1024)} Ko`
}

interface Props {
  certificats: CertificatEmis[]
  tableaux: Tableau[]
  onOuvrirPdf: (fichier: string) => void
  onOuvrirTableau: (ref: string) => void
}

/**
 * Les certificats réellement émis.
 *
 * La liste vient du dossier, pas de la mémoire de l'application : ce qu'on
 * voit ici est ce qu'on peut réellement envoyer à un acheteur. Un PDF dont
 * l'œuvre a depuis disparu du catalogue reste affiché — c'est un document
 * signé, il a pu circuler.
 */
export function VueCertificats({
  certificats,
  tableaux,
  onOuvrirPdf,
  onOuvrirTableau
}: Props): React.JSX.Element {
  return (
    <>
      <div className="outils">
        <div className="outils__ligne">
          <h1 className="rubrique__titre">Certificats</h1>
          <span className="colonne__compte">{certificats.length}</span>
        </div>
      </div>

      <div className="catalogue">
        {certificats.length === 0 ? (
          <p className="vide-total">
            Aucun certificat émis. Ouvrez un tableau, allez à l’onglet « Certificat » et enregistrez le PDF : il
            apparaîtra ici.
          </p>
        ) : (
          <div className="lignes">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Œuvre</th>
                  <th>Référence</th>
                  <th className="num">Émis le</th>
                  <th className="num">Poids</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {certificats.map((c) => {
                  const oeuvre = tableaux.find((t) => refComplete(t) === c.ref) ?? null
                  const photo = oeuvre?.photos[0]

                  return (
                    <tr key={c.fichier}>
                      <td className="lignes__photo">
                        {photo === undefined ? (
                          <span className="lignes__vide">
                            <ImageOff size={14} strokeWidth={1.5} aria-hidden />
                          </span>
                        ) : (
                          <img src={urlVignette(photo)} alt="" loading="lazy" />
                        )}
                      </td>

                      <td className="lignes__titre">
                        {oeuvre === null ? (
                          <span className="lignes__titre--absent">Œuvre retirée du catalogue</span>
                        ) : (
                          <button className="lien" onClick={() => onOuvrirTableau(oeuvre.ref)}>
                            {oeuvre.titre.trim() === '' ? 'Sans titre' : oeuvre.titre}
                          </button>
                        )}
                      </td>

                      <td className="ref">{c.ref}</td>
                      <td className="num">{c.modifie}</td>
                      <td className="num">{poids(c.octets)}</td>

                      <td>
                        <button className="icone" onClick={() => onOuvrirPdf(c.fichier)} title="Ouvrir le PDF">
                          <ExternalLink size={15} strokeWidth={1.75} aria-hidden />
                        </button>
                      </td>
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
