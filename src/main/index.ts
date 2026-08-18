import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { diagnostiquerSharp } from './thumbs/diag'
import type { DiagSharp } from '@shared/types'

app.setPath('userData', join(app.getPath('appData'), '..', 'Local', 'Artkhan'))

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

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  void app.whenReady().then(() => {
    ipcMain.handle('diag:sharp', (_e, chemin: unknown): Promise<DiagSharp> => {
      if (typeof chemin !== 'string') {
        return Promise.resolve({
          ok: false,
          erreur: 'Chemin invalide',
          empaquete: app.isPackaged
        })
      }
      return diagnostiquerSharp(chemin, app.isPackaged)
    })

    creerFenetre()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) creerFenetre()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
