// lib/chatRoomsData.ts - Postatee V2 - Clean + زخرفة المقاعد + Owner
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

export const USER_DECORATIONS = [
  { id: "none", label: "بدون", prefix: "", minLevel: 0 },
  { id: "star1", label: "⭐ نجمة", prefix: "⭐", minLevel: 5 },
  { id: "crown", label: "👑 تاج", prefix: "👑", minLevel: 15 },
  { id: "diamond", label: "💎 ألماس", prefix: "💎", minLevel: 30 },
  { id: "fire", label: "🔥 ناري", prefix: "🔥", minLevel: 50 },
]

export function getLevelFromXP(xp: number) {
  if (xp < 100) return { level: 1, title: "جديد", stars: 1, nextXP: 100 }
  if (xp < 300) return { level: 5, title: "نشط", stars: 2, nextXP: 300 }
  if (xp < 800) return { level: 10, title: "معروف", stars: 3, nextXP: 800 }
  if (xp < 2000) return { level: 20, title: "نجم صاعد", stars: 4, nextXP: 2000 }
  if (xp < 5000) return { level: 35, title: "نجم ⭐", stars: 5, nextXP: 5000 }
  return { level: 55, title: "سوبر ستار 🌟", stars: 6, nextXP: 10000 }
}

export function getDecoratedUserName(name: string, xp: number, decorationId?: string) {
  const deco = USER_DECORATIONS.find(d => d.id === decorationId)
  if (deco && xp >= deco.minLevel && deco.prefix) return `${deco.prefix} ${name}`
  const lvl = getLevelFromXP(xp)
  if (lvl.level >= 35) return `⭐ ${name}`
  return name
}

export const GIFTS = [
  { id: "rose", icon: "🌹", name: "وردة", xp: 10, price: 0, free: true },
  { id: "heart", icon: "❤️", name: "قلب", xp: 25, price: 100, free: false },
  { id: "crown_gift", icon: "👑", name: "تاج", xp: 100, price: 500, free: false },
  { id: "lion", icon: "🦁", name: "أسد", xp: 500, price: 5000, free: false },
  { id: "diamond_gift", icon: "💎", name: "ألماسة", xp: 1000, price: 10000, free: false },
]

export const DAILY_TASKS = [
  { id: "login", title: "سجل دخول اليوم", desc: "افتح التطبيق", target: 1, rewardXP: 50, icon: "📅" },
  { id: "messages", title: "أرسل 20 رسالة", desc: "ونّس مع الناس", target: 20, rewardXP: 100, icon: "💬" },
  { id: "stay", title: "اقعد 10 دقايق في غرفة", desc: "خليك متواجد", target: 10, rewardXP: 150, icon: "⏰" },
  { id: "gift", title: "أرسل هدية", desc: "فرّح زول", target: 1, rewardXP: 100, icon: "🎁" },
  { id: "create", title: "أنشئ غرفة", desc: "اعمل غرفتك الخاصة", target: 1, rewardXP: 200, icon: "🏠" },
]

export const NEW_UPDATE = {
  version: "v2.0",
  date: "اليوم",
  title: "تحديث Postatee الكبير 🎉🇸🇩",
  features: [
    "✨ غرفتك الخاصة باسم مزخرف",
    "⭐ نظام المستوى والنجوم",
    "🎁 هدايا جديدة",
    "🎯 مهام يومية",
    "🧹 حذفنا كل الغرف القديمة - بداية نظيفة",
  ]
}

// ===== ✅ جديد: زخرفة المقاعد - مربوطة بالمتجر =====
export const SEAT_FRAMES = [
  { id: "none", label: "عادي", class: "bg-white/20", price: 0, minLevel: 0 },
  { id: "gold", label: "👑 ذهبي", class: "bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.5)]", price: 500, minLevel: 5 },
  { id: "fire", label: "🔥 ناري", class: "bg-gradient-to-br from-orange-500 to-red-600 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse", price: 800, minLevel: 10 },
  { id: "ice", label: "❄️ ثلجي", class: "bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]", price: 800, minLevel: 10 },
  { id: "rainbow", label: "🌈 قوس قزح", class: "bg-gradient-to-br from-pink-500 via-yellow-500 to-green-500 shadow-[0_0_20px_rgba(236,72,153,0.6)]", price: 1500, minLevel: 20 },
  { id: "diamond", label: "💎 ماسي", class: "bg-gradient-to-br from-white via-cyan-200 to-white shadow-[0_0_20px_rgba(255,255,255,0.8)]", price: 2000, minLevel: 35 },
  { id: "owner", label: "👑 مالك", class: "bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.9)] animate-pulse", price: 0, minLevel: 0, ownerOnly: true },
]

// ===== ✅ جديد: ألوان الاسم =====
export const NAME_COLORS = [
  { id: "white", label: "أبيض", class: "text-white", price: 0, minLevel: 0 },
  { id: "gold", label: "ذهبي", class: "text-yellow-400 font-black", price: 300, minLevel: 5 },
  { id: "green", label: "أخضر نيون", class: "text-[#00E676] font-black", price: 300, minLevel: 5 },
  { id: "rainbow", label: "قوس قزح", class: "bg-gradient-to-r from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent font-black", price: 1000, minLevel: 20 },
  { id: "owner", label: "👑 مالك", class: "text-yellow-300 font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]", price: 0, minLevel: 0, ownerOnly: true },
]

// ===== ✅ جديد: صلاحية الأونر - بدون UID =====
export function isOwner(userProfile: any) {
  return userProfile?.role === "owner"
}
export function isLegend(userProfile: any) {
  return userProfile?.role === "owner"
}

// ===== ✅ جديد: دوال مساعدة للزخرفة =====
export function getSeatFrame(frameId?: string, userProfile?: any) {
  // الأونر دايماً إطارو ذهبي ملكي
  if (isOwner(userProfile)) return SEAT_FRAMES.find(f => f.id === "owner")!
  const f = SEAT_FRAMES.find(f => f.id === frameId)
  if (!f || (f as any).ownerOnly) return SEAT_FRAMES[0]
  return f
}
export function getNameColor(colorId?: string, userProfile?: any) {
  if (isOwner(userProfile)) return NAME_COLORS.find(c => c.id === "owner")!
  const c = NAME_COLORS.find(c => c.id === colorId)
  if (!c || (c as any).ownerOnly) return NAME_COLORS[0]
  return c
}
export function getOwnerDisplayName(name: string, userProfile?: any) {
  if (isOwner(userProfile)) return `👑 ${name}`
  return getDecoratedUserName(name, userProfile?.xp || 0, userProfile?.decorationId)
}