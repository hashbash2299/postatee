// @ts-nocheck
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"

const ICONS = [
  { id:"mabkhar", emoji:"🪔", name:"مبخر", color:"#FFB547" },
  { id:"jebena", emoji:"🫖", name:"جبنة", color:"#4D96FF" },
  { id:"mifraka", emoji:"🥄", name:"مفراكة", color:"#A66CFF" },
  { id:"daloka", emoji:"🪘", name:"دلوكة", color:"#FF6B9D" },
  { id:"sebha", emoji:"📿", name:"سبحة", color:"#6BCB77" },
  { id:"khos", emoji:"🧺", name:"خوص", color:"#F8B500" },
  { id:"bostati", emoji:"🅿️", name:"بوستاتي", color:"#FFD700", special:true },
];

const REACTIONS = [
  "عجييييب! 🔥",
  "معللللم! 😍",
  "زول خطر عديييل! 💣",
  "يا مكنة انت! 🚀",
  "بوستاتي ولع! 🅿️",
  "رهيب يا زول!",
];

export default function BostiCrush(){
  const [score,setScore]=useState(0)
  const [moves,setMoves]=useState(25)
  const [reaction,setReaction]=useState("أبدأ الجوطة!")
  const [goal,setGoal]=useState({ jebena:0, sebha:0, daloka:0 })
  const size=6

  useEffect(()=>{
    let board = Array(size).fill(0).map(()=>Array(size).fill(0).map(()=>Math.floor(Math.random()*6)))
    let selected:any=null

    const playSound = (type:string)=>{
      // هنا حنربط ملفات الصوت بعدين
      if(navigator.vibrate) navigator.vibrate(30)
    }

    const showReaction = (combo:number)=>{
      let txt = REACTIONS[Math.min(combo, REACTIONS.length-1)]
      if(combo>=3) txt="زول خطر عديييل! 💥"
      else if(combo==2) txt="معللللم! 🔥"
      else if(combo==1) txt="عجييييب!"
      setReaction(txt)
      playSound("pop")
      setTimeout(()=>setReaction("واصل الجوطة!"),1500)
    }

    const render = ()=>{
      const c=document.getElementById("board")
      if(!c) return
      c.innerHTML=""
      for(let r=0;r<size;r++){
        for(let col=0;col<size;col++){
          const idx=board[r][col]
          const item=ICONS[idx]
          const div=document.createElement("div")
          div.className=`relative w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[26px] cursor-pointer select-none transition-all duration-150 shadow-[0_3px_0_rgba(0,0,0,0.2),inset_0_2px_6px_rgba(255,255,255,0.8)] active:scale-90 border-2`
          div.style.background=`linear-gradient(145deg, white, ${item.color}55)`
          div.style.borderColor=item.color
          if(selected?.r==r && selected?.c==col){
            div.style.transform="scale(1.15) rotate(3deg)"
            div.style.boxShadow=`0 0 20px ${item.color}`
          }
          if(item.special){
            div.style.background=`linear-gradient(145deg, #FFD700, #FFA500)`
            div.innerHTML=`<span class="animate-pulse">🅿️</span><span class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></span>`
          }else{
            div.innerText=item.emoji
          }
          // لمعة كاندي
          const shine=document.createElement("div")
          shine.className="absolute top-1 left-1 w-3 h-3 bg-white/80 rounded-full"
          div.appendChild(shine)

          div.onclick=()=>click(r,col)
          c.appendChild(div)
        }
      }
    }

    const click=(r,c)=>{
      if(moves<=0) return
      if(!selected){ selected={r,c}; render(); return; }
      const dr=Math.abs(selected.r-r), dc=Math.abs(selected.c-c)
      if((dr==1&&dc==0)||(dr==0&&dc==1)){
        let tmp=board[r][c]; board[r][c]=board[selected.r][selected.c]; board[selected.r][selected.c]=tmp
        let matches=findMatches()
        if(matches.length>0){
          setMoves(m=>m-1)
          handle(matches)
          if(board[r][c]==6 || board[selected.r][selected.c]==6) showReaction(3) // بوستاتي
          else if(matches.length>1) showReaction(2)
          else showReaction(1)
        }else{
          tmp=board[r][c]; board[r][c]=board[selected.r][selected.c]; board[selected.r][selected.c]=tmp
        }
      }
      selected=null; render()
    }

    const findMatches=()=>{
      let m:any[]=[]
      for(let r=0;r<size;r++) for(let c=0;c<size-2;c++) if(board[r][c]==board[r][c+1]&&board[r][c]==board[r][c+2]) m.push({r,c,dir:'h'})
      for(let c=0;c<size;c++) for(let r=0;r<size-2;r++) if(board[r][c]==board[r+1][c]&&board[r][c]==board[r+2][c]) m.push({r,c,dir:'v'})
      return m
    }

    const handle=(matches:any)=>{
      let points=0
      for(let {r,c,dir} of matches){
        for(let k=0;k<3;k++){
          let rr=dir=='h'?r:r+k, cc=dir=='h'?c+k:c
          if(board[rr][cc]!==-1){
            if(board[rr][cc]==1) setGoal(g=>({...g,jebena:g.jebena+1}))
            if(board[rr][cc]==4) setGoal(g=>({...g,sebha:g.sebha+1}))
            if(board[rr][cc]==3) setGoal(g=>({...g,daloka:g.daloka+1}))
            board[rr][cc]=-1; points+=10
          }
        }
      }
      setScore(s=>s+points)
      for(let col=0;col<size;col++){
        let empty=0
        for(let r=size-1;r>=0;r--){
          if(board[r][col]==-1) empty++
          else if(empty>0){ board[r+empty][col]=board[r][col]; board[r][col]=-1 }
        }
        for(let r=0;r<empty;r++) board[r][col]=Math.floor(Math.random()*ICONS.length)
      }
      setTimeout(()=>{ let more=findMatches(); if(more.length>0) handle(more); render() },200)
      render()
    }

    render()
  },[moves])

  return(
    <div className="min-h-screen bg-[#2C1A1D] flex flex-col items-center p-2" dir="rtl" style={{fontFamily:"Tajawal"}}>
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-3 rounded-[20px] border-2 border-yellow-400/50 flex justify-between items-center">
          <Link href="/games" className="bg-white/20 px-3 py-1 rounded-full text-white text-xs">← رجوع</Link>
          <h1 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300 text-xl">Bosti Crush</h1>
          <div className="bg-yellow-400 text-black px-3 py-1 rounded-full font-black text-xs">⭐ {score}</div>
        </div>

        {/* Stats سودانية */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="bg-blue-500 rounded-xl p-2 text-center text-white"><div className="text-[10px]">المرحلة</div><div className="font-black">١٢</div></div>
          <div className="bg-purple-600 rounded-xl p-2 text-center text-white"><div className="text-[10px]">نقاطك</div><div className="font-black">{score}</div></div>
          <div className="bg-cyan-600 rounded-xl p-2 text-center text-white"><div className="text-[10px]">حركاتك</div><div className="font-black">{moves}</div></div>
          <div className="bg-orange-500 rounded-xl p-2 text-center text-white"><div className="text-[9px]">المطلوب</div><div className="font-bold text-[10px]">لم 25 جبنة</div></div>
        </div>

        {/* Reaction */}
        <div className="mt-2 h-[40px] bg-black/50 rounded-full flex items-center justify-center border border-white/20">
          <p className="text-white font-black animate-bounce text-sm">{reaction}</p>
        </div>

        {/* Board */}
        <div className="mt-2 bg-[#FFF8E7] rounded-[24px] p-3 border-4 border-yellow-500/30 shadow-2xl">
          <div id="board" className="grid grid-cols-6 gap-[6px] justify-items-center"></div>
          <div className="mt-2 flex justify-between text-[10px] text-black/60 font-bold">
            <span>🫖 {goal.jebena}/25</span>
            <span>📿 {goal.sebha}/25</span>
            <span>🪘 {goal.daloka}/25</span>
          </div>
        </div>

        {/* Buttons سودانية */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={()=>location.reload()} className="bg-gradient-to-b from-blue-400 to-blue-600 text-white font-black py-3 rounded-2xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 shadow-lg">🔄 جوطها</button>
          <button className="bg-gradient-to-b from-purple-400 to-purple-600 text-white font-black py-3 rounded-2xl border-b-4 border-purple-800 active:border-b-0 active:translate-y-1 shadow-lg">💣 قنبلة x3</button>
          <button className="bg-gradient-to-b from-orange-400 to-orange-600 text-white font-black py-3 rounded-2xl border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 shadow-lg">🔨 شاكوش x2</button>
        </div>

        <div className="mt-3 bg-yellow-400 rounded-xl p-2 text-center text-black text-[11px] font-bold">
          💡 اجمع 5 مع بعض يطلع ليك <span className="bg-black text-yellow-400 px-2 rounded-full">🅿️ بوستاتي</span> ويفجر الصف!
        </div>
      </div>
    </div>
  )
}