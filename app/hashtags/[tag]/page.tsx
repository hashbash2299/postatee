"use client"
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import PostCard from "@/components/feed/PostCard";
import { ArrowRight } from "lucide-react";

export default function HashtagPage(){
  const { tag } = useParams() as { tag: string };
  const decodedTag = decodeURIComponent(tag);
  const [posts, setPosts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);

  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"posts"), snap=>{
      const data = snap.docs.map(d=>({id:d.id,...d.data() as any}));
      setPosts(data);
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const withHash = posts.filter(p=> p.content?.includes(`#${decodedTag}`) || p.content?.includes(decodedTag));
    withHash.sort((a,b)=> (b.likes?.length||0) - (a.likes?.length||0));
    setFiltered(withHash);
  },[posts, decodedTag]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#0B1418] text-white">
      <div className="max-w-[720px] mx-auto p-4">
        <Link href="/" className="inline-flex items-center gap-2 bg-[#122025] border border-white/10 px-4 py-2 rounded-full text-sm mb-6"><ArrowRight className="w-4 h-4" /> رجوع للرئيسية</Link>

        <div className="bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/5 border border-[#00E5FF]/30 rounded-2xl p-6 mb-6 text-center">
          <h1 className="text-3xl font-black text-[#00E5FF]">#{decodedTag}</h1>
          <p className="text-white/60 mt-2 text-sm">{filtered.length} منشور بهذا الهاشتاق</p>
          <p className="text-white/40 text-[11px] mt-1">كل المنشورات الفيها #{decodedTag} حتظهر هنا</p>
        </div>

        {filtered.length===0? (
          <div className="text-center py-20 bg-[#122025] rounded-2xl border border-dashed border-white/10">
            <p className="text-4xl mb-3">🏜️</p>
            <p className="text-white/60">لسه مافي منشورات بالهاشتاق ده</p>
            <p className="text-white/40 text-sm mt-1">كن أول زول ينشر #{decodedTag}</p>
            <Link href="/" className="inline-block mt-4 bg-[#00E5FF] text-black px-6 py-2 rounded-full font-bold text-sm">أنشر الآن</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(post=>(
              <div key={post.id} className="bg-[#122025] rounded-2xl border border-[#1A2E35] overflow-hidden">
                <PostCard post={post} currentUser={null} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}