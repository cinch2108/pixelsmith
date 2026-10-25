
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ADJ=[["brightness","Brightness",0,200,100,"%"],["contrast","Contrast",0,200,100,"%"],["saturate","Saturation",0,300,100,"%"],["hue","Hue",-180,180,0,"°"],["blur","Blur",0,20,0,"px"],["grayscale","Grayscale",0,100,0,"%"],["sepia","Sepia",0,100,0,"%"],["invert","Invert",0,100,0,"%"],["sharpen","Sharpen",0,100,0,"%"]];
const LOOKS={None:{},Vivid:{saturate:150,contrast:115},Mono:{grayscale:100,contrast:115},Warm:{sepia:30,saturate:120},Cool:{hue:-15,saturate:110,brightness:103},Fade:{contrast:80,brightness:110,saturate:80},Noir:{grayscale:100,contrast:160,brightness:90},Vintage:{sepia:55,contrast:90,brightness:105},Pop:{saturate:200,contrast:125}};
const ASPECTS=[["Free",0],["1:1",1],["4:3",4/3],["3:4",3/4],["16:9",16/9],["9:16",9/16],["3:2",3/2],["2:3",2/3],["21:9",21/9]];
const SOCIAL=[["IG post",1080,1080],["IG portrait",1080,1350],["IG story",1080,1920],["YouTube thumb",1280,720],["X post",1600,900],["X header",1500,500],["LinkedIn banner",1584,396],["FB cover",820,312],["TikTok",1080,1920],["Passport 2×2in",600,600],["Pinterest",1000,1500],["OG image",1200,630]];
const SIZES=[["4K",3840],["1080p",1920],["720p",1280],["Web 1200",1200],["Email 800",800],["Thumb 300",300]];
let imgs=[],cur=-1;
const def=()=>({fmt:document.body.dataset.fmt||"auto",q:82,tOn:false,tKB:200,tUnit:1,bg:false,rmode:"none",pct:50,w:0,h:0,lock:true,fw:1920,fh:1080,crop:null,aspect:0,rot:0,flipH:false,flipV:false,str:0,adj:Object.fromEntries(ADJ.map(a=>[a[0],a[4]])),outW:0,outH:0});
const S=()=>imgs[cur].s;

// ---------- loading ----------
// ---------- input validation ----------
const MAX_FILES=500,MAX_BYTES=200*1024*1024,MAX_PIXELS=120e6;
const SIGS=[[0,[0xFF,0xD8,0xFF]],[0,[0x89,0x50,0x4E,0x47]],[0,[0x47,0x49,0x46,0x38]],[0,[0x42,0x4D]],[8,[0x57,0x45,0x42,0x50]],[4,[0x66,0x74,0x79,0x70]],[0,[0x49,0x49,0x2A,0x00]],[0,[0x4D,0x4D,0x00,0x2A]],[0,[0x00,0x00,0x01,0x00]]];
async function isRealImage(f){const b=new Uint8Array(await f.slice(0,512).arrayBuffer());if(SIGS.some(([o,s])=>s.every((v,i)=>b[o+i]===v)))return true;const t=new TextDecoder().decode(b).trimStart().toLowerCase();return f.type==="image/svg+xml"&&(t.startsWith("<svg")||t.startsWith("<?xml"))}
async function addFiles(files){let skipped=0;for(const f of [...files]){if(imgs.length>=MAX_FILES){toast(`Limit is ${MAX_FILES} images at once`);break}if(!f.type.startsWith("image/")||f.size>MAX_BYTES||!(await isRealImage(f))){skipped++;continue}loadOne(f)}if(skipped)toast(`Skipped ${skipped} file${skipped>1?"s":""} that ${skipped>1?"aren't":"isn't a"} supported image${skipped>1?"s":""} or ${skipped>1?"are":"is"} over 200 MB`)}
function loadOne(f){const url=URL.createObjectURL(f),im=new Image();im.onerror=()=>{URL.revokeObjectURL(url);toast("Couldn't read "+f.name.slice(0,60))};im.onload=()=>{if(im.naturalWidth*im.naturalHeight>MAX_PIXELS){URL.revokeObjectURL(url);toast("That image is over 120 megapixels, which is too large to edit safely");return}imgs.push({file:f,name:f.name,url,img:im,s:def()});if(cur<0)cur=0;start();renderList();if(imgs.length===1||cur===imgs.length-1)select(cur)};im.src=url}
function start(){$("#landing").style.display="none";$("#app").style.display="grid";$("#addMore").hidden=false;document.body.classList.add("editing")}
$("#drop").onclick=$("#addMore").onclick=()=>$("#file").click();
$("#file").onchange=e=>{addFiles(e.target.files);e.target.value=""};
["dragover","dragenter"].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();$("#drop").classList.add("over")}));
["dragleave","drop"].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();$("#drop").classList.remove("over")}));
document.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
document.addEventListener("paste",e=>{const f=[...e.clipboardData.items].filter(i=>i.type.startsWith("image/")).map(i=>{const b=i.getAsFile();return new File([b],"pasted-"+Date.now()+".png",{type:b.type})});if(f.length)addFiles(f)});

