import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { brancherIpc, racineCourante, restaurerAtelier } from './ipc'
import { brancherProtocoles, declarerProtocoles } from './protocole'
import { diagnostiquerSharp } from './thumbs/diag'

app.setPath('userData', join(app.getPath('appData'), '..', 'Local', 'Artkhan'))

function argument(nom: string): string | undefined {
  const i = process.argv.indexOf(nom)
  return i === -1 ? undefined : process.argv[i + 1]
}

function creerFenetre(): void {
  const win = new BrowserWindow({
    width: 1240,
    height: 860,
    minWidth: 940,
    minHeight: 620,
    show: false,
    backgroundColor: '#0F1012',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#17181B', symbolColor: '#9A9AA2', height: 44 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

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

const cheminDiag = argument('--diag')

if (cheminDiag !== undefined) {
  /**
   * Mode diagnostic non interactif : `Atelier.exe --diag <image> --out <json>`.
   *
   * Le critère de sortie de la phase 0 se vérifie sur une application
   * EMPAQUETÉE, où sharp est le plus susceptible de casser. Sans ce mode, il
   * faudrait cliquer dans l'interface à chaque build. Le résultat passe par un
   * fichier : sur Windows, une application empaquetée n'est pas rattachée à la
   * console et son stdout n'arrive jamais au terminal appelant.
   */
  void app.whenReady().then(async () => {
    const resultat = await diagnostiquerSharp(cheminDiag, app.isPackaged)
    const json = JSON.stringify(resultat, null, 2)
    const sortie = argument('--out')
    if (sortie !== undefined) await writeFile(sortie, json, 'utf8')
    process.stdout.write(`${json}\n`)
    app.exit(resultat.ok ? 0 : 1)
  })
} else if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  // Les schémas doivent être déclarés avant que l'application soit prête.
  declarerProtocoles()

  void app.whenReady().then(async () => {
    brancherProtocoles(racineCourante)
    brancherIpc()
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
