import { useState } from 'react'
import type { ApiAtelier } from '../preload'
import type { DiagSharp } from '@shared/types'

declare global {
  interface Window {
    atelier: ApiAtelier
  }
}

/**
 * Écran de diagnostic de la phase 0.
 *
 * Son unique raison d'être est le critère de sortie : vérifier que sharp
 * charge et traite un JPEG 24 Mpx dans une application EMPAQUETÉE. Il sera
 * remplacé par la vue Tableaux dès que ce critère sera levé.
 */
export function App(): React.JSX.Element {
  const [chemin, setChemin] = useState('')
  const [resultat, setResultat] = useState<DiagSharp | null>(null)
  const [encours, setEncours] = useState(false)

  async function lancer(): Promise<void> {
    setEncours(true)
    setResultat(null)
    try {
      setResultat(await window.atelier.diagSharp(chemin))
    } finally {
      setEncours(false)
    }
  }

  return (
    <>
      <header className="barre-titre">
        <span className="barre-titre__nom">Atelier — diagnostic</span>
      </header>

      <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 720 }}>
        <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>
          Chemin d’un JPEG 24 Mpx à traiter par sharp :
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={chemin}
            onChange={(e) => setChemin(e.target.value)}
            placeholder="C:\\...\\test-24mpx.jpg"
            spellCheck={false}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'var(--surface)',
              border: '1px solid var(--filet)',
              borderRadius: 'var(--rayon-controle)',
              color: 'var(--texte)',
              font: 'inherit'
            }}
          />
          <button onClick={() => void lancer()} disabled={!chemin || encours}>
            {encours ? 'Traitement…' : 'Tester sharp'}
          </button>
        </div>

        {resultat && (
          <pre
            style={{
              background: 'var(--surface)',
              border: `1px solid ${resultat.ok ? 'var(--filet)' : 'var(--alerte)'}`,
              borderRadius: 'var(--rayon-carte)',
              padding: 16,
              margin: 0,
              overflowX: 'auto',
              color: resultat.ok ? 'var(--texte)' : 'var(--alerte)'
            }}
          >
            {JSON.stringify(resultat, null, 2)}
          </pre>
        )}
      </main>
    </>
  )
}
