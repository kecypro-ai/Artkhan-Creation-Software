import { useState } from 'react'
import { ArrowRight, FolderOpen } from 'lucide-react'

type Etape = 'bonjour' | 'dossier'

interface Props {
  onCreer: (nom: string) => void
  onOuvrirExistant: () => void
  erreur: string | null
}

/**
 * Premier lancement, en deux temps.
 *
 * Demander un dossier à quelqu'un qui vient d'ouvrir son application pour la
 * première fois est brutal. On demande d'abord son nom — qui sert vraiment :
 * il devient l'artiste de l'atelier, ses initiales forment le préfixe des
 * références, et il signera les certificats.
 */
export function VueAccueil({ onCreer, onOuvrirExistant, erreur }: Props): React.JSX.Element {
  const [etape, setEtape] = useState<Etape>('bonjour')
  const [nom, setNom] = useState('')

  const propre = nom.trim()
  const prenom = propre.split(/\s+/)[0] ?? ''

  function avancer(): void {
    if (propre !== '') setEtape('dossier')
  }

  return (
    <main className="accueil">
      {etape === 'bonjour' ? (
        <div className="accueil__carte" key="bonjour">
          <p className="accueil__salutation">Bonjour</p>
          <h1 className="accueil__titre">Comment vous appelez-vous ?</h1>

          <input
            className="accueil__champ"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') avancer()
            }}
            placeholder="Votre nom d’artiste"
            aria-label="Votre nom"
            autoFocus
            spellCheck={false}
          />

          <button className="bouton-primaire" onClick={avancer} disabled={propre === ''}>
            Continuer
            <ArrowRight size={17} strokeWidth={2} aria-hidden />
          </button>

          <button className="accueil__discret" onClick={onOuvrirExistant}>
            J’ai déjà un atelier sur cet ordinateur
          </button>
        </div>
      ) : (
        <div className="accueil__carte" key="dossier">
          <p className="accueil__salutation">Enchanté, {prenom}</p>
          <h1 className="accueil__titre">Où ranger votre atelier ?</h1>

          <p className="accueil__texte">
            Chaque tableau y sera enregistré dans un fichier texte, ses photos rangées à côté. Vous pourrez le
            sauvegarder, le déplacer ou l’ouvrir sans cette application : vos œuvres ne dépendent pas d’elle.
          </p>

          <button className="bouton-primaire" onClick={() => onCreer(propre)}>
            <FolderOpen size={17} strokeWidth={1.75} aria-hidden />
            Choisir le dossier
          </button>

          <button className="accueil__discret" onClick={() => setEtape('bonjour')}>
            Revenir en arrière
          </button>
        </div>
      )}

      {erreur !== null && <p className="avis">{erreur}</p>}
    </main>
  )
}
