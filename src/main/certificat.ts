import { mkdir, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { BrowserWindow, shell } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import { htmlCertificat } from '@shared/certificat'
import { nomFichier } from '@shared/document'
import { refComplete } from '@shared/reference'
import type { Atelier, CertificatEmis, Tableau } from '@shared/types'
import { dansAtelier } from './atelier/chemins'

export const DOSSIER_CERTIFICATS = 'Certificats'

/**
 * Impression du certificat, sans bibliothèque tierce.
 *
 * Le gabarit est chargé dans une fenêtre invisible, puis rendu par le moteur
 * d'impression d'Electron. Chromium sait déjà produire un PDF conforme et
 * gère nos protocoles maison : les photos de l'atelier s'affichent sans qu'il
 * faille les convertir ni les recopier ailleurs.
 */
async function surFenetreCachee<T>(html: string, action: (win: BrowserWindow) => Promise<T>): Promise<T> {
  const win = new BrowserWindow({
    show: false,
    width: 900,
    height: 1300,
    webPreferences: { offscreen: true, sandbox: true, javascript: false }
  })

  try {
    // Passer le document en URL de données évite d'écrire un fichier
    // temporaire, mais laisse les protocoles artkhan-* résolvables.
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    return await action(win)
  } finally {
    if (!win.isDestroyed()) win.destroy()
  }
}

function cheminPdf(t: Tableau): string {
  return `${DOSSIER_CERTIFICATS}/${nomFichier(refComplete(t), t.titre).replace(/\.md$/, '.pdf')}`
}

export async function certificatPdf(racine: string, t: Tableau, atelier: Atelier): Promise<string> {
  const relatif = cheminPdf(t)
  const absolu = dansAtelier(racine, relatif)
  if (absolu === null) throw new Error(`Chemin refusé : ${relatif}`)

  const pdf = await surFenetreCachee(htmlCertificat(t, atelier), (win) =>
    win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      // Les marges sont dans le gabarit : en ajouter ici décalerait le cadre.
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })
  )

  await mkdir(join(racine, DOSSIER_CERTIFICATS), { recursive: true })
  await writeFileAtomic(absolu, pdf)
  return relatif
}

export async function certificatImprimer(t: Tableau, atelier: Atelier): Promise<void> {
  await surFenetreCachee(
    htmlCertificat(t, atelier),
    (win) =>
      new Promise<void>((resoudre, rejeter) => {
        win.webContents.print({ printBackground: true, margins: { marginType: 'none' } }, (reussi, echec) => {
          // Une impression annulée depuis la boîte de dialogue du système
          // n'est pas une erreur : l'artiste a simplement changé d'avis.
          if (reussi || echec === 'cancelled') resoudre()
          else rejeter(new Error(echec))
        })
      })
  )
}

export async function certificatOuvrir(racine: string, fichier: string): Promise<void> {
  const absolu = dansAtelier(racine, fichier)
  if (absolu !== null) await shell.openPath(absolu)
}

/**
 * Les certificats réellement présents sur le disque, et non ceux qu'on croit
 * avoir produits.
 *
 * Le dossier fait foi : un PDF supprimé disparaît de la liste, un PDF déposé
 * à la main y entre. La référence est déduite du nom de fichier, seul lien
 * entre le document et l'œuvre une fois le PDF sorti de l'application.
 */
export async function listerCertificats(racine: string): Promise<CertificatEmis[]> {
  const dossier = join(racine, DOSSIER_CERTIFICATS)

  let noms: string[]
  try {
    noms = (await readdir(dossier, { withFileTypes: true }))
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
      .map((e) => e.name)
  } catch {
    return []
  }

  const emis: CertificatEmis[] = []
  for (const nom of noms) {
    try {
      const info = await stat(join(dossier, nom))
      emis.push({
        fichier: `${DOSSIER_CERTIFICATS}/${nom}`,
        ref: (/^([A-Za-z0-9-]+?)(?:\s|\.pdf$)/.exec(nom)?.[1] ?? nom).replace(/\.pdf$/i, ''),
        octets: info.size,
        modifie: new Date(info.mtimeMs).toISOString().slice(0, 10)
      })
    } catch {
      // Fichier disparu entre la liste et la lecture : on l'ignore.
    }
  }

  return emis.sort((a, b) => b.modifie.localeCompare(a.modifie) || a.ref.localeCompare(b.ref, 'fr'))
}
