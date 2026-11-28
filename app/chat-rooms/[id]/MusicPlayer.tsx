"use client"
import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import { collection, doc, setDoc, deleteDoc, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"

const SUGGESTED_SONGS = [
  { title: "زنق - حلاوة", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { title: "حماسي - سوداني", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { title: "حنين - سوداني", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
]

function getYoutubeId(url:string){
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/)
  return m ? m[1] : null
}

export default function MusicPlayer({ id, user, isRoomOwner }: { id: string, user: any, isRoomOwner: boolean }) {
  const [music, setMusic] = useState<any>(null)
  const [playlist, setPlaylist] = useState<any[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [musicUrl, setMusicUrl] = useState("")
  const [musicTitle, setMusicTitle] = useState("")
  const [isLoop, setIsLoop] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(()=>{
    if(!id) return
    return onSnapshot(doc(db, `chatRooms/${id}/music_current`),
      snap=> setMusic(snap.exists() ? snap.data() : null),
      ()=> setMusic(null)
    )
  },[id])

  useEffect(()=>{
    if(!id) return
    return onSnapshot(collection(db, `chatRooms/${id}/music_playlist`),
      snap=>{
        const list = snap.docs.map(d=>({id:d.id, ...d.data() as any})).sort((a:any,b:any)=> (a.order ?? 0) - (b.order ?? 0))
        setPlaylist(list)
      },
      ()=> setPlaylist([])
    )
  },[id])

  useEffect(()=>{
    if(!music) { audioRef.current?.pause(); return }
    if(music.isPlaying && music.type !== "youtube"){
      if(audioRef.current){
        if(audioRef.current.src !== music.url) audioRef.current.src = music.url
        audioRef.current.play().catch(()=>{})
      }
    } else audioRef.current?.pause()
  },[music])

  const addToPlaylist = async (url:string, title:string, autoPlay=false) => {
    if(!isRoomOwner || !url) return alert("حط رابط")
    if(!user?.uid) return alert("انتظر ثانية... لسه بتحمل")
    const ytId = getYoutubeId(url)
    const type = ytId ? "youtube" : "mp3"
    const finalUrl = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1` : url
    try{
      const ref = await addDoc(collection(db, `chatRooms/${id}/music_playlist`), { url: finalUrl, rawUrl: url, ytId, type, title: title || "أغنية", order: playlist.length + 1, addedBy: user.uid, addedAt: serverTimestamp() })
      setMusicUrl(""); setMusicTitle("")
      if(autoPlay || playlist.length === 0) await playFromPlaylist({id: ref.id, url: finalUrl, rawUrl: url, ytId, type, title: title || "أغنية"}, playlist.length)
    }catch(e:any){ alert("مشكلة في الصلاحيات: " + e.message) }
  }

  const playFromPlaylist = async (song:any, index:number) => {
    if(!isRoomOwner || !user?.uid) return
    try{
      await setDoc(doc(db, `chatRooms/${id}/music_current`), { url: song.url, rawUrl: song.rawUrl, ytId: song.ytId || null, type: song.type, title: song.title, isPlaying: true, currentId: song.id, currentIndex: index, playedBy: user.uid, playedByName: user.displayName, startedAt: serverTimestamp() })
    }catch(e){ console.log("play error", e) }
  }

  const playNext = async () => {
    if(!isRoomOwner || !playlist.length) return
    try{
      let next = isShuffle ? Math.floor(Math.random()*playlist.length) : (music?.currentIndex ?? -1) + 1
      if(next >= playlist.length){
        if(isLoop) next = 0
        else { await stopMusic(); return }
      }
      await playFromPlaylist(playlist[next], next)
    }catch(e){ console.log(e) }
  }

  const playPrev = async () => {
    if(!isRoomOwner) return
    try{
      const cur = music?.currentIndex ?? 0
      const prev = cur - 1 < 0 ? playlist.length - 1 : cur - 1
      if(playlist[prev]) await playFromPlaylist(playlist[prev], prev)
    }catch(e){ console.log(e) }
  }

  const togglePlay = async () => {
    if(!isRoomOwner || !music) return
    try{
      // ✅ setDoc بدل updateDoc عشان لو اتمسحت ما يوقع الصفحة
      await setDoc(doc(db, `chatRooms/${id}/music_current`), { ...music, isPlaying: !music.isPlaying }, { merge: true })
    }catch(e){ console.log(e) }
  }

  const stopMusic = async () => {
    if(!isRoomOwner) return
    try{ await deleteDoc(doc(db, `chatRooms/${id}/music_current`)) }catch(e){ console.log(e) }
  }

  const removeFromPlaylist = async (songId:string) => {
    if(!isRoomOwner) return
    try{
      if(music?.currentId === songId) await stopMusic()
      await deleteDoc(doc(db, `chatRooms/${id}/music_playlist/${songId}`))
    }catch(e){ console.log(e) }
  }

  const clearPlaylist = async () => {
    if(!isRoomOwner || !confirm("امسح كل القائمة؟")) return
    try{
      for(const s of playlist) await deleteDoc(doc(db, `chatRooms/${id}/music_playlist/${s.id}`))
      await stopMusic()
    }catch(e){ console.log(e) }
  }

  return (
    <>
      {!music && isRoomOwner && (
        <div className="relative z-10 mx-3 mb-2 shrink-0">
          <button onClick={()=>setShowPanel(true)} className="w-full bg-violet-500/15 border border-violet-500/30 rounded-[16px] p-2.5 flex items-center justify-center gap-2 text-[13px] font-black text-violet-300">
            🎵 شغّل موسيقى للغرفة {playlist.length > 0 && `(${playlist.length} أغنية جاهزة)`}
          </button>
        </div>
      )}
      {music && (
        <div className="relative z-10 mx-3 mb-2 shrink-0">
          <div className="bg-gradient-to-r from-violet-900/80 to-[#122025] border border-violet-500/30 rounded-[16px] overflow-hidden">
            <div className="flex items-center gap-3 p-2.5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[18px] shrink-0 ${music.isPlaying ? "animate-spin" : ""}`} style={{animationDuration:"3s"}}>🎵</div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black truncate">{music.isPlaying ? "🔊" : "⏸️"} {music.title}</p>
                <p className="text-[10px] text-white/50 truncate">{(music.currentIndex ?? 0)+1} / {playlist.length} • المالك {music.playedByName || ""} {isLoop ? "• 🔁" : ""} {isShuffle ? "• 🔀" : ""}</p>
              </div>
              {isRoomOwner ? (
                <div className="flex gap-1 shrink-0">
                  <button onClick={playPrev} className="w-8 h-8 bg-white/20 rounded-full text-[12px]">⏮️</button>
                  <button onClick={togglePlay} className="w-8 h-8 bg-white rounded-full text-black text-[14px]">{music.isPlaying ? "⏸️" : "▶️"}</button>
                  <button onClick={playNext} className="w-8 h-8 bg-white/20 rounded-full text-[12px]">⏭️</button>
                  <button onClick={()=>setShowPanel(true)} className="w-8 h-8 bg-violet-500/30 rounded-full text-[12px]">📋</button>
                </div>
              ) : (
                <button onClick={()=>setShowPanel(true)} className="text-[10px] bg-white/10 px-2 py-1 rounded-full shrink-0">📋 القائمة ({playlist.length})</button>
              )}
            </div>
            {music.type === "youtube" && music.isPlaying && <iframe src={music.url} className="w-full h-0 opacity-0 pointer-events-none" allow="autoplay" />}
            <div className="h-[3px] bg-white/10"><div className="h-full bg-violet-500 transition-all" style={{width: playlist.length ? `${(((music.currentIndex ?? 0)+1)/playlist.length)*100}%` : "0%"}} /></div>
          </div>
        </div>
      )}
      {showPanel && (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-end justify-center p-4" onClick={()=>setShowPanel(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-[#122025] rounded-[24px] p-5 w-full max-w-[420px] border border-white/10 max-h-[85vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-[16px]">🎵 قائمة التشغيل {playlist.length>0 && `(${playlist.length})`}</h3>
              <button onClick={()=>setShowPanel(false)} className="w-8 h-8 bg-white/10 rounded-full">✕</button>
            </div>
            {isRoomOwner && (
              <>
                <div className="flex gap-2 mb-4">
                  <button onClick={playPrev} className="flex-1 bg-white/10 py-3 rounded-full font-black">⏮️ السابق</button>
                  <button onClick={togglePlay} className="flex-1 bg-[#00E676] text-black py-3 rounded-full font-black">{music?.isPlaying ? "⏸️ وقف" : "▶️ شغل"}</button>
                  <button onClick={playNext} className="flex-1 bg-white/10 py-3 rounded-full font-black">التالي ⏭️</button>
                </div>
                <div className="flex gap-2 mb-4">
                  <button onClick={()=>setIsLoop(!isLoop)} className={`flex-1 py-2.5 rounded-full font-black text-[12px] ${isLoop ? "bg-violet-500" : "bg-white/10"}`}>🔁 تكرار {isLoop?"مفعل":"متوقف"}</button>
                  <button onClick={()=>setIsShuffle(!isShuffle)} className={`flex-1 py-2.5 rounded-full font-black text-[12px] ${isShuffle ? "bg-violet-500" : "bg-white/10"}`}>🔀 عشوائي {isShuffle?"مفعل":"متوقف"}</button>
                  <button onClick={clearPlaylist} className="flex-1 py-2.5 rounded-full font-black text-[12px] bg-red-500/20 text-red-400">🗑️ مسح الكل</button>
                </div>
                <div className="space-y-2 bg-white/5 rounded-2xl p-3 mb-4">
                  <p className="text-[12px] font-black">+ أضف أغنية للقائمة</p>
                  <input value={musicUrl} onChange={e=>setMusicUrl(e.target.value)} placeholder="رابط يوتيوب أو MP3" className="w-full bg-white/10 rounded-xl px-4 py-3 text-[13px] outline-none" />
                  <input value={musicTitle} onChange={e=>setMusicTitle(e.target.value)} placeholder="اسم الأغنية (اختياري)" className="w-full bg-white/10 rounded-xl px-4 py-3 text-[13px] outline-none" />
                  <div className="flex gap-2">
                    <button onClick={()=>addToPlaylist(musicUrl, musicTitle, false)} className="flex-1 bg-white/10 py-3 rounded-full font-black text-[13px]">+ أضف للقائمة</button>
                    <button onClick={()=>addToPlaylist(musicUrl, musicTitle, true)} className="flex-1 bg-[#00E676] text-black py-3 rounded-full font-black text-[13px]">▶️ أضف وشغّل</button>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-[12px] font-black mb-2">🎧 مقترحة - دوس عشان تضيف</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {SUGGESTED_SONGS.map((s,i)=> <button key={i} onClick={()=>addToPlaylist(s.url, s.title)} className="shrink-0 bg-white/10 px-3 py-2 rounded-full text-[11px] font-bold">+ {s.title}</button>)}
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <p className="text-[12px] font-black text-white/60">📋 القائمة الحالية</p>
              {playlist.length===0 && <p className="text-center text-white/40 py-6 text-[13px]">القائمة فاضية<br/>{isRoomOwner ? "أضف أغاني فوق" : "المالك لسه ما أضاف أغاني"}</p>}
              {playlist.map((s,i)=>(
                <div key={s.id} className={`flex items-center gap-3 rounded-xl p-3 ${music?.currentId===s.id ? "bg-violet-500/20 border border-violet-500/40" : "bg-white/5"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 ${music?.currentId===s.id ? "bg-violet-500" : "bg-white/10"}`}>{music?.currentId===s.id && music?.isPlaying ? "🎵" : i+1}</div>
                  <div className="flex-1 min-w-0"><p className="text-[13px] font-bold truncate">{s.title}</p><p className="text-[10px] text-white/40">{s.type==="youtube"?"YouTube":"MP3"} {music?.currentId===s.id ? "• شغالة هسي" : ""}</p></div>
                  {isRoomOwner && <div className="flex gap-1 shrink-0">
                    <button onClick={()=>playFromPlaylist(s,i)} className="w-8 h-8 bg-[#00E676] text-black rounded-full text-[12px]">▶️</button>
                    <button onClick={()=>removeFromPlaylist(s.id)} className="w-8 h-8 bg-red-500/20 rounded-full text-[12px]">🗑️</button>
                  </div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <audio ref={audioRef} onEnded={()=>{ if(isRoomOwner) playNext() }} className="hidden" />
    </>
  )
}