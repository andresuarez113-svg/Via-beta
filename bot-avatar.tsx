import { cn } from "@/lib/utils";

type Expression = "calm" | "happy" | "curious" | "surprised" | "sleepy" | "focused";
const palettes = [["#6EE7B7","#FFFFFF"],["#60A5FA","#FFFFFF"],["#A78BFA","#FFFFFF"],["#F9A8D4","#FFFFFF"],["#FBBF24","#FFFFFF"],["#FB7185","#FFFFFF"],["#22D3EE","#FFFFFF"],["#34D399","#FFFFFF"]];
const expressions: Expression[] = ["calm","happy","curious","surprised","sleepy","focused"];
function hash(value: string) { let result=0; for(let i=0;i<value.length;i+=1) result=(result*31+value.charCodeAt(i))>>>0; return result; }
export function botAvatarStyle(id:string){const h=hash(id);const p=palettes[h%palettes.length];return {background:`radial-gradient(circle at 32% 24%, ${p[1]} 0%, ${p[1]} 13%, ${p[0]} 54%, color-mix(in srgb, ${p[0]} 72%, #111827) 100%)`};}
export function BotAvatar({id,size="md",className}:{id:string;size?:"sm"|"md"|"lg";className?:string}){
 const h=hash(id), expression=expressions[h%expressions.length];
 const sizeClass=size==="lg"?"size-28":size==="sm"?"size-11":"size-16";
 const eyeClass=size==="lg"?"h-6 w-4":size==="sm"?"h-3.5 w-2.5":"h-4.5 w-3";
 const transform={calm:"scale-y-75",happy:"scale-y-50 translate-y-1",curious:"rotate-[-8deg]",surprised:"scale-y-125 scale-x-90",sleepy:"scale-y-25 translate-y-1",focused:"scale-y-60 -translate-y-0.5"}[expression];
 return <span aria-hidden="true" className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-inner",sizeClass,className)} style={botAvatarStyle(id)}><span className="absolute inset-[9%] rounded-full bg-white/10"/><span className={cn("relative flex items-center",size==="lg"?"gap-5":size==="sm"?"gap-2":"gap-3")}><span className={cn("rounded-full bg-white shadow-sm transition-transform",eyeClass,transform)}/><span className={cn("rounded-full bg-white shadow-sm transition-transform",eyeClass,transform)}/></span></span>;
}
