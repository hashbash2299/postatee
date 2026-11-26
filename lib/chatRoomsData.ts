// lib/chatRoomsData.ts - Postatee Rooms V2

export const sudaneseRooms = [
  { id: "al7osh-alkabeer", name: "الحوش الكبير", icon: "🏠", desc: "بيت السودان الكبير - يلم الجميع", color: "from-[#FFD700] to-[#FF9800]", bg: "bg-[#FFD700]/20", online: 0, isBig: true, isOfficial: true },
  { id: "girls", name: "مجلس البنات", icon: "👩🏽‍🦱", desc: "خاص للبنات فقط", color: "from-pink-500 to-rose-500", bg: "bg-pink-500/20", online: 0, isOfficial: true },
  { id: "shabab", name: "ديوان الشباب", icon: "☕", desc: "ونسة وضحك", color: "from-cyan-400 to-blue-500", bg: "bg-cyan-500/20", online: 0, isOfficial: true },
  { id: "sharg", name: "أهل الشرق", icon: "🏔️", desc: "كسلا - بورتسودان", color: "from-orange-400 to-red-500", bg: "bg-orange-500/20", online: 0, isOfficial: true },
  { id: "jazeera", name: "ناس الجزيرة", icon: "🌾", desc: "مدني - الحصاحيصا", color: "from-green-400 to-emerald-600", bg: "bg-green-500/20", online: 0, isOfficial: true },
  { id: "kurdufan", name: "كردفان الخير", icon: "🥜", desc: "الأبيض - أم روابة - بارا - النهود", color: "from-yellow-400 to-amber-600", bg: "bg-yellow-500/20", online: 0, isOfficial: true },
  { id: "shamal", name: "نخيل الشمال", icon: "🌴", desc: "دنقلا - شندي - عطبرة - مروي - حلفا", color: "from-amber-700 to-yellow-800", bg: "bg-amber-700/20", online: 0, isOfficial: true },
  { id: "darfur", name: "دارفور الكبرى", icon: "🏜️", desc: "الفاشر - نيالا - زالنجي - الجنينة", color: "from-red-700 to-orange-800", bg: "bg-red-700/20", online: 0, isOfficial: true },
  { id: "moghtrbeen", name: "المغتربين", icon: "✈️", desc: "أفريقيا - آسيا - الخليج - أوروبا", color: "from-sky-400 to-indigo-500", bg: "bg-sky-500/20", online: 0, isOfficial: true },
]

// ===== زخارف الأسماء =====
export const ROOM_DECORATIONS = [
  { id: "none", label: "عادي", fn: (n: string) => n },
  { id: "crown", label: "👑 تاج", fn: (n: string) => `👑 ${n} 👑` },
  { id: "fire", label: "🔥 نار", fn: (n: string) => `🔥 ${n} 🔥` },
  { id: "fancy", label: "꧁ زخرفة", fn: (n: string) => `꧁༺ ${n} ༻꧂` },
  { id: "star", label: "★ نجوم", fn: (n: string) => `★彡 ${n} 彡★` },
  { id: "diamond", label: "💎 ألماس", fn: (n: string) => `💎 ${n} 💎` },
]

export const USER_DECORATIONS = [
  { id: "none", label: "بدون", prefix: "", minLevel: 0 },
  { id: "star1", label: "⭐ نجمة", prefix: "⭐", minLevel: 5 },
  { id: "crown", label: "👑 تاج", prefix: "👑", minLevel: 15 },
  { id: "diamond", label: "💎 ألماس", prefix: "💎", minLevel: 30 },
  { id: "fire", label: "🔥 ناري", prefix: "🔥", minLevel: 50 },
]

// ===== نظام المستوى والنجوم =====
export function getLevelFromXP(xp: number) {
  if (xp < 100) return { level: 1, title: "جديد", stars: 1, nextXP: 100 }
  if (xp < 300) return { level: 5, title: "نشط", stars: 2, nextXP: 300 }
  if (xp < 800) return { level: 10, title: "معروف", stars: 3, nextXP: 800 }
  if (xp < 2000) return { level: 20, title: "نجم صاعد", stars: 4, nextXP: 2000 }
  if (xp < 5000) return { level: 35, title: "نجم ⭐", stars: 5, nextXP: 5000 }
  if (xp < 10000) return { level: 55, title: "سوبر ستار 🌟", stars: 6, nextXP: 10000 }
  return { level: 80, title: "أسطورة 👑", stars: 7, nextXP: 20000 }
}

export function getDecoratedUserName(name: string, xp: number, decorationId?: string) {
  const deco = USER_DECORATIONS.find(d => d.id === decorationId)
  if (deco && xp >= deco.minLevel && deco.prefix) return `${deco.prefix} ${name}`
  const lvl = getLevelFromXP(xp)
  if (lvl.level >= 35) return `⭐ ${name}`
  return name
}

// ===== الهدايا =====
export const GIFTS = [
  { id: "rose", icon: "🌹", name: "وردة", xp: 10, price: 0, free: true },
  { id: "heart", icon: "❤️", name: "قلب", xp: 25, price: 100, free: false },
  { id: "crown_gift", icon: "👑", name: "تاج", xp: 100, price: 500, free: false },
  { id: "lion", icon: "🦁", name: "أسد", xp: 500, price: 5000, free: false },
  { id: "diamond_gift", icon: "💎", name: "ألماسة", xp: 1000, price: 10000, free: false },
]

// ===== المهام اليومية =====
export const DAILY_TASKS = [
  { id: "login", title: "سجل دخول اليوم", desc: "افتح التطبيق", target: 1, rewardXP: 50, icon: "📅" },
  { id: "messages", title: "أرسل 20 رسالة", desc: "ونّس مع الناس", target: 20, rewardXP: 100, icon: "💬" },
  { id: "stay", title: "اقعد 10 دقايق في غرفة", desc: "خليك متواجد", target: 10, rewardXP: 150, icon: "⏰" },
  { id: "gift", title: "أرسل هدية", desc: "فرّح زول", target: 1, rewardXP: 100, icon: "🎁" },
  { id: "create", title: "أنشئ غرفة", desc: "اعمل غرفتك الخاصة", target: 1, rewardXP: 200, icon: "🏠" },
]

export const ROOM_ICONS = ["🏠", "☕", "🔥", "👑", "💎", "🌹", "🎮", "🎵", "⚽", "📚", "💬", "🌙", "🇸🇩", "❤️"]