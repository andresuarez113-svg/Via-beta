import { useEffect } from "react";
export function PwaRegister(){useEffect(()=>{if("serviceWorker" in navigator&&window.location.protocol==="https:")navigator.serviceWorker.register("/sw.js").catch(()=>undefined)},[]);return null;}
