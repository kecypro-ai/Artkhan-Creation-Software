import { contextBridge, ipcRenderer } from 'electron'
import type { ApiAtelier } from '@shared/types'

const api: ApiAtelier = Object.freeze({
  diagSharp: (chemin: string) => ipcRenderer.invoke('diag:sharp', chemin)
})

contextBridge.exposeInMainWorld('atelier', api)
