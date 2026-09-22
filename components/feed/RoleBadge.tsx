import { Crown, Star, Verified, Gem } from "lucide-react";

export const RoleBadge = ({ role }: { role: string }) => {
  const cleanRole = (role || "").trim(); // عشان لو في مسافة

  if (cleanRole === "مالك") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"><Crown className="w-3 h-3 fill-white"/> المالك</span>;
  if (cleanRole === "مؤسس") return <span className="inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/50 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><Gem className="w-3 h-3"/> مؤسس</span>;
  if (cleanRole === "شخصية هامة") return <span className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full"><Star className="w-3 h-3 fill-red-400"/> هامة</span>;
  if (cleanRole === "شارة خضراء") return <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><Verified className="w-3 h-3"/> موثق</span>;
  return null;
};

export const getNameColor = (role:string) => {
  const cleanRole = (role || "").trim();
  if(cleanRole === "مالك") return "text-violet-400 font-black";
  if(cleanRole === "مؤسس") return "text-cyan-400";
  if(cleanRole === "شخصية هامة") return "text-red-400";
  if(cleanRole === "شارة خضراء") return "text-green-400";
  return "text-white";
};