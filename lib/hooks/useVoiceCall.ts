"use client"
import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN مهم عشان المكالمة تشتغل بين الشبكات المختلفة
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const vibrateInterval = useRef<any>(null);
  const candidatesUnsubRef = useRef<(() => void) | null>(null);
  const statusRef = useRef<'idle'|'calling'|'ringing'|'inCall'>('idle');

  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState("");
  const [micError, setMicError] = useState("");

  useEffect(()=>{ statusRef.current = status; },[status]);

  useEffect(()=>{
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg");
    audio.loop = true;
    audio.preload = "auto";
    ringtoneRef.current = audio;
    return () => { audio.pause(); }
  },[]);

  useEffect(()=>{
    if(status==='ringing' || status==='calling'){
      ringtoneRef.current?.play().catch(()=>{});
      if('vibrate' in navigator){
        navigator.vibrate([500,300,500]);
        vibrateInterval.current = setInterval(()=>navigator.vibrate([500,300,500]), 2000);
      }
    }else{
      ringtoneRef.current?.pause();
      if(ringtoneRef.current) ringtoneRef.current.currentTime = 0;
      if('vibrate' in navigator) navigator.vibrate(0);
      if(vibrateInterval.current){ clearInterval(vibrateInterval.current); vibrateInterval.current=null; }
    }
  },[status]);

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  const cleanup = useCallback(() => {
    try{ pcRef.current?.close(); }catch{}
    pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current=null;
    if(remoteAudioRef.current) remoteAudioRef.current.srcObject=null;
    if(candidatesUnsubRef.current){ candidatesUnsubRef.current(); candidatesUnsubRef.current=null; }
    ringtoneRef.current?.pause();
    if('vibrate' in navigator) navigator.vibrate(0);
    if(vibrateInterval.current){ clearInterval(vibrateInterval.current); vibrateInterval.current=null; }
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId(""); setMicError("");
  },[]);

  // استماع للمكالمات الواردة
  useEffect(()=>{
    if(!myUid) return;
    const q = query(collection(db, "voiceCalls"), where("to","==",myUid));
    const unsub = onSnapshot(q, (snap)=>{
      snap.docChanges().forEach(ch=>{
        const d = ch.doc.data() as any;
        if(ch.type === 'added' && d.type==='offer' && statusRef.current==='idle'){
          setIncoming(d); setIncomingCallId(ch.doc.id); setCallId(ch.doc.id); setStatus('ringing');
        }
        if(d.type==='ended' && ch.doc.id===callId){
          cleanup();
        }
      });
    });
    return ()=>unsub();
  },[myUid, callId, cleanup]);

  // استماع لحالة المكالمة الحالية
  useEffect(()=>{
    if(!callId) return;
    const unsub = onSnapshot(doc(db,"voiceCalls",callId), async (snap)=>{
      if(!snap.exists()){ if(statusRef.current!=='idle') cleanup(); return; }
      const d = snap.data() as any;
      if(d.type==='answer' && pcRef.current && statusRef.current==='calling'){
        try{
          if(pcRef.current.signalingState!== 'stable'){
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({type:'answer', sdp:d.sdp}));
            setStatus('inCall');
          }
        }catch(e){ console.log(e) }
      }
      if(d.type==='ended') cleanup();
    });
    return ()=>unsub();
  },[callId, cleanup]);

  const getMic = async ()=>{
    setMicError("");
    try{ return await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}, video:false}); }
    catch{ setMicError("المايك مقفول - افتحه من الأذونات فوق"); return null; }
  };

  const startCall = async (otherId:string)=>{
    if(!myUid || statusRef.current!=='idle') return;
    const stream = await getMic(); if(!stream) return;
    const cId = getCallId(otherId);
    setCallId(cId); setStatus('calling');
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current=pc; localStreamRef.current=stream;
    stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db,"voiceCalls",cId,"candidates"), {candidate:e.candidate.toJSON(), from:myUid}); };
    pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject=e.streams[0]; remoteAudioRef.current.play().catch(()=>{}); } };
    pc.onconnectionstatechange = ()=>{ if(pc.connectionState==='connected') setStatus('inCall'); if(pc.connectionState==='failed') endCall(otherId); };

    const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
    await setDoc(doc(db,"voiceCalls",cId), {type:'offer', from:myUid, to:otherId, fromName:myData?.displayName||'مستخدم', fromAvatar:myData?.avatar||'', sdp:offer.sdp, createdAt:serverTimestamp()});

    candidatesUnsubRef.current = onSnapshot(collection(db,"voiceCalls",cId,"candidates"), s=>{
      s.docChanges().forEach(async ch=>{ if(ch.type==='added' && ch.doc.data().from!==myUid){ try{ await pc.addIceCandidate(new RTCIceCandidate(ch.doc.data().candidate)); }catch{} } });
    });
  };

  const answerCall = async ()=>{
    if(!incoming ||!incomingCallId) return;
    // وقف الرنين فورا قبل اي شي
    ringtoneRef.current?.pause();
    if(ringtoneRef.current) ringtoneRef.current.currentTime = 0;
    if('vibrate' in navigator) navigator.vibrate(0);

    const stream = await getMic(); if(!stream) return;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current=pc; localStreamRef.current=stream;
    stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db,"voiceCalls",incomingCallId,"candidates"), {candidate:e.candidate.toJSON(), from:myUid}); };
    pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject=e.streams[0]; remoteAudioRef.current.muted=false; remoteAudioRef.current.play().catch(()=>{}); } };
    pc.onconnectionstatechange = ()=>{ if(pc.connectionState==='connected') setStatus('inCall'); };

    await pc.setRemoteDescription(new RTCSessionDescription({type:'offer', sdp:incoming.sdp}));
    const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
    await setDoc(doc(db,"voiceCalls",incomingCallId), {type:'answer', from:myUid, to:incoming.from, sdp:ans.sdp}, {merge:true});
    setStatus('inCall');

    candidatesUnsubRef.current = onSnapshot(collection(db,"voiceCalls",incomingCallId,"candidates"), s=>{
      s.docChanges().forEach(async ch=>{ if(ch.type==='added' && ch.doc.data().from!==myUid){ try{ await pc.addIceCandidate(new RTCIceCandidate(ch.doc.data().candidate)); }catch{} } });
    });
  };

  const endCall = async (otherId?:string)=>{
    const cId = otherId? getCallId(otherId) : callId;
    cleanup();
    if(cId){
      try{
        await setDoc(doc(db,"voiceCalls",cId), {type:'ended', endedAt: serverTimestamp()}, {merge:true});
        // امسح الـ candidates
        const candSnap = await getDocs(collection(db,"voiceCalls",cId,"candidates"));
        candSnap.forEach(d=> deleteDoc(d.ref).catch(()=>{}));
        setTimeout(()=>deleteDoc(doc(db,"voiceCalls",cId)).catch(()=>{}),1500);
      }catch{}
    }
  };

  return { incoming, status, micError, startCall, answerCall, endCall, remoteAudioRef };
}