function renderList(){const L=$("#list");L.innerHTML="";imgs.forEach((o,i)=>{const d=document.createElement("div");d.className="thumb"+(i===cur?" on":"");const im=document.createElement("img");im.src=o.url;im.alt="";const nm=document.createElement("div");nm.textContent=o.name;const xb=document.createElement("button");xb.className="x";xb.type="button";xb.title="Remove";xb.textContent="✕";d.append(im,nm,xb);d.onclick=()=>select(i);d.querySelector(".x").onclick=e=>{e.stopPropagation();URL.revokeObjectURL(o.url);imgs.splice(i,1);if(!imgs.length){location.reload();return}cur=Math.min(cur,imgs.length-1);renderList();select(cur)};L.appendChild(d)})}
function select(i){cur=i;$$(".thumb").forEach((t,j)=>t.classList.toggle("on",j===i));syncUI();draw()}

// ---------- geometry ----------
function geom(o,s=o.s){const iw=o.img.naturalWidth,ih=o.img.naturalHeight;const c=s.crop||{x:0,y:0,w:1,h:1};let cw=c.w*iw,ch=c.h*ih;const r90=s.rot%180!==0;let bw=r90?ch:cw,bh=r90?cw:ch;
 // straighten: shrink to largest inner rect
 let zoom=1;if(s.str){const a=Math.abs(s.str)*Math.PI/180;zoom=Math.cos(a)+Math.max(bw/bh,bh/bw)*Math.sin(a)}
 let W=bw,H=bh;if(s.rmode==="pct"){W=bw*s.pct/100;H=bh*s.pct/100}else if(s.rmode==="px"){W=s.w||bw;H=s.h||bh}else if(s.rmode==="fit"){const k=Math.min(1,(s.fw||bw)/bw,(s.fh||bh)/bh);W=bw*k;H=bh*k}
 return{iw,ih,sx:c.x*iw,sy:c.y*ih,cw,ch,r90,bw,bh,W:Math.max(1,Math.round(W)),H:Math.max(1,Math.round(H)),zoom}}
function filterStr(a){return`brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%) hue-rotate(${a.hue}deg) blur(${a.blur}px) grayscale(${a.grayscale}%) sepia(${a.sepia}%) invert(${a.invert}%)`}
function outType(o,s=o.s){if(s.fmt!=="auto")return s.fmt;const t=o.file.type;return["image/jpeg","image/png","image/webp","image/avif"].includes(t)?t:"image/png"}
function render(o,scale=1,s=o.s,raw=false){const g=geom(o,s);const W=Math.max(1,Math.round(g.W*scale)),H=Math.max(1,Math.round(g.H*scale));const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");x.imageSmoothingQuality="high";
 const type=outType(o,s);if(!raw&&(s.bg||type==="image/jpeg")){x.fillStyle="#fff";x.fillRect(0,0,W,H)}
 if(!raw)x.filter=filterStr(s.adj);
 x.translate(W/2,H/2);x.rotate((s.rot+(s.str||0))*Math.PI/180);x.scale((s.flipH?-1:1)*g.zoom,(s.flipV?-1:1)*g.zoom);
 const dw=g.r90?H:W,dh=g.r90?W:H;x.drawImage(o.img,g.sx,g.sy,g.cw,g.ch,-dw/2,-dh/2,dw,dh);
 if(!raw&&s.adj.sharpen>0)sharpen(x,W,H,s.adj.sharpen/100);
 return c}
