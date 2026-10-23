// Languages the voice note can listen in. Empty means the browser's own language.
export const SPEECH_LANGS: { code: string; label: string }[] = [
  { code: "", label: "Auto (browser language)" },
  { code: "en-US", label: "English" },
  { code: "es-US", label: "Español (Spanish)" },
  { code: "pt-BR", label: "Português (Portuguese)" },
  { code: "fr-FR", label: "Français (French)" },
  { code: "pl-PL", label: "Polski (Polish)" },
  { code: "ru-RU", label: "Русский (Russian)" },
  { code: "uk-UA", label: "Українська (Ukrainian)" },
  { code: "vi-VN", label: "Tiếng Việt (Vietnamese)" },
  { code: "zh-CN", label: "中文 (Chinese)" },
]

const KEY = "ss_speech_lang"

export function loadSpeechLang(): string {
  try {
    return localStorage.getItem(KEY) || ""
  } catch {
    return ""
  }
}

export function saveSpeechLang(code: string) {
  try {
    if (code) localStorage.setItem(KEY, code)
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable
  }
}
