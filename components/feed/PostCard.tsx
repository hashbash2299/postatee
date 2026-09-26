"use client"
import { useState, useEffect } from "react";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, increment, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Heart, MessageCircle, Share2, Send } from "lucide-react";
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

function LiveAuthor({ uid, fallbackName, fallbackRole, fallbackAvatar, size="post" }: any){
  const liveUser = useLiveUser(uid);
  const router = useRouter();
  const displayName = liveUser?.displayName || fallbackName;
  const role = liveUser?.role || fallbackRole || "";
  const avatar = liveUser?.avatar || fallbackAvatar;
  const isPost = size==="post";
  return (
    <>
      <img
        src={avatar || `https://i.pravatar.cc/100?u=${uid}`}
        onClick={()=>router.push(`/profile/${uid}`)}
        className={`${isPost?'w-10 h-10':'w-7 h-7'} rounded-full border border-cyan-400/20 cursor-pointer`}
        style={{objectFit:'cover', width: isPost? '40px':'28px', height: isPost? '40px':'28px', flexShrink:0}}
      />
      <div className={isPost? "": "flex-1"}>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold ${isPost?'text-sm':'text-[13px]'} cursor-pointer fb-font ${getNameColor(role)}`} onClick={()=>router.push(`/profile/${uid}`)}>{displayName}</span>
          <RoleBadge role={role}/>
        </div>
      </div>
    </>
  );
}

function CommentsList({ postId }: any){
  const [comments, setComments] = useState<any[]>([]);
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,'posts',postId,'comments'), s=> {
      const data = s.docs.map(d=>({id:d.id,...d.data()}));
      data.sort((a:any,b:any)=>{
        const at = a.createdAtMillis || a.created_at?.seconds*1000 || 0;
        const bt = b.createdAtMillis || b.created_at?.seconds*1000 || 0;
        return at - bt;
      });
      setComments(data);
    });
    return ()=>unsub();
  },[postId]);
  return (
    <div className="space-y-2 mt-3">
      {comments.map((c:any)=>{
        const uid = c.uid || c.authorId;
        return (
          <div key={c.id} className="flex gap-2 bg-white/[0.03] border border-white/5 p-2.5 rounded-xl">
            <LiveAuthor uid={uid} fallbackName={c.authorName} fallbackRole={c.authorRole} fallbackAvatar={c.authorAvatar} size="comment" />
            <div className="flex-1"><p className="text-[13px] text-white/80 whitespace-pre-wrap break-words fb-font">{c.text}</p></div>
          </div>
        )
      })}
    </div>
  )
}

export default function PostCard({ post, currentUser, onHide, onStartEdit, isEditing, editingContent, setEditingContent, onSaveEdit, onCancelEdit, commentText, setCommentText, openComments, setOpenComments }: any){
  const [expanded, setExpanded] = useState(false);

  const createNotification = async (type:'like'|'comment', extraText:string = '') => {
    const postOwnerId = post.authorId || post.uid;
    if(!postOwnerId || postOwnerId === currentUser.uid) return;
    try {
      await addDoc(collection(db, 'notifications'), {
        toUid: postOwnerId, to: postOwnerId, fromUid: currentUser.uid,
        fromName: currentUser.displayName || currentUser.username || 'مستخدم',
        fromPhoto: currentUser.photoURL || currentUser.avatar || `https://i.pravatar.cc/100?u=${currentUser.uid}`,
        fromAvatar: currentUser.photoURL || currentUser.avatar || `https://i.pravatar.cc/100?u=${currentUser.uid}`,
        type: type, postId: post.id, postContent: post.content?.slice(0,50) || '',
        text: type === 'like'? 'أعجب بمنشورك' : `علق على منشورك: ${extraText.slice(0,30)}`,
        read: false, created_at: serverTimestamp(), createdAt: serverTimestamp()
      });
    } catch(e) { console.log(e); }
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
      text: txt, created_at: serverTimestamp(), createdAtMillis: Date.now(), uid: currentUser.uid, authorId: currentUser.uid,
      authorName: currentUser.displayName, authorAvatar: currentUser.photoURL || currentUser.avatar,
      authorRole: currentUser.role || "", authorUsername: currentUser.username
    });
    await updateDoc(doc(db,'posts',post.id), { commentsCount: increment(1) });
    await createNotification('comment', txt);
    setCommentText((prev:any)=>({...prev,[post.id]:""}));
  };

  const content = post.content || "";
  const isLong = content.length > 250;
  const isShortPost =!post.image &&!post.video && content.length < 100;
  const contentClass = isShortPost? "text-[16px] leading-[22px] font-medium" : "text-[15px] leading-[21px] font-normal";
  const displayText =!isLong || expanded? content : content.slice(0, 250);

  return (
    <div id={`post-${post.id}`} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 overflow-hidden w-full max-w-full">
      <div className="flex justify-between">
        <div className="flex gap-3 items-center">
          <LiveAuthor uid={post.authorId||post.uid} fallbackName={post.authorName} fallbackRole={post.authorRole} fallbackAvatar={post.authorAvatar} size="post"/>
          <span className="text-[11px] text-white/30 fb-font">{timeAgo(post)}</span>
        </div>
        <PostMenu post={post} currentUser={currentUser} onHide={onHide} onEdit={onStartEdit}/>
      </div>

      {isEditing? (
        <div className="mt-3"><textarea value={editingContent} onChange={e=>setEditingContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[15px] outline-none min-h-[120px] max-h-[500px] resize-y fb-font"/><div className="flex gap-2 mt-2"><button onClick={onSaveEdit} className="bg-violet-500 text-white px-4 py-1.5 rounded-full text-sm font-bold fb-font">حفظ</button><button onClick={onCancelEdit} className="bg-white/10 px-4 py-1.5 rounded-full text-sm fb-font">إلغاء</button></div></div>
      ) : (
        <div className="mt-3">
          <p className={`whitespace-pre-wrap break-words text-[#E4E6EB] fb-font ${contentClass}`}>
            {displayText}{isLong &&!expanded && "..."}
          </p>
          {isLong && (
            <button onClick={()=>setExpanded(!expanded)} className="mt-1 text-[14px] font-bold text-[#8A8D91] hover:text-white fb-font">
              {expanded? "عرض أقل" : "عرض المزيد"}
            </button>
          )}
        </div>
      )}

      {post.image && (
        <div style={{marginTop:'12px', width:'100%', maxWidth:'100%', overflow:'hidden', borderRadius:'12px', maxHeight:'500px', background:'#000'}}>
          <img
            src={post.image}
            alt="post"
            style={{width:'100%', height:'auto', maxHeight:'500px', objectFit:'cover', display:'block', borderRadius:'12px'}}
          />
        </div>
      )}
      {post.video && <video src={post.video} controls style={{marginTop:'12px', borderRadius:'12px', width:'100%', maxHeight:'500px', background:'#000'}}/>}

      <div className="flex justify-between mt-3 pt-3 border-t border-white/5">
        <button onClick={handleLike} className={`flex gap-1.5 text-[13px] items-center fb-font ${post.likes?.includes(currentUser?.uid)?'text-red-500':'text-white/50'}`}><Heart className={`w-[18px] h-[18px] ${post.likes?.includes(currentUser?.uid)?'fill-red-500':''}`}/> {post.likesCount||0}</button>
        <button onClick={()=>setOpenComments((p:any)=>({...p,[post.id]:!p[post.id]}))} className="flex gap-1.5 text-[13px] text-white/50 items-center fb-font"><MessageCircle className="w-[18px] h-[18px]"/> {post.commentsCount||0}</button>
        <button className="flex gap-1.5 text-[13px] text-white/50 items-center fb-font"><Share2 className="w-[18px] h-[18px]"/> مشاركة</button>
      </div>

      {openComments[post.id] && (
        <div className="mt-3 border-t border-white/5 pt-3">
          <div className="flex gap-2">
            <img src={currentUser?.photoURL || currentUser?.avatar || `https://i.pravatar.cc/100?img=12`} className="w-7 h-7 rounded-full" style={{objectFit:'cover'}}/>
            <div className="flex-1 flex gap-2">
              <input value={commentText[post.id]||""} onChange={e=>setCommentText((prev:any)=>({...prev,[post.id]:e.target.value}))} placeholder="اكتب تعليق..." className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[13px] outline-none fb-font"/>
              <button onClick={handleComment} className="bg-violet-500 text-white rounded-full w-8 h-8 flex items-center justify-center"><Send className="w-4 h-4"/></button>
            </div>
          </div>
          <CommentsList postId={post.id}/>
        </div>
      )}
    </div>
  )
}