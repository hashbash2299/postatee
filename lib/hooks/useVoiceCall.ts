"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc, query } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
  ],
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringRef = useRef<{ ctx: AudioContext, osc: OscillatorNode, gain: GainNode, interval: any } | null>(null);
  const keepAliveRef = useRef<any>(null);

  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState<string>("");
  const [micError, setMicError] = useState<string>("");

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
    if(typeof navigator!== 'undefined' && (navigator as any).vibrate) navigator.vibrate(0);
    try{ (window as any)._ring?.pause(); (window as any)._ring=null; }catch{}
  };

  const startRing = (isOutgoing: boolean) => {
    stopRing();
    try{
      if((navigator as any).vibrate) (navigator as any).vibrate(isOutgoing? [300,700,300] : [500,200,500,200]);
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
        gain.gain.value = gain.gain.value < 0.1? 0.4 : 0;
      }, isOutgoing? 1100 : 850);
      gain.gain.value = 0.4;
      ringRef.current = { ctx, osc, gain, interval };
    }catch{}
  };

  useEffect(()=>{
    if(status==='calling') startRing(true);
    else if(status==='ringing') startRing(false);
    else stopRing();
    return ()=> stopRing();
  },[status]);

  useEffect(()=>{
    if(!myUid) return;
    const q = query(collection(db, "voiceCalls"));
    const unsub = onSnapshot(q, (snap)=>{
      snap.docChanges().forEach(async (ch)=>{
        const data = ch.doc.data() as any;
        const id = ch.doc.id;
        if((ch.type==='added' || ch.type==='modified') && data.to===myUid && data.from!==myUid && data.type==='offer'){
          if(status==='idle'){
            setIncoming(data);
            setIncomingCallId(id);
            setCallId(id);
            setStatus('ringing');
          }
        }
        if((ch.type==='added' || ch.type==='modified') && id===callId && data.type==='answer' && data.from!==myUid){
          if(pcRef.current && status==='calling'){
            try{
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type:'answer', sdp:data.sdp }));
              setStatus('inCall');
            }catch{}
          }
        }
        if(ch.type==='removed' && id===callId){
          endCallLocal();
        }
        if((ch.type==='added' || ch.type==='modified') && id===callId && data.type==='ended'){
          endCallLocal();
          setTimeout(async ()=>{ try{ await deleteDoc(doc(db,"voiceCalls",id)); }catch{} }, 1000);
        }
      });
    });
    return ()=> unsub();
  },[myUid, callId, status]);

  const getMicStream = async (): Promise<MediaStream | null> => {
    setMicError("");
    try {
      if(!navigator.mediaDevices?.getUserMedia) throw new Error("NOT_SUPPORTED");
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true },
        video:false
      });
    } catch (err: any) {
      if(err.name === 'NotAllowedError'){
        setMicError("المايك مقفول. اضغط على 🔒 فوق جنب رابط الموقع واعمل Allow للمايك ثم اعمل ريفريش");
      } else if(err.name === 'NotFoundError'){
        setMicError("ما لقينا مايك");
      } else if(err.name === 'NotReadableError'){
        setMicError("المايك شغال في تطبيق تاني (واتساب). اقفلو وجرب");
      } else {
        setMicError("فشل فتح المايك");
      }
      return null;
    }
  };

  const endCallLocal = () => {
    stopRing();
    if(keepAliveRef.current) clearInterval(keepAliveRef.current);
    pcRef.current?.close(); pcRef.current=null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current=null;
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
  };

  const startCall = async (otherId: string) => {
    if(!otherId) return;
    const stream = await getMicStream();
    if(!stream) return;

    const cId = getCallId(otherId);
    setCallId(cId);
    setStatus('calling');

    try{
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      localStreamRef.current = stream;
      stream.getTracks().forEach(t=> pc.addTrack(t, stream));

      pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db, "voiceCalls", cId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid }); };
      pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject = e.streams[0]; remoteAudioRef.current.play().catch(()=>{}); } };
      pc.onconnectionstatechange = ()=>{ if(pc.connectionState==='failed') pc.restartIce(); };

      const offer = await pc.createOffer({ offerToReceiveAudio:true } as any);
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, "voiceCalls", cId), {
        type:'offer', from:myUid, to:otherId,
        fromName:myData?.displayName || 'مستخدم', fromAvatar:myData?.avatar || '',
        sdp:offer.sdp, createdAt:serverTimestamp()
      });

      onSnapshot(collection(db, "voiceCalls", cId, "candidates"), s=>{
        s.docChanges().forEach(async c=>{
          if(c.type==='added' && c.doc.data().from!==myUid){
            try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{}
          }
        });
      });

      if(keepAliveRef.current) clearInterval(keepAliveRef.current);
      keepAliveRef.current = setInterval(()=>{ if(pc.connectionState==='connected') setDoc(doc(db,"voiceCalls",cId), { lastPing: serverTimestamp() }, {merge:true}).catch(()=>{}); }, 15000);

    }catch(e){
      console.error(e);
      stream.getTracks().forEach(t=>t.stop());
      setStatus('idle');
    }
  };

  const answerCall = async () => {
    if(!incoming ||!incomingCallId) return;

    const stream = await getMicStream();
    if(!stream) return;

    stopRing();

    try{
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      localStreamRef.current = stream;
      stream.getTracks().forEach(t=> pc.addTrack(t, stream));

      pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db, "voiceCalls", incomingCallId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid }); };
      pc.ontrack = e=>{ if(remoteAudioRef.current){ remoteAudioRef.current.srcObject = e.streams[0]; remoteAudioRef.current.play().catch(()=>{}); } };

      await pc.setRemoteDescription(new RTCSessionDescription({ type:'offer', sdp:incoming.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await setDoc(doc(db, "voiceCalls", incomingCallId), {
        type:'answer', from:myUid, to:incoming.from, sdp:answer.sdp, createdAt:serverTimestamp()
      }, { merge:true });

      setStatus('inCall');

      onSnapshot(collection(db, "voiceCalls", incomingCallId, "candidates"), s=>{
        s.docChanges().forEach(async c=>{
          if(c.type==='added' && c.doc.data().from!==myUid){
            try{ await pc.addIceCandidate(new RTCIceCandidate(c.doc.data().candidate)); }catch{}
          }
        });
      });

    }catch(e){
      console.error(e);
      stream.getTracks().forEach(t=>t.stop());
      setStatus('ringing');
    }
  };

  const endCall = async (otherId?: string) => {
    const cId = otherId? getCallId(otherId) : callId;
    endCallLocal();
    setMicError("");
    if(cId){
      try{
        await setDoc(doc(db,"voiceCalls",cId), { type:'ended', endedAt: serverTimestamp() }, {merge:true});
        setTimeout(async ()=>{ try{ await deleteDoc(doc(db,"voiceCalls",cId)); }catch{} }, 2500);
      }catch{}
    }
  };

  return { incoming, status, micError, startCall, answerCall, endCall, remoteAudioRef };
}