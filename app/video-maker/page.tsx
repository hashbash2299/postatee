"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Download, Play, Music, Upload } from "lucide-react"

export default function VideoMaker(){
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioFile, setAudioFile] = useState<File|null>(null)
  const [audioUrl, setAudioUrl] = useState<string|null>(null)
  const [form, setForm] = useState({
    groom: "معاوية",
    bride: "نوافل",
    day: "الجمعة 30 اكتوبر",
    time: "دعوة غداء",
    place: "صالة الدانة"
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string|null>(null)
  const [progress, setProgress] = useState(0)

  const handleAudioUpload = (e:any) => {
    const file = e.target.files[0]
    if(file){
      setAudioFile(file)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
    }
  }

  const generateVideo = async () => {
    setIsGenerating(true)
    setProgress(0)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = 1080
    canvas.height = 1920

    const canvasStream = canvas.captureStream(30)
    let finalStream: MediaStream = canvasStream

    // ✅ لو في اغنية مرفوعة، ندمج الصوت مع الفيديو
    let audioElement: HTMLAudioElement | null = null
    if(audioUrl && audioRef.current){
      audioElement = audioRef.current
      audioElement.currentTime = 0
      await audioElement.play()

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaElementSource(audioElement)
      const dest = audioCtx.crKaNCgLvMEXxNzMxj2F7FYi1AdRrTo6Nhu()
      source.connect(dest)
      source.connect(audioCtx.destination) // نسمعها اثناء التوليد

      const audioTrack = dest.stream.getAudioTracks()[0]
      finalStream = new MediaStream([...canvasStream.getVideoTracks(), audioTrack])
    }

    const recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm;codecs=vp9,opus' })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setIsGenerating(false)
      if(audioElement) audioElement.pause()
    }

    recorder.start()
    let frame = 0
    const totalFrames = 450 // 15 ثانية

    const draw = () => {
      if(frame >= totalFrames){
        recorder.stop()
        return
      }
      setProgress(Math.floor((frame/totalFrames)*100))
      const t = frame / totalFrames
      const grad = ctx.createLinearGradient(0,0,0,1920)
      grad.addColorStop(0, `hsl(${40 + Math.sin(t*10)*5}, 80%, 12%)`)
      grad.addColorStop(1, `hsl(${30}, 60%, 5%)`)
      ctx.fillStyle = grad
      ctx.fillRect(0,0,1080,1920)

      ctx.fillStyle = `rgba(255,215,0,${0.1 + Math.sin(frame*0.05)*0.05})`
      for(let i=0;i<20;i++){
        ctx.beginPath()
        ctx.arc(540 + Math.cos(i+frame*0.01)*400, 300 + i*80, 2, 0, Math.PI*2)
        ctx.fill()
      }

      ctx.textAlign = "center"
      ctx.fillStyle = "#FFD700"
      ctx.font = "900 80px Cairo"
      ctx.fillText("دعوة فرح", 540, 400)

      ctx.fillStyle = "white"
      ctx.font = "900 90px Cairo"
      ctx.fillText(`${form.groom} & ${form.bride}`, 540, 700)

      ctx.fillStyle = "#FFD700"
      ctx.fillRect(390, 760, 300, 4)

      ctx.fillStyle = "rgba(255,255,255,0.9)"
      ctx.font = "700 50px Cairo"
      ctx.fillText(form.day, 540, 900)
      ctx.fillText(form.time, 540, 1000)
      ctx.fillStyle = "#FFD700"
      ctx.font = "700 55px Cairo"
      ctx.fillText(form.place, 540, 1150)

      ctx.fillStyle = "rgba(255,215,0,0.6)"
      ctx.font = "400 30px Cairo"
      ctx.fillText("بكل الحب ندعوكم لمشاركتنا فرحتنا", 540, 1400)

      // ايقونة موسيقى لو في اغنية
      if(audioFile){
        ctx.font = "400 26px Cairo"
        ctx.fillText(`🎵 ${audioFile.name.slice(0,20)}`, 540, 1550)
      }

      frame++
      requestAnimationFrame(draw)
    }
    draw()
  }

  const download = () => {
    if(!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `دعوة-${form.groom}-${form.bride}-بالاغنية.webm`
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0B1418] text-white p-4" dir="rtl">
      <div className="max-w-[500px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={()=>router.push('/')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ArrowRight className="w-5 h-5"/></button>
          <h1 className="font-black text-[22px] fb-font">مصنع الفيديو مع الأغنية 🎶</h1>
        </div>

        <div className="bg-[#122025] rounded-2xl p-4 border border-[#1A2E35] mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.groom} onChange={e=>setForm({...form, groom:e.target.value})} placeholder="العريس" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.bride} onChange={e=>setForm({...form, bride:e.target.value})} placeholder="العروس" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.day} onChange={e=>setForm({...form, day:e.target.value})} placeholder="اليوم" className="col-span-2 bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.time} onChange={e=>setForm({...form, time:e.target.value})} placeholder="الوقت" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.place} onChange={e=>setForm({...form, place:e.target.value})} placeholder="المكان" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
          </div>

          {/* ✅ رفع الأغنية */}
          <div className="mt-4 bg-[#0B1418] border border-dashed border-amber-400/30 rounded-xl p-4">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center"><Music className="w-6 h-6 text-amber-400"/></div>
              <span className="font-bold text-[13px] fb-font">{audioFile? `تم اختيار: ${audioFile.name}` : "ارفع الأغنية من جوالك (mp3)"}</span>
              <span className="text-[11px] text-white/40 fb-font">الاغنية حتتركب تلقائيا 15 ثانية</span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
              <div className="mt-1 bg-white/10 px-4 py-2 rounded-full text-[12px] flex items-center gap-2"><Upload className="w-4 h-4"/> اختر الأغنية</div>
            </label>
            {audioUrl && <audio ref={audioRef} src={audioUrl} className="w-full mt-3" controls />}
          </div>

          <button onClick={generateVideo} disabled={isGenerating} className="w-full mt-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-black py-4 rounded-xl fb-font flex items-center justify-center gap-2 disabled:opacity-50">
            {isGenerating? `جاري التوليد ${progress}% 🎵` : <><Play className="w-5 h-5"/> اصنع الفيديو بالأغنية</>}
          </button>
        </div>

        <canvas ref={canvasRef} className="w-full rounded-2xl border border-[#1A2E35] bg-black hidden" style={{aspectRatio:'9/16'}} />

        {videoUrl && (
          <div className="mt-4 bg-[#122025] rounded-2xl p-4 border border-amber-400/30">
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-xl mb-3" />
            <button onClick={download} className="w-full bg-amber-400 text-black font-black py-3 rounded-xl fb-font flex items-center justify-center gap-2">
              <Download className="w-5 h-5"/> تحميل الفيديو بالأغنية 📥
            </button>
          </div>
        )}
      </div>
    </div>
  )
}