function sharpen(x,W,H,amt){if(W*H>25e6)return;const d=x.getImageData(0,0,W,H),p=d.data,o=new Uint8ClampedArray(p),k=amt;for(let y=1;y<H-1;y++)for(let X=1;X<W-1;X++){const i=(y*W+X)*4;for(let c=0;c<3;c++){const v=o[i+c]*(1+4*k)-k*(o[i-4+c]+o[i+4+c]+o[i-W*4+c]+o[i+W*4+c]);p[i+c]=v}}x.putImageData(d,0,0)}
const toBlob=(c,t,q)=>new Promise(r=>c.toBlob(b=>r(b),t,q));
async function exportBlob(o,s=o.s){let type=outType(o,s);const lossy=type!=="image/png";let c=render(o,1,s);let b=await toBlob(c,type,s.q/100);if(b&&b.type!==type){type=b.type}
 if(s.tOn&&lossy){const max=s.tKB*s.tUnit*1024;let scale=1;for(let pass=0;pass<8&&b.size>max;pass++){let lo=.05,hi=s.q/100,best=null;for(let i=0;i<8;i++){const m=(lo+hi)/2,t=await toBlob(c,type,m);if(t.size<=max){best=t;lo=m}else hi=m}if(best){b=best;break}scale*=.8;c=render(o,scale,s);b=await toBlob(c,type,.05)}}
 return b}

// ---------- preview ----------
const cv=$("#cv");let pendingEst;
function draw(){if(cur<0)return;const o=imgs[cur],s=o.s,cropTab=$(".tabs .on").dataset.t==="crop";const g=geom(o);
 if(cropTab){const k=Math.min(1,1600/Math.max(g.iw,g.ih));cv.width=g.iw*k;cv.height=g.ih*k;const x=cv.getContext("2d");x.filter=filterStr(s.adj);x.drawImage(o.img,0,0,cv.width,cv.height);showCrop()}
 else{$("#crop").style.display="none";const k=Math.min(1,1600/Math.max(g.W,g.H));const c=render(o,k);cv.width=c.width;cv.height=c.height;cv.getContext("2d").drawImage(c,0,0)}
 $("#dims").innerHTML=`<b>${g.iw}×${g.ih}</b> → <b>${g.W}×${g.H}</b> px`;
 clearTimeout(pendingEst);$("#sizes").innerHTML="Calculating size…";pendingEst=setTimeout(async()=>{const b=await exportBlob(o);if(imgs[cur]!==o)return;const d=(1-b.size/o.file.size)*100;$("#sizes").innerHTML=`${fmtB(o.file.size)} → <b>${fmtB(b.size)}</b> <span class="${d>=0?"save":"grow"}">${d>=0?"−":"+"}${Math.abs(d).toFixed(0)}%</span> · ${b.type.split("/")[1].toUpperCase()}`},350)}
const fmtB=n=>n<1024?n+" B":n<1048576?(n/1024).toFixed(1)+" KB":(n/1048576).toFixed(2)+" MB";
$("#compare").onpointerdown=()=>{const o=imgs[cur];if(!o)return;cv.width=Math.min(1600,o.img.naturalWidth);cv.height=cv.width*o.img.naturalHeight/o.img.naturalWidth;cv.getContext("2d").drawImage(o.img,0,0,cv.width,cv.height);$("#crop").style.display="none"};
$("#compare").onpointerup=$("#compare").onpointerleave=()=>draw();

// ---------- crop interaction ----------
function showCrop(){const s=S(),c=s.crop||{x:0,y:0,w:1,h:1},b=$("#crop");b.style.display="block";b.style.left=c.x*cv.clientWidth+"px";b.style.top=c.y*cv.clientHeight+"px";b.style.width=c.w*cv.clientWidth+"px";b.style.height=c.h*cv.clientHeight+"px"}
function setAspect(r){const o=imgs[cur],s=o.s;s.aspect=r;if(!r){draw();return}const iw=o.img.naturalWidth,ih=o.img.naturalHeight;let w=iw,h=w/r;if(h>ih){h=ih;w=h*r}s.crop={x:(iw-w)/2/iw,y:(ih-h)/2/ih,w:w/iw,h:h/ih};draw()}
let drag=null;
$("#wrap").addEventListener("pointerdown",e=>{if($(".tabs .on").dataset.t!=="crop")return;e.preventDefault();const r=cv.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height,s=S(),c={...(s.crop||{x:0,y:0,w:1,h:1})};const hd=e.target.dataset.h;
 drag={mode:hd?hd:e.target.id==="crop"?"move":"new",sx:px,sy:py,c};if(drag.mode==="new"){s.crop={x:px,y:py,w:0,h:0};drag.c={...s.crop};drag.mode="se"}$("#wrap").setPointerCapture(e.pointerId)});
