// Ist ein Titel (oder Reihenteil) noch nicht gestartet? Wie auf der Hauptseite (shared/logic.ts, erscheintErst); im Zweifel nein, lieber kein „noch nicht erschienen“ als ein falsches.

/** `t`: jpStart, jpStatus, jpYear; `heute`: Tag als JJJJ-MM-TT (Berlin). */
export function erscheintErst(t, heute) {
  if (t.jpStatus === 'FINISHED' || t.jpStatus === 'RELEASING') return false
  const jp = t.jpStart ?? (t.jpYear ? String(t.jpYear) : '')
  if (jp.length >= 10) return jp > heute
  if (t.jpStatus === 'NOT_YET_RELEASED') return true
  return jp !== '' && jp > heute.slice(0, jp.length)
}

/** Reihenteil, den die Liste als „noch nicht erschienen“ markiert (reihen-teil.ts, `kuenftig`): Status oder Jahr nach heute. */
export function kuenftig(m, heute) {
  const jahr = Number(heute.slice(0, 4))
  if (m.jpStatus === 'NOT_YET_RELEASED') return true
  return m.jpStatus !== 'FINISHED' && ((m.jpYear ?? 0) > jahr || (Boolean(m.ohneSynchro) && (m.jpYear ?? 0) >= jahr))
}
