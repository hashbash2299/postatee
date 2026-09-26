"use client"
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import StoryBar from "@/components/StoryBar"; // القديم بتاعك
import CreatePostBox from "@/components/CreatePostBox"; // القديم بتاعك
import PostCard from "@/components/PostCard"; // ده فيهو البدجات والايقونات
import AdBanner from "@/components/AdBanner";

export default function HomePage(){
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(()=>{
    const q = query(collection(db, 'posts'), orderBy('created_at','desc'));
    return onSnapshot(q, (snap)=> setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))));
  },[]);
  return (
    <div className="w-full max-w-[680px] mx-auto min-h-screen pb-20">
      <AdBanner />
      <StoryBar />
      <CreatePostBox />
      <div className="mt-3 space-y-3">
        {posts.map((post:any)=> <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  )
}