"use client"
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Heart, MessageCircle, Share2, Send, CornerDownRight, ThumbsUp } from "lucide-react";
import { useLiveUser } from "@/lib/hooks/useLiveUser";
import { RoleBadge, getNameColor } from "./RoleBadge";
import PostMenu from "./PostMenu";
import { useRouter } from "next/navigation";

const timeAgo = (post:any) => {
  const ts = post.createdAtMillis || post.created_at;
  if(!ts) return "الآن";
  let ms = 0;
  if(typeof ts === 'number') ms = ts;
  else if(ts?.seconds) ms = ts.seconds*1000;
  else if(ts?.toDate) ms = ts.toDate().getTime();
  else if(ts instanceof Date) ms = ts.getTime();
  const s = Math.floor((Date.now() - ms)/1000);
  if(s < 60) return "الآن";
  if(s < 3600) return `${Math.floor(s/60)} د`;
  if(s < 86400) return `${Math.floor(s/3600)} س`;
  return `${Math.floor(s/86400)} ي`;
};

function LiveAuthor({ uid, fallbackName, fallbackRole, fallbackAvatar, size="post", feeling }: any){
  const liveUser = useLiveUser(uid);
  const router = useRouter();
  const displayName = liveUser?.displayName || fallbackName;
  const role = liveUser?.role || fallbackRole || "";
  const avatar = liveUser?.avatar || fallbackAvatar;
  const isPost = size==="post";
  return (
    <div className="flex gap-2 items-center">
      <div className="relative shrink-0">
        <img src={avatar || `https://i.pravatar.cc/100?u=${uid}`} onClick={()=>router.push(`/profile/${uid}`)} className={`${isPost?'w-10 h-10':'w-7 h-7'} rounded-full border border-cyan-400/20 cursor-pointer bg-white/5 object-cover`} />
        {liveUser?.reallyOnline && <span className={`absolute -bottom-0.5 -right-0.5 ${isPost?'w-3.5 h-3.5':'w-2.5 h-2.5'} bg-green-500 rounded-full border-2 border-[#0B1418]`}></span>}
      </div>
      <div className={isPost? "": "flex-1"}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-bold ${isPost?'text-sm':'text-[13px]'} cursor-pointer ${getNameColor(role)}`} onClick={()=>router.push(`/profile/${uid}`)}>{displayName}</span>
          <RoleBadge role={role}/>
          {feeling && <span className="text-[13px] text-white/70 flex items-center gap-1">— يشعر بـ <span className="text-[16px]">{feeling.icon || feeling.emoji}</span> <span className="text-white">{feeling.label}</span></span>}
        </div>
      </div>
    </div>
  );
}

function CommentsList({ postId, currentUser, setReplyTo }: any){
  const [comments, setComments] = useState<any[]>([]);
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,'posts',postId,'comments'), s=> {
      const data = s.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a:any,b:any)=>{ const at = a.createdAtMillis || a.created_at?.seconds*1000 || 0; const bt = b.createdAtMillis || b.created_at?.seconds*1000 || 0; return at - bt; });
      setComments(data);
    });
    return ()=>unsub();
  },[postId]);

  const handleCommentLike = async (c:any) => {
    const ref = doc(db,'posts',postId,'comments',c.id);
    const liked = c.likes?.includes(currentUser.uid);
    if(liked) await updateDoc(ref, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) });
    else await updateDoc(ref, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) });
  }

  return (
    <div className="space-y-3 mt-3">
      {comments.map((c:any)=>{
        const uid = c.uid || c.authorId;
        const isLiked = c.likes?.includes(currentUser?.uid);
        return (
          <div key={c.id} className="flex gap-2">
            <LiveAuthor uid={uid} fallbackName={c.authorName} fallbackRole={c.authorRole} fallbackAvatar={c.authorAvatar} size="comment" />
            <div className="flex-1 relative">
              <div className="bg-white/[0.06] border border-white/5 px-3 py-2 rounded-2xl rounded-tl-sm relative">
                {c.replyToName && (<div className="flex items-center gap-1 text-[11px] text-violet-300 mb-1"><CornerDownRight className="w-3 h-3"/> رد على {c.replyToName}</div>)}
                <p className="text-[13px] text-white/85 whitespace-pre-wrap break-words pr-6">{c.text}</p>
                {c.likesCount > 0 && (
                  <div className="absolute -bottom-3 right-2 bg-[#2A2E35] border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-lg">
                    <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center"><Heart className="w-2.5 h-2.5 fill-white text-white"/></div>
                    <span className="text-[11px] text-white/80 font-bold">{c.likesCount}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2 ml-2">
                <button onClick={()=>handleCommentLike(c)} className={`text-[12px] font-bold flex items-center gap-1 ${isLiked?'text-[#FF3B30]':'text-white/40 hover:text-white/70'}`}>إعجاب</button>
                <button onClick={()=>setReplyTo({id:c.id, name:c.authorName})} className="text-[12px] font-bold text-white/40 hover:text-white/70">رد</button>
                <span className="text-[11px] text-white/25">{timeAgo({created_at: c.createdAtMillis || c.created_at})}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PostCard({ post, currentUser, onHide, onStartEdit, isEditing, editingContent, setEditingContent, onSaveEdit, onCancelEdit, commentText, setCommentText, openComments, setOpenComments }: any){
  const [expanded, setExpanded] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  const createNotification = async (type:'like'|'comment', extraText:string = '') => {
    const postOwnerId = post.authorId || post.uid;
    if(!postOwnerId || postOwnerId === currentUser.uid) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        toUid: postOwnerId, to: postOwnerId, fromUid: currentUser.uid, fromName: currentUser.displayName || currentUser.username || 'مستخدم', fromPhoto: currentUser.photoURL || currentUser.avatar || `https://i.pravatar.cc/100?u=${currentUser.uid}`, fromAvatar: currentUser.photoURL || currentUser.avatar || `https://i.pravatar.cc/100?u=${currentUser.uid}`, type: type, postId: post.id, postContent: post.content?.slice(0,50) || '', text: type === 'like'? 'أعجب بمنشورك' : `علق على منشورك: ${extraText.slice(0,30)}`, read: false, created_at: serverTimestamp(), createdAt: serverTimestamp()
      });
    } catch(e) {}
  };

  const handleLike = async()=>{
    const ref = doc(db,'posts',post.id);
    const liked = post.likes?.includes(currentUser.uid);
    if(liked){ await updateDoc(ref, { likes: arrayRemove(currentUser.uid), likesCount: increment(-1) }); }
    else { await updateDoc(ref, { likes: arrayUnion(currentUser.uid), likesCount: increment(1) }); await createNotification('like'); }
  };

  const handleComment = async()=>{
    const txt = commentText[post.id];
    if(!txt?.trim()) return;
    await addDoc(collection(db,'posts',post.id,'comments'), {
      text: txt, created_at: serverTimestamp(), createdAtMillis: Date.now(),
      uid: currentUser.uid, authorId: currentUser.uid, authorName: currentUser.displayName,
      authorAvatar: currentUser.photoURL || currentUser.avatar, authorRole: currentUser.role || "", authorUsername: currentUser.username,
      likes: [], likesCount: 0, replyToId: replyTo?.id || null, replyToName: replyTo?.name || null
    });
    await updateDoc(doc(db,'posts',post.id), { commentsCount: increment(1) });
    await createNotification('comment', txt);
    setCommentText((prev:any)=>({...prev,[post.id]:""}));
    setReplyTo(null)
  };

  const content = post.content || "";
  const isLong = content.length > 200 || content.split('\n').length > 3;
  const isShortPost =!post.image &&!post.video && content.length < 80;

  return (
    <div id={`post-${post.id}`} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 overflow-hidden w-full max-w-full">
      <div className="flex justify-between"><div className="flex gap-3 items-center"><LiveAuthor uid={post.authorId||post.uid} fallbackName={post.authorName} fallbackRole={post.authorRole} fallbackAvatar={post.authorAvatar} size="post" feeling={post.feeling}/><span className="text-[11px] text-white/30">{timeAgo(post)}</span></div><PostMenu post={post} currentUser={currentUser} onHide={onHide} onEdit={onStartEdit}/></div>

      {isEditing? (
        <div className="mt-3"><textarea value={editingContent} onChange={e=>setEditingContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[15px] outline-none min-h-[120px] text-white"/><div className="flex gap-2 mt-2"><button onClick={onSaveEdit} className="bg-violet-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">حفظ</button><button onClick={onCancelEdit} className="bg-white/10 px-4 py-1.5 rounded-full text-sm">إلغاء</button></div></div>
      ) : (
        <div className="mt-3">
          <p className={`whitespace-pre-wrap break-words text-[#E4E6EB] ${isShortPost? "text-[18px] leading-[26px] font-medium" : "text-[15px] leading-[21px]"} ${!expanded && isLong? "line-clamp-3" : ""}`}>{content}</p>
          {isLong && (<button onClick={()=>setExpanded(!expanded)} className="mt-1.5 text-[13px] font-bold text-[#B0B3B8] hover:text-white">{expanded? "عرض أقل" : "عرض المزيد"}</button>)}
        </div>
      )}

      {post.image && (<div className="mt-3 w-full overflow-hidden rounded-xl max-h-[700px] bg-black border border-white/10"><img src={post.image} alt="post" className="w-full h-auto max-h-[700px] object-cover block" /></div>)}
      {post.video && (<div className="mt-3 w-full overflow-hidden rounded-xl bg-black border border-white/10"><video src={post.video} controls playsInline preload="metadata" className="w-full max-h-[700px] bg-black" /></div>)}

      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="flex justify-between items-center mt-3 text-[13px] text-white/50">
          <div className="flex items-center gap-1.5">
            {post.likesCount > 0 && (<div className="flex items-center gap-1"><div className="w-5 h-5 bg-gradient-to-br from-[#FF3B30] to-[#FF2D55] rounded-full flex items-center justify-center"><Heart className="w-3 h-3 fill-white text-white"/></div><span>{post.likesCount}</span></div>)}
          </div>
          <div>{post.commentsCount > 0 && `${post.commentsCount} تعليق`}</div>
        </div>
      )}

      <div className="flex justify-around mt-2 pt-2 border-t border-white/10">
        <button onClick={handleLike} className={`flex gap-1.5 text-[14px] items-center font-medium py-1.5 px-4 rounded-lg hover:bg-white/5 flex-1 justify-center ${post.likes?.includes(currentUser?.uid)?'text-[#FF3B30]':'text-white/60'}`}><ThumbsUp className={`w-[18px] h-[18px] ${post.likes?.includes(currentUser?.uid)?'fill-current':''}`}/> أعجبني</button>
        <button onClick={()=>setOpenComments((p:any)=>({...p,[post.id]:!p[post.id]}))} className="flex gap-1.5 text-[14px] text-white/60 items-center font-medium py-1.5 px-4 rounded-lg hover:bg-white/5 flex-1 justify-center"><MessageCircle className="w-[18px] h-[18px]"/> تعليق</button>
        <button className="flex gap-1.5 text-[14px] text-white/60 items-center font-medium py-1.5 px-4 rounded-lg hover:bg-white/5 flex-1 justify-center"><Share2 className="w-[18px] h-[18px]"/> مشاركة</button>
      </div>

      {openComments[post.id] && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="flex gap-2 items-start">
            <img src={currentUser?.photoURL || currentUser?.avatar || `https://i.pravatar.cc/100?img=12`} className="w-7 h-7 rounded-full mt-1" style={{objectFit:'cover'}}/>
            <div className="flex-1 relative">
              {replyTo && (<div className="mb-2 bg-violet-500/20 border border-violet-500/30 text-[12px] px-3 py-1.5 rounded-xl flex justify-between items-center"><span>رد على <b>{replyTo.name}</b></span><button onClick={()=>setReplyTo(null)} className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">✕</button></div>)}
              <div className="flex gap-2">
                <input value={commentText[post.id]||""} onChange={e=>setCommentText((prev:any)=>({...prev,[post.id]:e.target.value}))} onKeyDown={e=> e.key==='Enter' && handleComment()} placeholder={replyTo? `رد على ${replyTo.name}...` : "اكتب تعليق..."} className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-[13px] outline-none focus:bg-white/[0.12]"/>
                <button onClick={handleComment} className="bg-violet-500 hover:bg-violet-600 text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0"><Send className="w-4 h-4"/></button>
              </div>
            </div>
          </div>
          <CommentsList postId={post.id} currentUser={currentUser} setReplyTo={setReplyTo}/>
        </div>
      )}
    </div>
  )
}