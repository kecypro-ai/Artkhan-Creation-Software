import { stat } from 'node:fs/promises'
import sharp from 'sharp'
import type { DiagSharp } from '@shared/types'

export async function diagnostiquerSharp(
  chemin: string,
  empaquete: boolean
): Promise<DiagSharp> {
  try {
    const debut = process.hrtime.bigint()
    const source = sharp(chemin, { limitInputPixels: 512e6 })
    const meta = await source.metadata()
    const vignette = await source
      .rotate()
      .resize({ width: 320, height: 320, fit: 'inside' })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    const dureeMs = Number(process.hrtime.bigint() - debut) / 1e6

    return {
      ok: true,
      sharpVersion: sharp.versions['sharp'] ?? 'inconnue',
      libvipsVersion: sharp.versions['vips'] ?? 'inconnue',
      source: {
        largeur: meta.width ?? 0,
        hauteur: meta.height ?? 0,
        format: meta.format ?? 'inconnu',
        octets: (await stat(chemin)).size
      },
      vignette: {
        largeur: vignette.info.width,
        hauteur: vignette.info.height,
        octets: vignette.info.size
      },
      dureeMs,
      empaquete
    }
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : String(e), empaquete }
  }
}
