"use client"
import { useState, useRef } from "react";
import { Music, Play, Download, Video, Heart, GraduationCap, Cake, Sparkles, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type Template = { id: string; name: string; icon: any; color: string; bg: string; textColor: string };
const TEMPLATES: Template[] = [
  { id: 'wedding', name: 'دعوة فرح', icon: Heart, color: 'from-pink-500 to-rose-600', bg: '#FFF0F3', textColor: '#880E4F' },
  { id: 'graduation', name: 'تهنئة تخرج', icon: GraduationCap, color: 'from-amber-500 to-yellow-600', bg: '#FFF8E1', textColor: '#3E2723' },
  { id: 'birthday', name: 'عيد ميلاد', icon: Cake, color: 'from-violet-500 to-purple-600', bg: '#F3E5F5', textColor: '#4A148C' },
  { id: 'general', name: 'تهنئة عامة', icon: Sparkles, color: 'from-cyan-500 to-blue-600', bg: '#E0F7FA', textColor: '#006064' },
];

export default function VideoMakerPage(){
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(TEMPLATES[0]);
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("دعوة فرح");
  const [subtitle, setSubtitle] = useState("محمد & سارة");
  const [dateText, setDateText] = useState("الجمعة 10 يناير - صالة لافندر");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const loadFFmpeg = async ()=>{
    if(ffmpegLoaded) return;
    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    setFfmpegLoaded(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const fileList = e.target.files;
    if(!fileList) return;
    const files = Array.from(fileList) as File[];
    files.slice(0,5).forEach(file=>{
      const reader = new FileReader();
      reader.onload = ev=> setImages(prev=> [...prev, ev.target?.result as string].slice(0,5));
      reader.readAsDataURL(file);
    });
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0];
    if(f) setMusicFile(f);
  };

  const generateMP4 = async ()=>{
    if(images.length===0){ alert("ارفع صورة واحدة على الأقل"); return; }
    setIsGenerating(true); setProgress(0); setVideoUrl(null);
    await loadFFmpeg();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1080; canvas.height = 1920;
    const loadedImages = await Promise.all(images.map(src=> new Promise<HTMLImageElement>(res=>{
      const img = new Image(); img.src = src; img.onload = ()=>res(img);
    })));
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    recorder.ondataavailable = ev=> chunks.push(ev.data);
    const videoBlobPromise = new Promise<Blob>(resolve=>{
      recorder.onstop = ()=> resolve(new Blob(chunks, { type: 'video/webm' }));
    });
    recorder.start();
    const duration = 15000;
    const startTime = Date.now();
    await new Promise<void>(resolve=>{
      const draw = ()=>{
        const elapsed = Date.now() - startTime;
        const prog = Math.min(elapsed / duration, 1);
        setProgress(Math.floor(prog*40));
        if(prog >= 1){ recorder.stop(); resolve(); return; }
        ctx.fillStyle = selectedTemplate.bg;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        const imgIndex = Math.floor(prog * loadedImages.length) % loadedImages.length;
        const img = loadedImages[imgIndex];
        const scale = 1 + prog*0.15;
        const iw = canvas.width * scale;
        const ih = (img.height / img.width) * iw;
        const y = canvas.height * 0.12;
        ctx.save();
        ctx.beginPath();
        (ctx as any).roundRect(40, y, canvas.width-80, 900, 30);
        ctx.clip();
        ctx.drawImage(img, (canvas.width-iw)/2, y - (ih-900)/2, iw, ih);
        ctx.restore();
        ctx.fillStyle = selectedTemplate.textColor;
        ctx.textAlign = 'center';
        ctx.font = `bold 70px serif`;
        ctx.fillText(title, canvas.width/2, 1250, canvas.width-100);
        ctx.font = `600 55px sans-serif`;
        ctx.fillText(subtitle, canvas.width/2, 1350, canvas.width-100);
        ctx.font = `400 38px sans-serif`;
        ctx.fillStyle = selectedTemplate.textColor + 'CC';
        ctx.fillText(dateText, canvas.width/2, 1450, canvas.width-100);
        ctx.font = `900 28px sans-serif`;
        ctx.fillStyle = '#00000066';
        ctx.fillText('Postatee.com', canvas.width/2, 1850);
        if(prog < 1) requestAnimationFrame(draw);
      };
      draw();
    });
    const webmBlob = await videoBlobPromise;
    setIsConverting(true); setProgress(50);
    const ffmpeg = ffmpegRef.current!;
    await ffmpeg.writeFile('video.webm', await fetchFile(webmBlob));
    if(musicFile){
      await ffmpeg.writeFile('music.mp3', await fetchFile(musicFile));
      setProgress(70);
      await ffmpeg.exec(['-i', 'video.webm', '-i', 'music.mp3', '-c:v', 'libx264', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0', '-shortest', '-y', 'output.mp4']);
    } else {
      await ffmpeg.exec(['-i', 'video.webm', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-y', 'output.mp4']);
    }
    setProgress(90);
    const data = await ffmpeg.readFile('output.mp4') as any;
    const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
    setVideoUrl(URL.createObjectURL(mp4Blob));
    setProgress(100); setIsGenerating(false); setIsConverting(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1418] text-white" dir="rtl">
      <div className="max-w-[900px] mx-auto p-4">
        <div className="flex items-center justify-between mb-6"><Link href="/" className="text-white/60">← رجوع</Link><h1 className="font-black text-xl flex items-center gap-2"><Video className="text-amber-400"/> مصنع MP4</h1><div className="w-10"/></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{TEMPLATES.map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setSelectedTemplate(t)} className={`p-4 rounded-2xl border-2 ${selectedTemplate.id===t.id?'border-amber-400 bg-amber-400/10':'border-white/10 bg-white/[0.04]'}`}><div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mx-auto mb-2`}><Icon className="text-white"/></div><p className="font-bold text-sm">{t.name}</p></button>})}</div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4"><h3 className="font-bold mb-3">الصور (5)</h3><input type="file" multiple accept="image/*" onChange={handleImageUpload} className="w-full bg-black/30 p-2 rounded-xl mb-3"/><div className="flex gap-2 flex-wrap">{images.map((img,i)=><div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden"><img src={img} className="w-full h-full object-cover"/><button onClick={()=>setImages(prev=>prev.filter((_,idx)=>idx!==i))} className="absolute top-1 right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3"/></button></div>)}</div></div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 space-y-3"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="العنوان" className="w-full bg-black/30 border border-white/10 rounded-xl p-3"/><input value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="الاسماء" className="w-full bg-black/30 border border-white/10 rounded-xl p-3"/><input value={dateText} onChange={e=>setDateText(e.target.value)} placeholder="التاريخ" className="w-full bg-black/30 border border-white/10 rounded-xl p-3"/></div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4"><h3 className="font-bold mb-3 flex items-center gap-2"><Music className="w-4 h-4"/> موسيقى MP3 من جهازك</h3><input type="file" accept="audio/mp3,audio/*" onChange={handleMusicUpload} className="w-full bg-black/30 p-2 rounded-xl"/>{musicFile && <p className="text-xs text-green-400 mt-2">{musicFile.name}</p>}</div>
            <button onClick={generateMP4} disabled={isGenerating} className="w-full bg-amber-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">{isGenerating? <><Loader2 className="animate-spin"/>{isConverting? `بحول لـ MP4 ${progress}%` : `بصنع الفيديو ${progress}%`}</> : <><Play/> اصنع فيديو MP4</>}</button>
            <p className="text-[11px] text-white/40 text-center">MP4 بشتغل في كل التلفونات والواتساب</p>
          </div>
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 flex flex-col items-center"><h3 className="font-bold mb-3">المعاينة</h3><canvas ref={canvasRef} className="w-[270px] h-[480px] bg-black rounded-2xl border border-white/10"/><div className="mt-4 w-full">{videoUrl && <><video src={videoUrl} controls className="w-full rounded-2xl bg-black"/><a href={videoUrl} download={`postatee-${selectedTemplate.id}.mp4`} className="mt-3 w-full bg-green-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Download/> تحميل MP4</a></>}</div></div>
        </div>
      </div>
    </div>
  )
}