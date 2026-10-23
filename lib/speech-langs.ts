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

import { supabase } from "./supabase"

const KEY = "ss_speech_lang"

export function loadSpeechLang(): string {
  try {
    return localStorage.getItem(KEY) || ""
  } catch {
    return ""
  }
}

export function saveSpeechLang(code: string) {
  // Also keep it on the account so it follows the person to any phone or computer
  supabase.auth.updateUser({ data: { ss_speech_lang: code } }).catch(() => {})
  try {
    if (code) localStorage.setItem(KEY, code)
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable
  }
}

// The language saved on the account, used when this browser has none yet
export async function fetchAccountSpeechLang(): Promise<string> {
  try {
    // Ask the server, so a change made on another device shows up here too
    const { data } = await supabase.auth.getUser()
    const code = data.user?.user_metadata?.ss_speech_lang
    return typeof code === "string" ? code : ""
  } catch {
    return ""
  }
}
