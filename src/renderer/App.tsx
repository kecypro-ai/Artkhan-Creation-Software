import { useCallback, useEffect } from 'react'
import { nomsCites } from '@shared/carnet'
import type { ApiAtelier } from '@shared/types'
import { BarreLaterale } from './composants/BarreLaterale'
import { useMagasin, visibles } from './etat/magasin'
import { VueAccueil } from './vues/VueAccueil'
import { VueCarnet } from './vues/VueCarnet'
import { VueFiche } from './vues/VueFiche'
import { VueTableaux } from './vues/VueTableaux'

declare global {
  interface Window {
    atelier: ApiAtelier
  }
}

export function App(): React.JSX.Element {
  const m = useMagasin()
  const { demarrer, enregistrer, enregistrerFiche, noterZoom } = m

  useEffect(() => {
    void demarrer()
  }, [demarrer])

  // Ctrl + / Ctrl − passent par le processus principal : la page apprend le
  // niveau retenu par ce canal plutôt qu'en le devinant.
  useEffect(() => window.atelier.surZoom(noterZoom), [noterZoom])

  // Stabilisés : les fiches s'en servent dans leur minuteur d'enregistrement.
  const onEnregistrer = useCallback(
    (ref: string, brouillon: Parameters<typeof enregistrer>[1]) => void enregistrer(ref, brouillon),
    [enregistrer]
  )
  const onEnregistrerFiche = useCallback(
    (type: Parameters<typeof enregistrerFiche>[0], fiche: Parameters<typeof enregistrerFiche>[1]) =>
      void enregistrerFiche(type, fiche),
    [enregistrerFiche]
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

  const tableaux = m.catalogue.tableaux
  const ouverte = tableaux.find((t) => t.ref === m.refOuverte) ?? null

  function corps(): React.JSX.Element {
    // Une œuvre ouverte prime sur la rubrique : on y arrive aussi bien depuis
    // le catalogue que depuis la fiche d'un acheteur.
    if (ouverte !== null) {
      return (
        <VueFiche
          tableau={ouverte}
          enregistrement={m.enregistrement}
          acheteurs={nomsCites(tableaux, 'acheteurs')}
          depots={nomsCites(tableaux, 'depots')}
          onRetour={() => m.ouvrir(null)}
          onEnregistrer={onEnregistrer}
          onSupprimer={(ref) => void m.supprimer(ref)}
          onImporterPhotos={(ref) => void m.importerPhotos(ref)}
          onRetirerPhoto={(ref, photo) => void m.retirerPhoto(ref, photo)}
        />
      )
    }

    if (m.rubrique === 'acheteurs' || m.rubrique === 'depots') {
      return (
        <VueCarnet
          type={m.rubrique}
          fiches={m.fiches[m.rubrique]}
          tableaux={tableaux}
          onEnregistrer={onEnregistrerFiche}
          onOuvrirTableau={(ref) => m.ouvrir(ref)}
        />
      )
    }

    return (
      <VueTableaux
        tableaux={tableaux}
        visibles={visibles(tableaux, m.recherche, m.preferences)}
        recherche={m.recherche}
        preferences={m.preferences}
        onRecherche={m.setRecherche}
        onPreferences={m.majPreferences}
        onAjouter={() => void m.ajouter()}
        onOuvrir={(ref) => m.ouvrir(ref)}
      />
    )
  }

  return (
    <>
      {barre}
      <div className="coque">
        <BarreLaterale
          atelier={m.etat.atelier}
          total={tableaux.length}
          anomalies={m.catalogue.anomalies}
          rubrique={m.rubrique}
          zoom={m.preferences.zoom}
          onRubrique={m.allerA}
          onOuvrirDossier={() => void window.atelier.atelierOuvrirDossier()}
          onChangerAtelier={() => void m.choisirAtelier()}
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

          {corps()}
        </main>
      </div>
    </>
  )
}
