import { createI18n } from 'vue-i18n'
import languages from '../../../locales/languages.json'

const localeFiles = import.meta.glob('../../../locales/!(languages).json', { eager: true })

const messages = {}
const availableLocales = []

for (const path in localeFiles) {
  const key = path.match(/\/([^/]+)\.json$/)[1]
  if (languages[key]) {
    messages[key] = localeFiles[path].default
    availableLocales.push({ key, label: languages[key].label })
  }
}

const DEFAULT_LOCALE = 'en'
const savedLocale = localStorage.getItem('locale')
const localeFromBrowser = navigator.language || DEFAULT_LOCALE

const normalizeLocale = (rawLocale) => {
  if (!rawLocale) return DEFAULT_LOCALE
  const lower = rawLocale.toLowerCase()
  if (messages[lower]) return lower
  const base = lower.split('-')[0]
  if (messages[base]) return base
  return DEFAULT_LOCALE
}

// Force English as system display default.
// Existing "zh" preference is migrated to "en" unless user switches again.
const resolvedLocale = savedLocale === 'zh'
  ? DEFAULT_LOCALE
  : normalizeLocale(savedLocale || localeFromBrowser)

const i18n = createI18n({
  legacy: false,
  locale: resolvedLocale,
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

localStorage.setItem('locale', resolvedLocale)

export { availableLocales }
export default i18n
