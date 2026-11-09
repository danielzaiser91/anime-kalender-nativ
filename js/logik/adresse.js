// Adressen vergleichen, auch bei verschiedener Schreibweise (shared/adresse-kern.ts, chips-regeln.ts).
export function adressKern(u) {
  if (!u) return ''
  const ohne = u.replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0].replace(/\/$/, '').toLowerCase()
  const asin = /\/(?:dp|gp\/video\/detail)\/([a-z0-9]{10,26})/.exec(ohne)?.[1]
  if (asin) return `amazon:${asin}`
  const gti = /[?&]gti=(amzn1\.dv\.gti\.[0-9a-f-]{36})/.exec(u)?.[1]
  if (gti) return `amazon-gti:${gti}`
  const yt = /(?:^|\.)youtube\.com\/(?:watch|playlist)$/.test(ohne) ? /[?&](v|list)=([\w-]+)/.exec(u) : null
  if (yt) return `${ohne}?${yt[1]}=${yt[2]}`
  const awin = /(?:^|\.)awin1\.com\/pclick\.php$/.test(ohne) ? /[?&]p=(\d+)/.exec(u) : null
  return awin ? `${ohne}?p=${awin[1]}` : ohne
}

const SPRACHE = /^([^/]+)\/(?:de|en|fr|es|it|pt|ru|ar|pl|tr|ja|ko|hi|nl)(?:-[a-z0-9]{2,3})?(?=\/(?:series|watch|browse|title|video|movies?)\/)/

export const seitenKern = (url) => adressKern(url).replace(SPRACHE, '$1')

export const istToggo = (url) => {
  try {
    return /(^|\.)toggo\.de$/i.test(new URL(url ?? '').hostname)
  } catch {
    return false
  }
}

const OMU_IM_PFAD = /(^|[/_-])omu([/_.-]|$)/i

export function adresseIstOmu(url) {
  try {
    return OMU_IM_PFAD.test(decodeURIComponent(new URL(url).pathname))
  } catch {
    return false
  }
}
