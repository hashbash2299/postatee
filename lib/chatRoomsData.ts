export const sudaneseRooms: any[] = []

export const ROOM_DECORATIONS = [
  { id: "none", label: "عادي", fn: (n: string) => n },
  { id: "crown", label: "👑 تاج", fn: (n: string) => `👑 ${n} 👑` },
  { id: "fire", label: "🔥 نار", fn: (n: string) => `🔥 ${n} 🔥` },
  { id: "fancy", label: "꧁ زخرفة", fn: (n: string) => `꧁༺ ${n} ༻꧂` },
  { id: "star", label: "★ نجوم", fn: (n: string) => `★彡 ${n} 彡★` },
  { id: "diamond", label: "💎 ألماس", fn: (n: string) => `💎 ${n} 💎` },
]

export const ROOM_ICONS = ["🏠", "☕", "🔥", "👑", "💎", "🌹", "🎮", "🎵", "⚽", "📚", "💬", "🌙", "🇸🇩", "❤️"]

export function getLevelFromXP(xp: number) {
  if (xp < 100) return { level: 1, title: "جديد", stars: 1, nextXP: 100 }
  if (xp < 300) return { level: 5, title: "نشط", stars: 2, nextXP: 300 }
  if (xp < 800) return { level: 10, title: "معروف", stars: 3, nextXP: 800 }
  return { level: 20, title: "نجم صاعد", stars: 4, nextXP: 2000 }
}

export const NEW_UPDATE = {
  version: "v2.0",
  title: "تحديث Postatee الكبير 🎉",
  features: ["✨ غرفتك الخاصة باسم مزخرف", "⭐ نظام مستويات و XP", "🎁 هدايا مجانية", "🔒 غرف خاصة وعامة"]
}