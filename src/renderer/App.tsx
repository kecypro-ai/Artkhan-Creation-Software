import { useCallback, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import type { ApiAtelier } from '@shared/types'
import { BarreLaterale } from './composants/BarreLaterale'
import { filtrer, useMagasin } from './etat/magasin'
import { VueFiche } from './vues/VueFiche'
import { VueTableaux } from './vues/VueTableaux'

declare global {
  interface Window {
    atelier: ApiAtelier
  }
}

export function App(): React.JSX.Element {
  const m = useMagasin()
  const { demarrer, enregistrer } = m

  useEffect(() => {
    void demarrer()
  }, [demarrer])

  // Stabilisé : la fiche s'en sert dans son minuteur d'enregistrement.
  const onEnregistrer = useCallback(
    (ref: string, brouillon: Parameters<typeof enregistrer>[1]) => void enregistrer(ref, brouillon),
    [enregistrer]
  )

  const barre = (
    <header className="barre-titre">
      <span className="barre-titre__nom">Atelier</span>
    </header>
  )

  if (m.chargement) {
    return (
      <>
        {barre}
        <div className="vide-total">Ouverture de l’atelier…</div>
      </>
    )
  }

  if (m.etat.chemin === null) {
    return (
      <>
        {barre}
        <main className="accueil">
          <div className="accueil__carte">
            <h1 className="accueil__titre">Choisissez le dossier de votre atelier</h1>
            <p className="accueil__texte">
              Chaque tableau y sera enregistré dans un fichier texte, ses photos rangées à côté. Vous pouvez le
              sauvegarder, le déplacer ou l’ouvrir sans cette application : vos œuvres ne dépendent pas d’elle.
            </p>
            <button className="bouton-primaire" onClick={() => void m.choisirAtelier()}>
              <FolderOpen size={17} strokeWidth={1.75} aria-hidden />
              Choisir un dossier
            </button>
            {m.erreur !== null && <p className="avis">{m.erreur}</p>}
          </div>
        </main>
      </>
    )
  }

  const ouverte = m.catalogue.tableaux.find((t) => t.ref === m.refOuverte) ?? null

  return (
    <>
      {barre}
      <div className="coque">
        <BarreLaterale
          atelier={m.etat.atelier}
          total={m.catalogue.tableaux.length}
          anomalies={m.catalogue.anomalies}
          onOuvrirDossier={() => void window.atelier.atelierOuvrirDossier()}
          onChangerAtelier={() => void m.choisirAtelier()}
        />

        <main className="principal">
          {m.erreur !== null && (
            <p className="avis" onClick={m.effacerErreur} role="alert">
              {m.erreur}
            </p>
          )}

          {m.catalogue.echecs.length > 0 && (
            <p className="avis">
              {m.catalogue.echecs.length} fichier(s) illisible(s) : {m.catalogue.echecs.map((e) => e.fichier).join(', ')}
            </p>
          )}

          {ouverte === null ? (
            <VueTableaux
              tableaux={filtrer(m.catalogue.tableaux, m.recherche)}
              recherche={m.recherche}
              onRecherche={m.setRecherche}
              onAjouter={() => void m.ajouter()}
              onOuvrir={(ref) => m.ouvrir(ref)}
            />
          ) : (
            <VueFiche
              tableau={ouverte}
              enregistrement={m.enregistrement}
              onRetour={() => m.ouvrir(null)}
              onEnregistrer={onEnregistrer}
              onSupprimer={(ref) => void m.supprimer(ref)}
              onImporterPhotos={(ref) => void m.importerPhotos(ref)}
              onRetirerPhoto={(ref, photo) => void m.retirerPhoto(ref, photo)}
            />
          )}
        </main>
      </div>
    </>
  )
}
