import { useCallback, useEffect } from 'react'
import type { ApiAtelier } from '@shared/types'
import { BarreLaterale } from './composants/BarreLaterale'
import { useMagasin, visibles } from './etat/magasin'
import { VueAccueil } from './vues/VueAccueil'
import { VueFiche } from './vues/VueFiche'
import { VueTableaux } from './vues/VueTableaux'

declare global {
  interface Window {
    atelier: ApiAtelier
  }
}

export function App(): React.JSX.Element {
  const m = useMagasin()
  const { demarrer, enregistrer, noterZoom } = m

  useEffect(() => {
    void demarrer()
  }, [demarrer])

  // Ctrl + / Ctrl − passent par le processus principal : la page apprend le
  // niveau retenu par ce canal plutôt qu'en le devinant.
  useEffect(() => window.atelier.surZoom(noterZoom), [noterZoom])

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
        <VueAccueil
          onCreer={(nom) => void m.creerAtelier(nom)}
          onOuvrirExistant={() => void m.choisirAtelier()}
          erreur={m.erreur}
        />
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
          zoom={m.preferences.zoom}
          onRenommer={(nom, prefixe) => void m.renommerAtelier(nom, prefixe)}
          onZoom={m.reglerZoom}
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
              tableaux={m.catalogue.tableaux}
              visibles={visibles(m.catalogue.tableaux, m.recherche, m.preferences)}
              recherche={m.recherche}
              preferences={m.preferences}
              onRecherche={m.setRecherche}
              onPreferences={m.majPreferences}
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
