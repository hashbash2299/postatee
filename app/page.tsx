"use client"
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryBar from "@/components/feed/StoryBar";
import CreatePostBox from "@/components/feed/CreatePostBox";

export default function HomePage(){
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(()=>{
    const q = query(collection(db, 'posts'), orderBy('created_at','desc'));
    return onSnapshot(q, (snap)=> setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);
  return (
    <div className="w-full max-w-[680px] mx-auto min-h-screen pb-20">
      <StoryBar />
      <CreatePostBox />
      <div className="mt-3 space-y-3 px-0 lg:px-3">
        {posts.map((post:any)=>(
          <div key={post.id} className="bg-[#111E24] lg:rounded-2xl p-4 border-y lg:border border-white/[0.06]">
            <div className="flex gap-3">
              <img src={post.authorAvatar} className="w-10 h-10 rounded-full" />
              <div><p className="text-white font-bold text-[13px]">{post.authorName}</p><p className="text-white/30 text-[11px]">الآن</p></div>
            </div>
            <p className="text-white/90 text-[14px] mt-3 leading-7 whitespace-pre-wrap">{post.content}</p>
            {post.image && <img src={post.image} className="mt-3 rounded-xl w-full" />}
            {post.video && <video src={post.video} controls className="mt-3 rounded-xl w-full" />}
          </div>
        ))}
      </div>
    </div>
  )
}