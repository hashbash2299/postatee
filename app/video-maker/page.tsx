"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Download, Play } from "lucide-react"

export default function VideoMaker(){
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  const generateVideo = async () => {
    setIsGenerating(true)
    setProgress(0)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = 1080
    canvas.height = 1920

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    const chunks: Blob[] = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setIsGenerating(false)
    }

    recorder.start()

    // 15 ثانية = 450 فريم (30fps)
    let frame = 0
    const totalFrames = 450

    const draw = () => {
      if(frame >= totalFrames){
        recorder.stop()
        return
      }

      setProgress(Math.floor((frame/totalFrames)*100))

      // خلفية متحركة ذهبية
      const t = frame / totalFrames
      const grad = ctx.createLinearGradient(0,0,0,1920)
      grad.addColorStop(0, `hsl(${40 + Math.sin(t*10)*5}, 80%, 12%)`)
      grad.addColorStop(1, `hsl(${30}, 60%, 5%)`)
      ctx.fillStyle = grad
      ctx.fillRect(0,0,1080,1920)

      // زخارف
      ctx.fillStyle = `rgba(255,215,0,${0.1 + Math.sin(frame*0.05)*0.05})`
      for(let i=0;i<20;i++){
        ctx.beginPath()
        ctx.arc(540 + Math.cos(i+frame*0.01)*400, 300 + i*80, 2, 0, Math.PI*2)
        ctx.fill()
      }

      // النصوص - حركة دخول
      ctx.textAlign = "center"
      ctx.fillStyle = "#FFD700"

      // عنوان
      ctx.font = "900 80px Cairo"
      ctx.fillText("دعوة فرح", 540, 400 + Math.sin(frame*0.05)*5)

      // الاسماء
      ctx.fillStyle = "white"
      ctx.font = "900 90px Cairo"
      const names = `${form.groom} & ${form.bride}`
      ctx.fillText(names, 540, 700)

      // خط ذهبي
      ctx.fillStyle = "#FFD700"
      ctx.fillRect(390, 760, 300, 4)

      // التفاصيل
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

      frame++
      requestAnimationFrame(draw)
    }
    draw()
  }

  const download = () => {
    if(!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `دعوة-${form.groom}-${form.bride}-15s.webm`
    a.click()
  }

  return (
    <div className="min-h-screen bg-[#0B1418] text-white p-4" dir="rtl">
      <div className="max-w-[500px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={()=>router.push('/')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ArrowRight className="w-5 h-5"/></button>
          <h1 className="font-black text-[22px] fb-font">مصنع الفيديو المجاني 🎬</h1>
        </div>

        <div className="bg-[#122025] rounded-2xl p-4 border border-[#1A2E35] mb-4">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.groom} onChange={e=>setForm({...form, groom:e.target.value})} placeholder="اسم العريس" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.bride} onChange={e=>setForm({...form, bride:e.target.value})} placeholder="اسم العروس" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.day} onChange={e=>setForm({...form, day:e.target.value})} placeholder="اليوم والتاريخ" className="col-span-2 bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.time} onChange={e=>setForm({...form, time:e.target.value})} placeholder="الوقت (غداء/مساء)" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
            <input value={form.place} onChange={e=>setForm({...form, place:e.target.value})} placeholder="المكان" className="bg-[#0B1418] border border-[#1A2E35] rounded-xl p-3 fb-font" />
          </div>

          <button onClick={generateVideo} disabled={isGenerating} className="w-full mt-4 bg-gradient-to-r from-amber-400 to-yellow-600 text-black font-black py-4 rounded-xl fb-font flex items-center justify-center gap-2 disabled:opacity-50">
            {isGenerating? `جاري التوليد ${progress}%` : <><Play className="w-5 h-5"/> اصنع فيديو 15 ثانية مجاناً</>}
          </button>
        </div>

        <canvas ref={canvasRef} className="w-full rounded-2xl border border-[#1A2E35] bg-black" style={{aspectRatio:'9/16'}} />

        {videoUrl && (
          <div className="mt-4 bg-[#122025] rounded-2xl p-4 border border-amber-400/20">
            <video src={videoUrl} controls autoPlay loop className="w-full rounded-xl mb-3" />
            <button onClick={download} className="w-full bg-amber-400 text-black font-black py-3 rounded-xl fb-font flex items-center justify-center gap-2">
              <Download className="w-5 h-5"/> تحميل الفيديو على الجوال 📥
            </button>
            <p className="text-[11px] text-white/40 text-center mt-2 fb-font">الفيديو اتولد في جوالك وما اتخزن عندنا - مجاني 100%</p>
          </div>
        )}
      </div>
    </div>
  )
}