$("#wrap").addEventListener("pointermove",e=>{if(!drag)return;const r=cv.getBoundingClientRect(),o=imgs[cur],s=o.s;let px=Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),py=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height));const c={...drag.c},ar=s.aspect?s.aspect*o.img.naturalHeight/o.img.naturalWidth:0;
 if(drag.mode==="move"){c.x=Math.min(1-c.w,Math.max(0,c.x+px-drag.sx));c.y=Math.min(1-c.h,Math.max(0,c.y+py-drag.sy))}
 else{let x0=c.x,y0=c.y,x1=c.x+c.w,y1=c.y+c.h;if(drag.mode.includes("w"))x0=px;else x1=px;if(drag.mode.includes("n"))y0=py;else y1=py;
  let w=Math.abs(x1-x0),h=Math.abs(y1-y0);if(ar){if(w/h>ar)w=h*ar;else h=w/ar;if(drag.mode.includes("w"))x0=x1-w;else x1=x0+w;if(drag.mode.includes("n"))y0=y1-h;else y1=y0+h}
  c.x=Math.max(0,Math.min(x0,x1));c.y=Math.max(0,Math.min(y0,y1));c.w=Math.min(1-c.x,Math.abs(x1-x0));c.h=Math.min(1-c.y,Math.abs(y1-y0))}
 s.crop=c;showCrop()});
$("#wrap").addEventListener("pointerup",()=>{if(!drag)return;drag=null;const s=S();if(s.crop&&(s.crop.w<.01||s.crop.h<.01))s.crop=null;draw()});

// ---------- UI wiring ----------
$$(".tabs button").forEach(b=>b.onclick=()=>{$$(".tabs button").forEach(x=>x.classList.toggle("on",x===b));$$(".pane").forEach(p=>p.classList.toggle("on",p.id==="p-"+b.dataset.t));draw()});
const mk=(host,items,fn)=>items.forEach(it=>{const b=document.createElement("button");b.className="btn sm ghost";b.textContent=it[0];b.onclick=()=>fn(it,b);$(host).appendChild(b)});
mk("#aspects",ASPECTS,(a,b)=>{$$("#aspects button").forEach(x=>x.classList.toggle("on",x===b));setAspect(a[1])});
mk("#social",SOCIAL,a=>{const s=S();setAspect(a[1]/a[2]);s.rmode="px";s.w=a[1];s.h=a[2];s.lock=false;syncUI();draw();toast(`Cropped to ${a[0]} (${a[1]}×${a[2]})`)});
mk("#sizePresets",SIZES,a=>{const s=S();s.rmode="fit";s.fw=a[1];s.fh=a[1];syncUI();draw()});
mk("#looks",Object.keys(LOOKS).map(k=>[k]),a=>{const s=S();s.adj=Object.assign(def().adj,LOOKS[a[0]]);syncUI();draw()});
$("#sliders").innerHTML=ADJ.map(a=>`<div class="row"><label>${a[1]} <b id="v-${a[0]}"></b></label><input type="range" id="a-${a[0]}" min="${a[2]}" max="${a[3]}" value="${a[4]}"></div>`).join("");
ADJ.forEach(a=>$("#a-"+a[0]).addEventListener("input",e=>{S().adj[a[0]]=+e.target.value;$("#v-"+a[0]).textContent=e.target.value+a[5];draw()}));
const bind=(id,key,cast=v=>v,ev="input")=>$(id).addEventListener(ev,e=>{const s=S();s[key]=e.target.type==="checkbox"?e.target.checked:cast(e.target.value);syncUI();draw()});
bind("#fmt","fmt",v=>v,"change");bind("#q","q",Number);bind("#tOn","tOn",0,"change");bind("#tKB","tKB",Number);bind("#tUnit","tUnit",Number,"change");bind("#bg","bg",0,"change");bind("#pct","pct",Number);bind("#fw","fw",Number);bind("#fh","fh",Number);bind("#lock","lock",0,"change");bind("#str","str",Number);
$("#w").addEventListener("input",e=>{const s=S(),g=geom(imgs[cur],{...s,rmode:"none"});s.w=+e.target.value;if(s.lock)s.h=Math.round(s.w*g.bh/g.bw);syncUI(true);draw()});
$("#h").addEventListener("input",e=>{const s=S(),g=geom(imgs[cur],{...s,rmode:"none"});s.h=+e.target.value;if(s.lock)s.w=Math.round(s.h*g.bw/g.bh);syncUI(true);draw()});
$$("#rmode button").forEach(b=>b.onclick=()=>{const s=S();s.rmode=b.dataset.m;if(s.rmode==="px"&&!s.w){const g=geom(imgs[cur],{...s,rmode:"none"});s.w=Math.round(g.bw);s.h=Math.round(g.bh)}syncUI();draw()});
$("#rl").onclick=()=>{S().rot=(S().rot+270)%360;draw()};$("#rr").onclick=()=>{S().rot=(S().rot+90)%360;draw()};
$("#fh2").onclick=()=>{S().flipH=!S().flipH;draw()};$("#fv").onclick=()=>{S().flipV=!S().flipV;draw()};
$("#cropReset").onclick=()=>{S().crop=null;S().aspect=0;$$("#aspects button").forEach((x,i)=>x.classList.toggle("on",i===0));draw()};
$("#reset").onclick=()=>{imgs[cur].s=def();syncUI();draw();toast("Reset to original")};
$("#applyAll").onclick=()=>{const s=S();imgs.forEach(o=>{if(o!==imgs[cur])o.s=JSON.parse(JSON.stringify(s))});toast(`Settings applied to all ${imgs.length} images`)};
function syncUI(skipWH){const s=S();$("#fmt").value=s.fmt;$("#q").value=s.q;$("#qv").textContent=s.q+"%";$("#qrow").style.opacity=outType(imgs[cur])==="image/png"?.4:1;$("#tOn").checked=s.tOn;$("#tKB").value=s.tKB;$("#tUnit").value=s.tUnit;$("#bg").checked=s.bg;
 $$("#rmode button").forEach(b=>b.classList.toggle("on",b.dataset.m===s.rmode));$("#r-pct").style.display=s.rmode==="pct"?"":"none";$("#r-px").style.display=s.rmode==="px"?"":"none";$("#r-fit").style.display=s.rmode==="fit"?"":"none";
 $("#pct").value=s.pct;$("#pv").textContent=s.pct+"%";if(!skipWH){$("#w").value=s.w||"";$("#h").value=s.h||""}$("#lock").checked=s.lock;$("#fw").value=s.fw;$("#fh").value=s.fh;$("#str").value=s.str;$("#sv").textContent=s.str+"°";
 ADJ.forEach(a=>{$("#a-"+a[0]).value=s.adj[a[0]];$("#v-"+a[0]).textContent=s.adj[a[0]]+a[5]})}

