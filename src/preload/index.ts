import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { ApiAtelier } from '@shared/types'

/**
 * Seule passerelle entre la page et le système.
 *
 * La surface est close et figée : la page ne reçoit pas `ipcRenderer`, mais
 * une liste finie d'opérations nommées. Tout ce qui touche au disque reste
 * dans le processus principal, qui vérifie chaque chemin.
 */
const api: ApiAtelier = {
  diagSharp: (chemin: string) => ipcRenderer.invoke('diag:sharp', chemin),

  atelierEtat: () => ipcRenderer.invoke('atelier:etat'),
  atelierChoisir: () => ipcRenderer.invoke('atelier:choisir'),
  atelierCreer: (nom) => ipcRenderer.invoke('atelier:creer', nom),
  atelierOuvrirDossier: () => ipcRenderer.invoke('atelier:ouvrir-dossier'),
  atelierRenommer: (nom, prefixe) => ipcRenderer.invoke('atelier:renommer', nom, prefixe),

  lirePreferences: () => ipcRenderer.invoke('preferences:lire'),
  ecrirePreferences: (preferences) => ipcRenderer.invoke('preferences:ecrire', preferences),
  reglerZoom: (niveau) => ipcRenderer.invoke('vue:zoom', niveau),
  surZoom: (rappel) => {
    // Le zoom peut changer au clavier, sans passer par la page : elle a besoin
    // d'être prévenue pour tenir son affichage à jour.
    const ecouteur = (_e: IpcRendererEvent, niveau: number): void => rappel(niveau)
    ipcRenderer.on('vue:zoom-change', ecouteur)
    return () => ipcRenderer.removeListener('vue:zoom-change', ecouteur)
  },

  listerTableaux: () => ipcRenderer.invoke('tableaux:lister'),
  creerTableau: (brouillon) => ipcRenderer.invoke('tableaux:creer', brouillon),
  enregistrerTableau: (ref, brouillon) => ipcRenderer.invoke('tableaux:enregistrer', ref, brouillon),
  supprimerTableau: (ref) => ipcRenderer.invoke('tableaux:supprimer', ref),

  importerPhotos: (ref) => ipcRenderer.invoke('photos:importer', ref),
  retirerPhoto: (ref, photo) => ipcRenderer.invoke('photos:retirer', ref, photo),
  revelerTableau: (ref) => ipcRenderer.invoke('tableaux:reveler', ref)
}

contextBridge.exposeInMainWorld('atelier', Object.freeze(api))
