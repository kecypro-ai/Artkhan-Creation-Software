import { useCallback, useEffect, useRef, useState } from 'react'

const DELAI = 600

export interface Brouillon<T> {
  valeur: T
  /** Vrai tant qu'une modification attend d'être écrite. */
  sale: boolean
  modifier: (champs: Partial<T>) => void
  /** Met à jour sans déclencher d'écriture, pour ce qui change hors du formulaire. */
  remplacer: (champs: Partial<T>) => void
  /** Écrit sans attendre — à appeler en quittant la fiche. */
  forcer: () => void
}

/**
 * Saisie enregistrée en continu, sans bouton « Enregistrer ».
 *
 * Le document existe sur le disque avant qu'on le remplisse ; chaque pause
 * dans la frappe le met à jour. Rien à valider, donc rien à perdre en
 * fermant la fenêtre.
 *
 * Deux pièges que ce hook referme, et qui étaient recopiés dans chaque fiche :
 *
 * — Le catalogue se recharge après chaque écriture. Réinitialiser la saisie à
 *   chaque objet reçu écraserait la frappe en cours ; `identite` dit quand on
 *   a réellement changé de document.
 * — Enregistrer à chaque touche écrirait des dizaines de fois par phrase,
 *   d'où le délai.
 */
export function useBrouillon<T>(source: T, identite: string, enregistrer: (valeur: T) => void): Brouillon<T> {
  const [valeur, setValeur] = useState<T>(source)
  const [sale, setSale] = useState(false)
  const affichee = useRef(identite)

  useEffect(() => {
    if (affichee.current !== identite) {
      affichee.current = identite
      setValeur(source)
      setSale(false)
    }
  }, [identite, source])

  useEffect(() => {
    if (!sale) return
    const minuteur = setTimeout(() => {
      enregistrer(valeur)
      setSale(false)
    }, DELAI)
    return () => clearTimeout(minuteur)
  }, [sale, valeur, enregistrer])

  const modifier = useCallback((champs: Partial<T>) => {
    setValeur((v) => ({ ...v, ...champs }))
    setSale(true)
  }, [])

  const remplacer = useCallback((champs: Partial<T>) => {
    setValeur((v) => ({ ...v, ...champs }))
  }, [])

  const forcer = useCallback(() => {
    if (sale) enregistrer(valeur)
  }, [sale, valeur, enregistrer])

  return { valeur, sale, modifier, remplacer, forcer }
}
