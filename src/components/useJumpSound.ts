import {useCallback, useEffect, useRef, useState} from "react";

export function useJumpSound(){
  const audio=useRef<AudioContext | null>(null);
  const [enabled,setEnabled]=useState(false);
  useEffect(()=>()=>{void audio.current?.close().catch(()=>{});},[]);
  function toggle(on:boolean){
    if(!on){setEnabled(false);return;}
    if(!window.AudioContext) return;
    audio.current ??= new AudioContext();
    void audio.current.resume().catch(()=>setEnabled(false));
    setEnabled(true);
  }
  const play=useCallback(()=>{
    const ctx=audio.current;
    if(!enabled || ctx?.state!=="running") return;
    const tone=ctx.createOscillator(), gain=ctx.createGain();
    const start=ctx.currentTime;
    tone.frequency.setValueAtTime(470,start);
    tone.frequency.exponentialRampToValueAtTime(760,start+0.075);
    gain.gain.setValueAtTime(0.001,start);
    gain.gain.exponentialRampToValueAtTime(0.075,start+0.012);
    gain.gain.exponentialRampToValueAtTime(0.001,start+0.13);
    tone.connect(gain).connect(ctx.destination);
    tone.onended=()=>{tone.disconnect();gain.disconnect()};
    tone.start(start);tone.stop(start+0.14);
  },[enabled]);
  return {enabled,toggle,play};
}
