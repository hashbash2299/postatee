"use client"
import { useLiveUser } from "@/lib/hooks/useLiveUser";
import { useRouter } from "next/navigation";

const getNameColor = (role:string) => {
  const clean = (role||"").trim();
  if(clean === "مالك" || clean === "owner") return "text-violet-400 font-black";
  if(clean === "مؤسس") return "text-cyan-400";
  if(clean === "شخصية هامة") return "text-red-400";
  if(clean === "شارة خضراء") return "text-green-400";
  return "text-white";
};

// ✅ هل دي صورة حقيقية ولا صورة افتراضية قديمة؟
const isRealAvatar = (url: string) => {
  if(!url) return false;
  const low = url.toLowerCase();
  if(low.includes("default-avatar")) return false;
  if(low.includes("pravatar")) return false;
  if(low.includes("postatee-logo")) return false;
  if(low === "/default-avatar.png") return false;
  return true;
};

export default function UserAvatar({ uid, fallbackName, fallbackAvatar, fallbackRole, size="post", showDot=true, showName=true }: any){
  const liveUser = useLiveUser(uid);
  const router = useRouter();
  const displayName = liveUser?.displayName || fallbackName || "مستخدم";
  const rawAvatar = liveUser?.avatar || liveUser?.photoURL || fallbackAvatar || "";
  const avatar = isRealAvatar(rawAvatar) ? rawAvatar : "";
  const role = liveUser?.role || fallbackRole;
  const isOnline = liveUser?.reallyOnline;
  const sizeClass = size==="post"? "w-10 h-10" : size==="comment"? "w-8 h-8" : "w-24 h-24";
  const dotSize = size==="large"? "w-5 h-5 border-[3px]" : "w-3.5 h-3.5 border-2";
  const initial = (displayName || "?").charAt(0).toUpperCase();
  const textSize = size==="comment" ? "text-[13px]" : size==="large" ? "text-[28px]" : "text-[16px]";

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeClass} shrink-0`}>
        {avatar ? (
          <img src={avatar} onClick={()=>router.push(`/profile/${uid}`)} className={`${sizeClass} rounded-full object-cover border border-white/10 cursor-pointer bg-[#1a2a2f]`} alt={displayName}/>
        ) : (
          <div onClick={()=>router.push(`/profile/${uid}`)} className={`${sizeClass} rounded-full bg-[#1a2a2f] border border-white/10 flex items-center justify-center font-black text-white/60 cursor-pointer ${textSize}`}>{initial}</div>
        )}
        {showDot && isOnline && <span className={`absolute bottom-0 right-0 ${dotSize} bg-green-500 rounded-full border-[#050a0a]`}></span>}
      </div>
      {showName && <div className="flex items-center gap-1.5"><span onClick={()=>router.push(`/profile/${uid}`)} className={`font-bold text-[14px] cursor-pointer ${getNameColor(role)}`}>{displayName}</span></div>}
    </div>
  );
}