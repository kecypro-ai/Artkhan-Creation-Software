import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { brancherIpc, racineCourante, restaurerAtelier } from './ipc'
import { brancherProtocoles, declarerProtocoles } from './protocole'
import { couleursBarre, fondFenetre, restaurerTheme, suivreTheme } from './theme'
import { verifierAtelier } from './verification'
import { brancherRaccourcisZoom, restaurerZoom } from './zoom'

function argument(nom: string): string | undefined {
  const i = process.argv.indexOf(nom)
  return i === -1 ? undefined : process.argv[i + 1]
}

const cheminVerif = argument('--verifier')

/**
 * Les contrôles sans fenêtre travaillent à part.
 *
 * Deux instances qui partagent le même dossier de données se disputent les
 * caches de Chromium : le contrôle échouerait dès qu'une fenêtre est ouverte,
 * et pourrait abîmer les préférences de la session en cours. Un contrôle doit
 * pouvoir tourner pendant que l'artiste travaille.
 */
app.setPath(
  'userData',
  cheminVerif !== undefined
    ? join(app.getPath('temp'), 'Artkhan-controle')
    : join(app.getPath('appData'), '..', 'Local', 'Artkhan')
)

function creerFenetre(): void {
  const win = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 940,
    minHeight: 620,
    show: false,
    backgroundColor: fondFenetre(),
    titleBarStyle: 'hidden',
    titleBarOverlay: couleursBarre(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  brancherRaccourcisZoom(win)
  suivreTheme(win)

  win.webContents.once('did-finish-load', () => void restaurerZoom(win))
  win.once('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Rend un compte rendu machine et s'arrête, sans jamais ouvrir de fenêtre.
 *
 * Le résultat passe par un fichier : sur Windows, une application empaquetée
 * n'est pas rattachée à la console et son stdout n'arrive jamais au terminal
 * appelant. Ces modes s'exécutent avant le verrou d'instance unique, pour
 * qu'un contrôle ne soit pas avalé par une fenêtre déjà ouverte.
 */
async function rendreCompte(resultat: { ok: boolean }): Promise<void> {
  const json = JSON.stringify(resultat, null, 2)
  const sortie = argument('--out')
  if (sortie !== undefined) await writeFile(sortie, json, 'utf8')
  process.stdout.write(`${json}\n`)
  app.exit(resultat.ok ? 0 : 1)
}

if (cheminVerif !== undefined) {
  /**
   * Contrôle de bout en bout sur un atelier réel, à lancer sur l'application
   * empaquetée : lecture des fiches, résolution des chemins, fabrication d'une
   * vignette par sharp et d'un certificat en PDF, le tout depuis l'archive.
   *
   * Le contrôle ouvre puis referme la fenêtre invisible du certificat. Sans ce
   * gardien, Electron quitterait de lui-même en la voyant disparaître — avant
   * l'écriture du compte rendu, et en rendant 0 comme si tout allait bien.
   */
  app.on('window-all-closed', () => {})
  void app.whenReady().then(async () => rendreCompte(await verifierAtelier(cheminVerif, app.isPackaged)))
} else if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Les schémas doivent être déclarés avant que l'application soit prête.
  declarerProtocoles()

  void app.whenReady().then(async () => {
    brancherProtocoles(racineCourante)
    brancherIpc()
    // Avant la fenêtre : elle naît déjà aux bonnes couleurs, sans clignoter.
    await restaurerTheme()
    await restaurerAtelier()
    creerFenetre()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) creerFenetre()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
