"use client"
import { useState, useRef } from "react";
import { Music, Play, Download, Video, Heart, GraduationCap, Cake, Sparkles, X } from "lucide-react";
import Link from "next/link";

type Template = { id: string; name: string; icon: any; color: string; bg: string; textColor: string };
const TEMPLATES: Template[] = [
  { id: 'wedding', name: 'دعوة فرح', icon: Heart, color: 'from-pink-500 to-rose-600', bg: '#FFF0F3', textColor: '#880E4F' },
  { id: 'graduation', name: 'تهنئة تخرج', icon: GraduationCap, color: 'from-amber-500 to-yellow-600', bg: '#FFF8E1', textColor: '#3E2723' },
  { id: 'birthday', name: 'عيد ميلاد', icon: Cake, color: 'from-violet-500 to-purple-600', bg: '#F3E5F5', textColor: '#4A148C' },
  { id: 'general', name: 'تهنئة عامة', icon: Sparkles, color: 'from-cyan-500 to-blue-600', bg: '#E0F7FA', textColor: '#006064' },
];

export default function VideoMakerPage(){
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[1]);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("تهنئة تخرج");
  const [subtitle, setSubtitle] = useState("مريم");
  const [dateText, setDateText] = useState("الجمعة 10 يناير - صالة لافندر");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const files = e.target.files;
    if(!files) return;
    Array.from(files).slice(0,5).forEach(file=>{
      const r = new FileReader();
      r.onload = ev=> setImages(p=> [...p, ev.target?.result as string].slice(0,5));
      r.readAsDataURL(file);
    });
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(file) setMusicFile(file);
  };

  const generate = async ()=>{
    if(images.length===0){ alert("ارفع صورة"); return; }
    setIsGenerating(true); setVideoUrl(null); setProgress(0);
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    canvas.width = 1080; canvas.height = 1920;
    const loaded = await Promise.all(images.map(s=> new Promise<HTMLImageElement>(r=>{ const im=new Image(); im.src=s; im.onload=()=>r(im);})));
    let audioStream: MediaStream | null = null;
    if(musicFile && audioRef.current){
      const url = URL.createObjectURL(musicFile);
      audioRef.current.src = url;
      audioRef.current.loop = true;
      try{ await audioRef.current.play(); }catch{}
      const aStream = (audioRef.current as any).captureStream?.();
      if(aStream) audioStream = aStream;
    }
    const canvasStream = canvas.captureStream(30);
    const tracks = [...canvasStream.getVideoTracks()];
    if(audioStream) tracks.push(...audioStream.getAudioTracks());
    const finalStream = new MediaStream(tracks);
    const recorder = new MediaRecorder(finalStream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = ev=> { if(ev.data.size>0) chunks.push(ev.data); };
    recorder.onstop = ()=>{
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
      setIsGenerating(false);
      if(audioRef.current) audioRef.current.pause();
    };
    recorder.start(100);
    const DURATION = 15000; const start = Date.now();
    const draw = ()=>{
      const elapsed = Date.now()-start;
      const prog = Math.min(elapsed/DURATION,1);
      setProgress(Math.floor(prog*100));
      if(prog>=1){ recorder.stop(); return; }
      ctx.fillStyle = selectedTemplate.bg;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      const idx = Math.floor(prog*loaded.length)%loaded.length;
      const img = loaded[idx];
      const scale = 1 + prog*0.2;
      const iw = canvas.width*scale;
      const ih = (img.height/img.width)*iw;
      const y = 120;
      ctx.save();
      ctx.beginPath();
      (ctx as any).roundRect(40,y,canvas.width-80,900,32);
      ctx.clip();
      ctx.drawImage(img, (canvas.width-iw)/2, y-(ih-900)/2, iw, ih);
      ctx.restore();
      ctx.textAlign='center';
      ctx.fillStyle=selectedTemplate.textColor;
      ctx.font='bold 78px serif';
      ctx.fillText(title, 540, 1250, 980);
      ctx.font='800 62px sans-serif';
      ctx.fillText(subtitle, 540, 1360, 980);
      ctx.font='500 38px sans-serif';
      ctx.fillStyle=selectedTemplate.textColor+'CC';
      ctx.fillText(dateText, 540, 1450, 980);
      requestAnimationFrame(draw);
    };
    draw();
    setTimeout(()=>{ if(recorder.state==='recording') recorder.stop(); }, DURATION+500);
  };

  return (
    <div className="min-h-screen bg-[#0B1418] text-white" dir="rtl">
      <div className="max-w-[900px] mx-auto p-4">
        <div className="flex justify-between mb-4"><Link href="/" className="text-white/60">← رجوع</Link><h1 className="font-black flex gap-2"><Video className="text-amber-400"/> مصنع الفيديو</h1><div className="w-10"/></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">{TEMPLATES.map(t=>{ const I=t.icon; return <button key={t.id} onClick={()=>setSelectedTemplate(t)} className={`p-3 rounded-2xl border-2 ${selectedTemplate.id===t.id?'border-amber-400 bg-amber-400/10':'border-white/10 bg-white/[0.03]'}`}><div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mx-auto mb-1`}><I className="text-white w-5 h-5"/></div><p className="text-xs font-bold">{t.name}</p></button>})}</div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3"><input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full text-sm"/><div className="flex gap-2 mt-2 flex-wrap">{images.map((im,i)=><div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden"><img src={im} className="w-full h-full object-cover"/><button onClick={()=>setImages(p=>p.filter((_,k)=>k!==i))} className="absolute top-0 right-0 bg-red-500 rounded-full w-4 h-4 flex items-center justify-center"><X className="w-3 h-3"/></button></div>)}</div></div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 space-y-2"><input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5"/><input value={subtitle} onChange={e=>setSubtitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5"/><input value={dateText} onChange={e=>setDateText(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5"/></div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3"><p className="text-sm font-bold mb-2 flex gap-2"><Music className="w-4 h-4"/> موسيقى MP3 من جهازك</p><input type="file" accept="audio/*" onChange={handleMusicUpload} className="w-full text-sm"/><audio ref={audioRef} hidden/>{musicFile && <p className="text-xs text-green-400 mt-1">{musicFile.name}</p>}</div>
            <button onClick={generate} disabled={isGenerating} className="w-full bg-amber-400 text-black font-black py-3.5 rounded-2xl">{isGenerating? `بصنع الفيديو ${progress}%` : '▶ اصنع الفيديو 15 ثانية'}</button>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-3 flex flex-col items-center"><canvas ref={canvasRef} width={1080} height={1920} className="w-[260px] h-[462px] bg-black rounded-2xl border border-white/10"/><div className="mt-3 w-full">{videoUrl && <><video src={videoUrl} controls className="w-full rounded-xl bg-black"/><a href={videoUrl} download={`postatee-${Date.now()}.webm`} className="mt-2 w-full bg-green-500 text-white font-bold py-3 rounded-xl flex justify-center gap-2"><Download/> تحميل الفيديو</a></>}</div></div>
        </div>
      </div>
    </div>
  )
}