// ---------- download ----------
const extOf=t=>({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"})[t]||"png";
const outName=(o,b)=>(o.name.replace(/\.[^.]+$/,"").replace(/[^\w\- ]+/g,"_").slice(0,80)||"image")+"-pixelsmith."+extOf(b.type);
function save(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
$("#dl").onclick=async()=>{const o=imgs[cur];toast("Preparing…");const b=await exportBlob(o);save(b,outName(o,b));toast("Downloaded "+fmtB(b.size))};
$("#dlAll").onclick=async()=>{const files=[],used={};for(let i=0;i<imgs.length;i++){toast(`Processing ${i+1} of ${imgs.length}…`);const b=await exportBlob(imgs[i]);let n=outName(imgs[i],b);if(used[n])n=n.replace(/(\.\w+)$/,`-${++used[n]}$1`);else used[n]=1;files.push({name:n,data:new Uint8Array(await b.arrayBuffer())})}save(zip(files),"pixelsmith-images.zip");toast(`ZIP ready with ${files.length} images`)};
// minimal store-only ZIP writer
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return d=>{let c=~0;for(let i=0;i<d.length;i++)c=t[(c^d[i])&255]^(c>>>8);return(~c)>>>0}})();
function zip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;for(const f of files){const nm=enc.encode(f.name),crc=CRC(f.data),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,crc,true);h.setUint32(18,f.data.length,true);h.setUint32(22,f.data.length,true);h.setUint16(26,nm.length,true);parts.push(h,nm,f.data);
 const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,crc,true);c.setUint32(20,f.data.length,true);c.setUint32(24,f.data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);cd.push(c,nm);off+=30+nm.length+f.data.length}
 const cdSize=cd.reduce((a,p)=>a+p.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdSize,true);e.setUint32(16,off,true);return new Blob([...parts,...cd,e],{type:"application/zip"})}
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2200)}
window.addEventListener("resize",()=>{if($(".tabs .on")?.dataset.t==="crop"&&cur>=0)showCrop()});

// deep-link a tool tab from intent pages (e.g. /resize-image/)
const START_TAB=document.body.dataset.tool;if(START_TAB){const b=document.querySelector(`.tabs button[data-t="${START_TAB}"]`);if(b)b.click()}
