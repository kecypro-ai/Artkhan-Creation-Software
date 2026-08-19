import type { BrowserWindow } from 'electron'
import { ZOOM_MAX, ZOOM_MIN } from '@shared/types'
import { ecrirePreferences, lirePreferences } from './atelier/config'

export const CANAL_ZOOM = 'vue:zoom-change'

function borner(niveau: number): number {
  if (!Number.isFinite(niveau)) return 0
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(niveau)))
}

/** Applique un niveau, l'enregistre, et prévient la page pour son affichage. */
export async function appliquerZoom(win: BrowserWindow, niveau: number): Promise<number> {
  const borne = borner(niveau)
  win.webContents.setZoomLevel(borne)
  await ecrirePreferences({ ...(await lirePreferences()), zoom: borne })
  if (!win.isDestroyed()) win.webContents.send(CANAL_ZOOM, borne)
  return borne
}

/**
 * Branche Ctrl + / Ctrl - / Ctrl 0 sans passer par un menu.
 *
 * L'application n'a pas de barre de menus — ces raccourcis y seraient
 * normalement déclarés. `before-input-event` les intercepte en amont de la
 * page, donc même lorsque le curseur est dans un champ de saisie.
 *
 * Les touches sont testées par leur caractère et non par leur code : sur un
 * clavier français, « + » et « - » ne sont pas là où un clavier américain les
 * attend, et le pavé numérique produit d'autres codes encore.
 */
export function brancherRaccourcisZoom(win: BrowserWindow): void {
  win.webContents.on('before-input-event', (evenement, entree) => {
    if (entree.type !== 'keyDown' || !entree.control || entree.alt) return

    const touche = entree.key
    let cible: number | null = null

    if (touche === '+' || touche === '=') cible = win.webContents.getZoomLevel() + 1
    else if (touche === '-' || touche === '_') cible = win.webContents.getZoomLevel() - 1
    else if (touche === '0') cible = 0

    if (cible === null) return
    evenement.preventDefault()
    void appliquerZoom(win, cible)
  })
}

/** Restaure le zoom de la session précédente à l'ouverture de la fenêtre. */
export async function restaurerZoom(win: BrowserWindow): Promise<void> {
  const { zoom } = await lirePreferences()
  win.webContents.setZoomLevel(borner(zoom))
}
