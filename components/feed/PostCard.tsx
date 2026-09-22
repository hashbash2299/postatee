"use client"
import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
import { useLiveUser } from "@/lib/hooks/useLiveUser";
import { RoleBadge, getNameColor } from "./RoleBadge";
import PostMenu from "./PostMenu";
import { useRouter } from "next/navigation";

const timeAgo = (ts:any) => {
  if(!ts?.seconds) return "الآن";
  const s = Math.floor((Date.now() - ts.seconds*1000)/1000);
  if(s < 60) return "الآن";
  if(s < 3600) return `${Math.floor(s/60)} د`;
  if(s < 86400) return `${Math.floor(s/3600)} س`;
  return `${Math.floor(s/86400)} ي`;
};

function LiveAuthor({ uid, fallbackName, fallbackRole, fallbackAvatar, size="post" }: any){
  const liveUser = useLiveUser(uid);
  const router = useRouter();
  const displayName = liveUser?.displayName || fallbackName;
  const role = liveUser?.role || fallbackRole || "";
  const avatar = liveUser?.avatar || fallbackAvatar;
  const isPost = size==="post";
  return (
    <>
      <img src={avatar || `https://i.pravatar.cc/100?u=${uid}`} onClick={()=>router.push(`/profile/${uid}`)} className={`${isPost?'w-10 h-10':'w-7 h-7'} rounded-full border border-cyan-400/20 cursor-pointer`}/>
      <div className={isPost? "": "flex-1"}>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${isPost?'text-sm':'text-[13px]'} cursor-pointer ${getNameColor(role)}`} onClick={()=>router.push(`/profile/${uid}`)}>{displayName}</span>
          <RoleBadge role={role}/>
        </div>
        {isPost && <span className="text-xs text-white/40">@{liveUser?.username || fallbackName} • {timeAgo(fallbackName?.created_at)}</span>}
      </div>
    </>
  );
}

function CommentsList({ postId, currentUser }: any){
  const [comments, setComments] = useState<any[]>([]);
  useEffect(()=>{
    const q = query(collection(db,'posts',postId,'comments'), orderBy('created_at','asc'));
    const unsub = onSnapshot(q, s=> setComments(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>unsub();
  },[postId]);

  return (
    <div className="space-y-2 mt-3">
      {comments.map((c:any)=>{
        const uid = c.uid || c.authorId;
        const liveUser = c.authorRole; // حنستخدم LiveAuthor جوة
        return (
          <div key={c.id} className="flex gap-2 bg-white/[0.03] border border-white/5 p-2.5 rounded-xl">
            {/* هنا رجعنا اللون */}
            <LiveAuthor uid={uid} fallbackName={c.authorName} fallbackRole={c.authorRole} fallbackAvatar={c.authorAvatar} size="comment" />
            <div className="flex-1 -mt-0.5">
              <p className="text-[13px] text-white/80">{c.text}</p>
              <p className="text-[10px] text-white/30 mt-1">{timeAgo(c.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PostCard({ post, currentUser, onHide, onStartEdit, isEditing, editingContent, setEditingContent, onSaveEdit, onCancelEdit, commentText, setCommentText, openComments, setOpenComments }: any){
  const handleLike = async()=>{
    const ref = doc(db,'posts',post.id);
    const liked = post.likes?.includes(currentUser.uid);
    if(liked) await updateDoc(ref, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) });
    else await updateDoc(ref, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) });
  };
  const handleComment = async()=>{
    const txt = commentText[post.id]; if(!txt?.trim()) return;
    await addDoc(collection(db,'posts',post.id,'comments'), { text: txt, created_at: serverTimestamp(), uid: currentUser.uid, authorId: currentUser.uid, authorName: currentUser.displayName, authorAvatar: currentUser.avatar, authorRole: currentUser.role || "", authorUsername: currentUser.username });
    await updateDoc(doc(db,'posts',post.id), { commentsCount: increment(1) });
    setCommentText((prev:any)=>({...prev,[post.id]:""}));
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'); *{font-family:'Tajawal',sans-serif!important;}`}</style>
      <div id={`post-${post.id}`} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <LiveAuthor uid={post.authorId||post.uid} fallbackName={post.authorName} fallbackRole={post.authorRole} fallbackAvatar={post.authorAvatar} size="post"/>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/30">{timeAgo(post.created_at)}</span>
            <PostMenu post={post} currentUser={currentUser} onHide={onHide} onEdit={onStartEdit}/>
          </div>
        </div>

        {isEditing? (
          <div className="mt-3"><textarea value={editingContent} onChange={e=>setEditingContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none min-h-[80px]"/><div className="flex gap-2 mt-2"><button onClick={onSaveEdit} className="bg-cyan-400 text-black px-4 py-1.5 rounded-full text-sm font-bold">حفظ</button><button onClick={onCancelEdit} className="bg-white/10 px-4 py-1.5 rounded-full text-sm">إلغاء</button></div></div>
        ) : (
          <p className="mt-3 text-[15px] whitespace-pre-wrap leading-6">
            {post.feeling && <span className="text-white/60 text-sm">— {post.feeling.icon} {post.feeling.label} </span>}
            {post.content}
          </p>
        )}

        {post.image && <img src={post.image} className="mt-3 rounded-xl w-full"/>}
        {post.video && <video src={post.video} controls className="mt-3 rounded-xl w-full max-h-[500px] bg-black"/>}

        <div className="flex justify-between mt-4 pt-3 border-t border-white/5">
          <button onClick={handleLike} className={`flex gap-1.5 text-sm items-center ${post.likes?.includes(currentUser?.uid)?'text-red-500':'text-white/50'}`}><Heart className={`w-5 h-5 ${post.likes?.includes(currentUser?.uid)?'fill-red-500':''}`}/> {post.likesCount||0}</button>
          <button onClick={()=>setOpenComments((p:any)=>({...p,[post.id]:!p[post.id]}))} className="flex gap-1.5 text-sm text-white/50 items-center"><MessageCircle className="w-5 h-5"/> {post.commentsCount||0}</button>
          <button className="flex gap-1.5 text-sm text-white/50 items-center"><Share2 className="w-5 h-5"/> مشاركة</button>
        </div>

        {openComments[post.id] && (
          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="flex gap-2">
              <img src={currentUser?.avatar} className="w-7 h-7 rounded-full"/>
              <div className="flex-1 flex gap-2">
                <input value={commentText[post.id]||""} onChange={e=>setCommentText((prev:any)=>({...prev,[post.id]:e.target.value}))} placeholder="اكتب تعليق..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-sm outline-none"/>
                <button onClick={handleComment} className="bg-cyan-400 text-black rounded-full w-8 h-8 flex items-center justify-center"><Send className="w-4 h-4"/></button>
              </div>
            </div>
            <CommentsList postId={post.id} currentUser={currentUser}/>
          </div>
        )}
      </div>
    </>
  )
}