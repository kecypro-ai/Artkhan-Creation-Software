import { contextBridge, ipcRenderer } from 'electron'
import type { DiagSharp } from '@shared/types'

const api = Object.freeze({
  diagSharp: (chemin: string): Promise<DiagSharp> =>
    ipcRenderer.invoke('diag:sharp', chemin)
})

export type ApiAtelier = typeof api

contextBridge.exposeInMainWorld('atelier', api)
