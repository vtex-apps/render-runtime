import bg from './bg.json'
import de from './de.json'
import en from './en.json'
import es from './es.json'
import fr from './fr.json'
import it from './it.json'
import ja from './ja.json'
import ko from './ko.json'
import nl from './nl.json'
import pt from './pt.json'
import ro from './ro.json'
import th from './th.json'

export const messages: Record<string, Record<string, string>> = {
  'en-US': en,
  'es-AR': es,
  'fr-FR': fr,
  'pt-BR': pt,
  'ja-JP': ja,
  'ko-KR': ko,
  'it-IT': it,
  'nl-NL': nl,
  'ro-RO': ro,
  'bg-BG': bg,
  'th-TH': th,
  'de-DE': de,
}

export function getMessages(locale: string) {
  const localeMessages = (locale && messages[locale]) || {}
  const fallbackMessages = messages['en-US']

  return { ...fallbackMessages, ...localeMessages }
}
