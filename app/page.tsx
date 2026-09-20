"use client"
import { useState } from "react";
import { Search, Home, Video, Store, Users2, Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Video as VideoIcon, Smile, Crown, ShieldCheck, Star, CheckCircle2, ArrowRight, Plus } from "lucide-react";

const RoleBadge = ({ role }: { role: string }) => {
  if (role === "مالك") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full"><Crown className="w-3 h-3"/> مالك</span>;
  if (role === "مؤسس") return <span className="inline-flex items-center gap-1 bg-white/10 border border-cyan-400/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3"/> مؤسس</span>;
  if (role === "شخصية هامة") return <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full"><Star className="w-3 h-3"/> هامة</span>;
  return null;
};

export default function PostateeApp() {
  const [view, setView] = useState<"feed" | "profile">("feed");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPost, setNewPost] = useState("");

  const users: any = {
    postatee: { id:"postatee", name:"Postatee", role:"مالك", avatar:"/logo.png", cover:"https://picsum.photos/1000/300?random=99", bio:"المنصة السودانية الأولى 🖤💎", followers:"10K", verified:true },
    hashem: { id:"hashem", name:"هاشم", role:"مؤسس", avatar:"https://i.pravatar.cc/100?img=12", cover:"https://picsum.photos/1000/300?random=10", bio:"مؤسس Postatee | أب لـ بيان (بنبنة) 💜 | أمدرمان", followers:"1.2K", verified:true },
    bayan: { id:"bayan", name:"بيان (بنبنة) 💜", role:"شخصية هامة", avatar:"https://i.pravatar.cc/100?img=8", cover:"https://picsum.photos/1000/300?random=20", bio:"بنوتة بابا هاشم 😍", followers:"999", verified:false },
    ahmed: { id:"ahmed", name:"أحمد عوض", role:"", avatar:"https://i.pravatar.cc/100?img=15", cover:"https://picsum.photos/1000/300?random=11", bio:"", followers:"340", verified:false },
    sara: { id:"sara", name:"سارة", role:"", avatar:"https://i.pravatar.cc/100?img=5", cover:"https://picsum.photos/1000/300?random=12", bio:"", followers:"120", verified:false },
  };

  const stories = [ users.hashem, users.bayan, users.ahmed, users.sara ];
  const contacts = [ users.hashem, users.bayan, users.ahmed, users.sara, users.postatee ];

  const [posts, setPosts] = useState([
    { id: 1, user: users.postatee, time:"منذ 5 دقائق", text:"أهلاً بكم في Postatee الرسمي! منصة بثيم أسود زجاجي وتركوازي فخم. تابعونا للمزيد 🖤💎", likes: 512, liked:false, image: null },
    { id: 2, user: users.hashem, time:"منذ ساعة", text:"شغالين على صفحات البروفايل الجديدة مع نظام البادجات! رأيكم؟", likes: 128, liked:false, image: "https://picsum.photos/600/400?random=1" },
    { id: 3, user: users.bayan, time:"منذ ساعتين", text:"بابا هاشم عامل موقع رهيب 😍", likes: 999, liked:true, image: "https://picsum.photos/600/500?random=2" },
  ]);

  const handleCreatePost = () => {
    if(!newPost.trim()) return;
    const post = { id: Date.now(), user: users.hashem, time:"الآن", text: newPost, likes: 0, liked:false, image: null };
    setPosts([post,...posts]);
    setNewPost("");
  };

  const toggleLike = (id: number) => setPosts(posts.map(p => p.id===id? {...p, liked:!p.liked, likes: p.liked? p.likes-1:p.likes+1}:p));
  const openProfile = (u:any)=>{ setSelectedUser(u); setView("profile"); };

  if (view==="profile" && selectedUser) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
        <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
          <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
            <div onClick={()=>setView("feed")} className="flex items-center gap-2 cursor-pointer"><img src="/logo.png" className="w-9 h-9 rounded-xl bg-white/5 p-1 border border-cyan-400/20"/><span className="font-black text-xl">Postatee</span></div>
            <button onClick={()=>setView("feed")} className="text-cyan-400 text-sm flex items-center gap-1"><ArrowRight className="w-4 h-4"/>رجوع</button>
          </header>
          <div className="max-w-[900px] mx-auto">
            <img src={selectedUser.cover} className="w-full h-64 object-cover"/>
            <div className="px-4 -mt-12 flex items-end gap-4">
              <img src={selectedUser.avatar} className="w-28 h-28 rounded-full border-4 border-[#050a0a]"/>
              <div className="mb-2"><div className="flex items-center gap-2"><h1 className="font-black text-2xl">{selectedUser.name}</h1><RoleBadge role={selectedUser.role}/></div><p className="text-white/60">{selectedUser.bio}</p></div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div className="min-h-screen bg-[#050a0a] text-white" dir="rtl">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src="/logo.png" className="w-9 h-9 rounded-xl bg-white/5 p-1 border border-cyan-400/20"/><span className="font-black text-xl">Postatee</span></div>
          <div className="hidden md:flex flex-1 max-w-xs mx-4 relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-white/30"/><input placeholder="ابحث في بوستاتي" className="w-full bg-white/5 border border-white/10 rounded-full pr-10 pl-4 py-2 text-sm outline-none"/></div>
          <div className="flex items-center gap-3"><Home className="w-6 h-6 text-cyan-400"/><Video className="w-6 h-6 text-white/40"/><Store className="w-6 h-6 text-white/40"/><Users2 className="w-6 h-6 text-white/40"/></div>
        </header>

        <div className="max-w-[1300px] mx-auto flex gap-4 p-3">
          <div className="hidden lg:block w-[260px] space-y-2 sticky top-[60px] h-fit">
            {Object.values(users).slice(0,4).map((u:any)=>(
              <div key={u.id} onClick={()=>openProfile(u)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer"><img src={u.avatar} className="w-9 h-9 rounded-full"/><span className="text-sm font-bold">{u.name}</span></div>
            ))}
          </div>

          <div className="flex-1 max-w-[600px] mx-auto space-y-3">
            {/* استوريهات */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex gap-3 overflow-x-auto">
              <div className="min-w-[110px] h-[170px] bg-gradient-to-b from-cyan-400/20 to-black/40 border border-cyan-400/20 rounded-xl flex flex-col items-center justify-end p-2 relative"><div className="absolute top-2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center text-black"><Plus className="w-5 h-5"/></div><span className="text-xs font-bold">إنشاء ستوري</span></div>
              {stories.map((s:any)=>(
                <div key={s.id} onClick={()=>openProfile(s)} className="min-w-[110px] h-[170px] rounded-xl overflow-hidden relative cursor-pointer border border-white/10"><img src={s.cover} className="w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><img src={s.avatar} className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-cyan-400"/><span className="absolute bottom-2 right-2 text-xs font-bold">{s.name}</span></div>
              ))}
            </div>

            {/* إنشاء منشور - رجع */}
            <div className="bg-white/[0.04] backdrop-blur border border-white/10 rounded-2xl p-3">
              <div className="flex gap-3">
                <img src={users.hashem.avatar} className="w-10 h-10 rounded-full"/>
                <input value={newPost} onChange={(e)=>setNewPost(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleCreatePost()} placeholder="أكتب ما يخطر ببالك الآن" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-sm outline-none focus:border-cyan-400/50 placeholder:text-white/30"/>
              </div>
              <div className="h-[1px] bg-white/10 my-3"/>
              <div className="flex justify-between">
                <button className="flex items-center gap-2 text-sm text-white/60 hover:bg-white/5 px-3 py-1.5 rounded-lg"><VideoIcon className="w-5 h-5 text-red-400"/> فيديو مباشر</button>
                <button className="flex items-center gap-2 text-sm text-white/60 hover:bg-white/5 px-3 py-1.5 rounded-lg"><ImageIcon className="w-5 h-5 text-green-400"/> صورة/فيديو</button>
                <button className="flex items-center gap-2 text-sm text-white/60 hover:bg-white/5 px-3 py-1.5 rounded-lg"><Smile className="w-5 h-5 text-yellow-400"/> شعور</button>
              </div>
              {newPost && <button onClick={handleCreatePost} className="w-full mt-3 bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-black py-2 rounded-xl text-sm">نشر</button>}
            </div>

            {posts.map((post)=>(
              <div key={post.id} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between"><div className="flex gap-3"><img src={post.user.avatar} onClick={()=>openProfile(post.user)} className="w-10 h-10 rounded-full border border-cyan-400/20 cursor-pointer"/><div><div className="flex items-center gap-2"><span className="font-bold text-sm cursor-pointer" onClick={()=>openProfile(post.user)}>{post.user.name}</span><RoleBadge role={post.user.role}/>{post.user.verified && <CheckCircle2 className="w-4 h-4 text-cyan-400"/>}</div><span className="text-xs text-white/40">{post.time}</span></div></div><MoreHorizontal className="w-5 h-5 text-white/30"/></div>
                <p className="mt-3 text-[15px]">{post.text}</p>
                {post.image && <img src={post.image} className="mt-3 rounded-xl w-full"/>}
                <div className="flex gap-6 mt-4 pt-3 border-t border-white/5"><button onClick={()=>toggleLike(post.id)} className={`flex gap-1.5 text-sm ${post.liked?'text-pink-500':'text-white/50'}`}><Heart className={`w-5 h-5 ${post.liked?'fill-pink-500':''}`}/>{post.likes}</button><span className="flex gap-1.5 text-sm text-white/50"><MessageCircle className="w-5 h-5"/>تعليق</span><span className="flex gap-1.5 text-sm text-white/50"><Share2 className="w-5 h-5"/>مشاركة</span></div>
              </div>
            ))}
          </div>

          <div className="hidden xl:block w-[280px] sticky top-[60px] h-fit space-y-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3">
              <h3 className="font-bold text-sm mb-3 text-white/80">جهات الاتصال</h3>
              <div className="space-y-1">
                {contacts.map((c:any)=>(
                  <div key={c.id} onClick={()=>openProfile(c)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
                    <div className="relative"><img src={c.avatar} className="w-8 h-8 rounded-full"/><span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#050a0a]"></span></div>
                    <span className="text-sm">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}