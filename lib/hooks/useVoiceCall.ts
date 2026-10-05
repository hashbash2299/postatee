"use client"
import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot, deleteDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
  ],
  iceCandidatePoolSize: 10,
};

export function useVoiceCall(myUid: string, myData: any) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const candidatesUnsubRef = useRef<(() => void) | null>(null);
  const callUnsubRef = useRef<(() => void) | null>(null);

  const [incoming, setIncoming] = useState<any>(null);
  const [incomingCallId, setIncomingCallId] = useState<string>("");
  const [status, setStatus] = useState<'idle'|'calling'|'ringing'|'inCall'>('idle');
  const [callId, setCallId] = useState<string>("");
  const [micError, setMicError] = useState<string>("");

  const getCallId = (otherId: string) => [myUid, otherId].sort().join('_');

  const stopRing = () => {
    try { if((navigator as any).vibrate) (navigator as any).vibrate(0); }catch{}
  };

  // تنظيف شامل
  const endCallLocal = () => {
    stopRing();
    if(candidatesUnsubRef.current){ candidatesUnsubRef.current(); candidatesUnsubRef.current = null; }
    if(pcRef.current){
      try { pcRef.current.ontrack = null; pcRef.current.onicecandidate = null; pcRef.current.onconnectionstatechange = null; }catch{}
      pcRef.current.close();
    }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t=>t.stop());
    localStreamRef.current = null;
    if(remoteAudioRef.current){ try{ remoteAudioRef.current.srcObject = null; }catch{} }
    setStatus('idle'); setIncoming(null); setIncomingCallId(""); setCallId("");
  };

  // مراقب المكالمات الواردة فقط
  useEffect(()=>{
    if(!myUid) return;
    const unsub = onSnapshot(collection(db, "voiceCalls"), (snap)=>{
      snap.docChanges().forEach((ch)=>{
        const data = ch.doc.data() as any;
        const id = ch.doc.id;
        // مكالمة واردة جديدة
        if((ch.type==='added' || ch.type==='modified') && data.to===myUid && data.from!==myUid && data.type==='offer'){
          if(status==='idle'){
            setIncoming(data);
            setIncomingCallId(id);
            setCallId(id);
            setStatus('ringing');
            try{ if((navigator as any).vibrate) (navigator as any).vibrate([500,200,500]); }catch{}
          }
        }
        // انتهت
        if((ch.type==='modified' || ch.type==='removed') && id===callId){
          if(ch.type==='removed' || data.type==='ended'){
            endCallLocal();
          }
        }
      });
    });
    return ()=> unsub();
  },[myUid, callId, status]);

  // مراقب الـ answer للمتصل فقط
  useEffect(()=>{
    if(!callId || status!=='calling') return;
    if(callUnsubRef.current) callUnsubRef.current();
    const unsub = onSnapshot(doc(db,"voiceCalls",callId), async (snap)=>{
      if(!snap.exists()) return;
      const data = snap.data() as any;
      if(data.type==='answer' && data.from!==myUid && pcRef.current){
        try{
          // مهم: تحقق ما عملنا setRemote قبل كده
          if(pcRef.current.signalingState==='have-local-offer'){
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type:'answer', sdp:data.sdp }));
            setStatus('inCall');
          }
        }catch(e){ console.log("answer error", e); }
      }
    });
    callUnsubRef.current = unsub;
    return ()=> unsub();
  },[callId, status]);

  const getMicStream = async (): Promise<MediaStream | null> => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation:true, noiseSuppression:true, autoGainControl:true },
        video:false
      });
      return stream;
    } catch (err: any) {
      if(err.name === 'NotAllowedError') setMicError("المايك مقفول. دوس علامة القفل فوق واعمل Allow");
      else if(err.name === 'NotFoundError') setMicError("ما لقينا مايك");
      else if(err.name === 'NotReadableError') setMicError("المايك شغال في واتساب او تطبيق تاني");
      else setMicError("فشل فتح المايك");
      return null;
    }
  };

  const setupCandidatesListener = (cId: string, pc: RTCPeerConnection) => {
    if(candidatesUnsubRef.current) candidatesUnsubRef.current();
    const unsub = onSnapshot(collection(db, "voiceCalls", cId, "candidates"), (s)=>{
      s.docChanges().forEach(async (c)=>{
        if(c.type==='added'){
          const d = c.doc.data() as any;
          if(d.from!==myUid && d.candidate){
            try{ await pc.addIceCandidate(new RTCIceCandidate(d.candidate)); }catch{}
          }
        }
      });
    });
    candidatesUnsubRef.current = unsub;
  };

  const startCall = async (otherId: string) => {
    if(!otherId || status!=='idle') return;
    const stream = await getMicStream();
    if(!stream) return;

    // فك الصوت بجسچر مباشر للموبايل
    try{
      if(remoteAudioRef.current){
        remoteAudioRef.current.muted = false;
        await remoteAudioRef.current.play().catch(()=>{});
        remoteAudioRef.current.pause();
      }
    }catch{}

    const cId = getCallId(otherId);
    setCallId(cId);
    setStatus('calling');

    try{
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      localStreamRef.current = stream;
      stream.getTracks().forEach(t=> pc.addTrack(t, stream));

      pc.onicecandidate = e=>{
        if(e.candidate) addDoc(collection(db, "voiceCalls", cId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid });
      };
      pc.ontrack = e=>{
        if(remoteAudioRef.current){
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(()=>{});
        }
      };
      pc.onconnectionstatechange = ()=>{
        if(pc.connectionState==='failed' || pc.connectionState==='disconnected'){
          setTimeout(()=>{ try{ pc.restartIce(); }catch{} }, 1000);
        }
        if(pc.connectionState==='connected') setStatus('inCall');
      };

      const offer = await pc.createOffer({ offerToReceiveAudio:true, offerToReceiveVideo:false } as any);
      await pc.setLocalDescription(offer);

      await setDoc(doc(db, "voiceCalls", cId), {
        type:'offer', from:myUid, to:otherId,
        fromName:myData?.displayName || 'مستخدم', fromAvatar:myData?.avatar || '',
        sdp:offer.sdp, createdAt:serverTimestamp()
      });

      setupCandidatesListener(cId, pc);

    }catch(e){
      console.error(e);
      endCallLocal();
    }
  };

  const answerCall = async () => {
    if(!incoming ||!incomingCallId) return;

    // اهم خطوة للموبايل: شغل عنصر الصوت جوه نفس الضغطة
    try{
      if(remoteAudioRef.current){
        remoteAudioRef.current.muted = false;
        // حركة فك البلوك في iOS
        await remoteAudioRef.current.play().catch(()=>{});
      }
    }catch{}

    const stream = await getMicStream();
    if(!stream){
      // لو فشل المايك خليك في ringing
      return;
    }

    try{
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      localStreamRef.current = stream;
      stream.getTracks().forEach(t=> pc.addTrack(t, stream));

      pc.onicecandidate = e=>{ if(e.candidate) addDoc(collection(db, "voiceCalls", incomingCallId, "candidates"), { candidate: e.candidate.toJSON(), from: myUid }); };
      pc.ontrack = e=>{
        if(remoteAudioRef.current){
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().then(()=>{}).catch(()=>{});
        }
      };
      pc.onconnectionstatechange = ()=>{ if(pc.connectionState==='connected') setStatus('inCall'); };

      await pc.setRemoteDescription(new RTCSessionDescription({ type:'offer', sdp:incoming.sdp }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // استخدم update مش set عشان ما نمسح بيانات
      await setDoc(doc(db, "voiceCalls", incomingCallId), {
        type:'answer', from:myUid, to:incoming.from, sdp:answer.sdp, answeredAt:serverTimestamp()
      }, { merge:true });

      setStatus('inCall');
      setupCandidatesListener(incomingCallId, pc);

    }catch(e){
      console.error("answer failed", e);
      localStreamRef.current?.getTracks().forEach(t=>t.stop());
      // خليك في ringing عشان يقدر يدوس تاني
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
        setTimeout(async ()=>{ try{ await deleteDoc(doc(db,"voiceCalls",cId)); }catch{} }, 1500);
      }catch{}
    }
  };

  return { incoming, status, micError, startCall, answerCall, endCall, remoteAudioRef };
}