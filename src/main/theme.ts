import { BrowserWindow, nativeTheme } from 'electron'
import type { Theme } from '@shared/types'
import { ecrirePreferences, lirePreferences } from './atelier/config'

/**
 * Thème clair ou sombre, système par défaut.
 *
 * Le choix est confié à `nativeTheme.themeSource` : Chromium en déduit
 * `prefers-color-scheme`, et la feuille de style bascule seule. Rien à
 * transmettre à la page, et le mode automatique suit l'ordinateur en direct.
 *
 * Reste la barre de titre, dessinée par le système et non par la page : ses
 * couleurs doivent être repeintes à chaque bascule, sinon elle garderait le
 * gris foncé du démarrage sur un fond clair.
 */
const SOURCE: Record<Theme, 'system' | 'light' | 'dark'> = {
  auto: 'system',
  clair: 'light',
  sombre: 'dark'
}

const BARRE = {
  sombre: { color: '#17181B', symbolColor: '#9A9AA2' },
  clair: { color: '#EEEEEB', symbolColor: '#5E5E66' }
}

export function couleursBarre(): { color: string; symbolColor: string; height: number } {
  return { ...(nativeTheme.shouldUseDarkColors ? BARRE.sombre : BARRE.clair), height: 44 }
}

export function fondFenetre(): string {
  return nativeTheme.shouldUseDarkColors ? '#0F1012' : '#F6F6F4'
}

function repeindre(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  win.setTitleBarOverlay(couleursBarre())
  win.setBackgroundColor(fondFenetre())
}

export async function appliquerTheme(theme: Theme): Promise<void> {
  nativeTheme.themeSource = SOURCE[theme]
  await ecrirePreferences({ ...(await lirePreferences()), theme })
}

export async function restaurerTheme(): Promise<void> {
  const { theme } = await lirePreferences()
  nativeTheme.themeSource = SOURCE[theme]
}

/** Suit aussi les bascules du système lorsque le thème est en « auto ». */
export function suivreTheme(win: BrowserWindow): void {
  const surChangement = (): void => repeindre(win)
  nativeTheme.on('updated', surChangement)
  win.on('closed', () => nativeTheme.removeListener('updated', surChangement))
}
