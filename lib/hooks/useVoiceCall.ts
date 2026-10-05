"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc, query, where } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" }
  ]
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<{ ctx: AudioContext, osc: OscillatorNode, gain: GainNode, interval: any } | null>(null);

  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState<string>("");

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  const stopRing = () => {
    try{
      if(ringRef.current){
        clearInterval(ringRef.current.interval);
        try{ ringRef.current.osc.stop(); }catch{}
        try{ ringRef.current.ctx.close(); }catch{}
      }
    }catch{}
    ringRef.current = null;
    if(typeof navigator!== 'undefined' && navigator.vibrate) navigator.vibrate(0);
    try{ (window as any)._ring?.pause(); (window as any)._ring=null; }catch{}
  };

  const startRing = (isOutgoing: boolean) => {
    stopRing();
    try{
      if(navigator.vibrate) navigator.vibrate(isOutgoing? [300,700,300] : [500,200,500,200,500,200]);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = isOutgoing? 800 : 480;
      gain.gain.value = 0;
      osc.start();
      const interval = setInterval(()=>{
        if(!ringRef.current) return;
        if(gain.gain.value < 0.1){
          gain.gain.setValueAtTime(0.4, ctx.currentTime);
          if(navigator.vibrate) navigator.vibrate(isOutgoing? [300] : [400]);
        } else {
          gain.gain.setValueAtTime(0, ctx.currentTime);
        }
      }, isOutgoing? 1100 : 850);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      ringRef.current = { ctx, osc, gain, interval };
    }catch{
      try{ const a = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"); a.loop=true; a.play().catch(()=>{}); (window as any)._ring=a; }catch{}
    }
  };

  useEffect(()=>{
    if(status==='calling') startRing(true);
    else if(status==='ringing') startRing(false);
    else stopRing();
    return ()=> stopRing();
  },[status]);

  // ✅ اهم تعديل - يسمع كل المكالمات حتى لو انت في الصفحة الرئيسية
  useEffect(()=>{
    if(!myUid) return;
    // نسمع اي وثيقة فيها اسمك
    const q = query(collection(db, "voiceCalls"));
    const unsub = onSnapshot(q, (snap)=>{
      snap.docChanges().forEach(async (ch)=>{
        const data = ch.doc.data() as any;
        const id = ch.doc.id;

        // مكالمة جاية ليك
        if((ch.type==='added' || ch.type==='modified') && data.to===myUid && data.from!==myUid && data.type==='offer'){
          if(status==='idle'){
            console.log("Incoming call found:", id);
            setIncoming(data);
            setIncomingCallId(id);
            setCallId(id);
            setStatus('ringing');
          }
        }
        // الطرف التاني رد
        if((ch.type==='added' || ch.type==='modified') && id===callId && data.type==='answer' && data.from!==myUid){
          if(pcRef.current && status==='calling'){
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type:'answer', sdp:data.sdp }));
            setStatus('inCall');
          }
        }
        // المكالمة اتقفلت
        if(ch.type==='removed' && id===callId){
          stopRing();
          pcRef.current?.close(); pcRef.current=null;
          localStreamRef.current?.getTracks().forEach(t=>t.stop());
          setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
        }
      });
    });
    return ()=> unsub();
  },[myUid, callId, status]);

  const setupPC = async (cId: string) => {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;
    pc.onicecandidate = e=>{
      if(e.candidate) addDoc(collection(db, "voiceCalls", cId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid }).catch(()=>{});
    };
    pc.ontrack = e=>{
      if(remoteAudioRef.current){
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(()=>{
          // لو autoplay اتبلوك - المستخدم لازم يدوس
          document.addEventListener('click', ()=> remoteAudioRef.current?.play(), {once:true});
        });
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true, sampleRate:48000 }, video:false });
    localStreamRef.current = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));
    onSnapshot(collection(db, "voiceCalls", cId, "candidates"), s=>{
      s.docChanges().forEach(async c=>{
        if(c.type==='added' && c.doc.data().from!==myUid){
          try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{}
        }
      });
    });
    return pc;
  };

  const startCall = async (otherId: string) => {
    if(!otherId) return;
    const cId = getCallId(otherId);
    setCallId(cId);
    setStatus('calling');
    const pc = await setupPC(cId);
    const offer = await pc.createOffer({ offerToReceiveAudio:true });
    await pc.setLocalDescription(offer);
    await setDoc(doc(db, "voiceCalls", cId), { type:'offer', from:myUid, to:otherId, fromName:myData?.displayName || 'مستخدم', fromAvatar:myData?.avatar || '', sdp:offer.sdp, createdAt:serverTimestamp() });
  };

  const answerCall = async () => {
    if(!incoming ||!incomingCallId) return;
    stopRing();
    await new Promise(r=> setTimeout(r, 150)); // مهم جدا عشان AudioContext يقفل
    try{
      const pc = await setupPC(incomingCallId);
      await pc.setRemoteDescription(new RTCSessionDescription({ type:'offer', sdp:incoming.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await setDoc(doc(db, "voiceCalls", incomingCallId), { type:'answer', from:myUid, to:incoming.from, sdp:answer.sdp, createdAt:serverTimestamp() }, { merge:true });
      setStatus('inCall');
    }catch(e){
      console.error(e);
      alert('فشل فتح المايك - ادي الاذن للمتصفح');
      setStatus('idle');
    }
  };

  const endCall = async (otherId?: string) => {
    const cId = otherId? getCallId(otherId) : callId;
    stopRing();
    pcRef.current?.close(); pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
    if(cId) try{ await deleteDoc(doc(db,"voiceCalls",cId)); }catch{}
  };

  return { incoming, status, startCall, answerCall, endCall, remoteAudioRef };
}