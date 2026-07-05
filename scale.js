// Shared math + plotting for Scale Estimator (used by both index.html and model.html).

const PLOT={W:900,H:460,pL:72,pR:30,pT:30,pB:54,XMIN:9,XMAX:11.5,YMIN:9,YMAX:12.7};
const xm=n=>PLOT.pL+(Math.log10(n)-PLOT.XMIN)/(PLOT.XMAX-PLOT.XMIN)*(PLOT.W-PLOT.pL-PLOT.pR);
const ym=d=>PLOT.H-PLOT.pB-(Math.log10(d)-PLOT.YMIN)/(PLOT.YMAX-PLOT.YMIN)*(PLOT.H-PLOT.pT-PLOT.pB);
const xInv=px=>Math.pow(10,PLOT.XMIN+(px-PLOT.pL)/(PLOT.W-PLOT.pL-PLOT.pR)*(PLOT.XMAX-PLOT.XMIN));
const yInv=py=>Math.pow(10,PLOT.YMIN+(PLOT.H-PLOT.pB-py)/(PLOT.H-PLOT.pT-PLOT.pB)*(PLOT.YMAX-PLOT.YMIN));

const GPT3_TOKENS=300e9, GPT3_FLOPS=3.14e23;

function fmt(n){
  if(n>=1e12) return (n/1e12).toFixed(n>=1e13?0:2)+"T";
  if(n>=1e9)  return (n/1e9 ).toFixed(n>=1e10?0:1)+"B";
  if(n>=1e6)  return (n/1e6 ).toFixed(n>=1e7?0:1)+"M";
  if(n>=1e3)  return (n/1e3 ).toFixed(1)+"K";
  return Math.round(n).toString();
}
function ratio(x,ref){
  if(x>=ref) return `<b>${(x/ref).toFixed(x/ref>=10?0:1)}×</b> GPT-3`;
  return `<b>${(ref/x).toFixed(ref/x>=10?0:1)}×</b> smaller than GPT-3`;
}

// Session edits: overrides live in sessionStorage so changes persist across the
// overview/detail pages within a tab, but reset on close. data.js stays permanent.
function getModelVals(name){
  const base=(typeof MODELS!=="undefined"&&MODELS[name])||{};
  try{const o=JSON.parse(sessionStorage.getItem("scale-edits:"+name)); if(o) return Object.assign({},base,o);}catch(e){}
  return base;
}
function saveModelVals(name,vals){ try{sessionStorage.setItem("scale-edits:"+name,JSON.stringify(vals));}catch(e){} }
function clearModelVals(name){ try{sessionStorage.removeItem("scale-edits:"+name);}catch(e){} }

// A model config (units match the on-screen controls) → token & compute numbers.
function tokensFrom(m){
  const res=+m.res,patch=+m.patch,views=+m.views;
  const state=+m.state,action=+m.action,lang=+m.lang;
  const fps=+m.fps,nov=(+m.novelty)/100,actNovel=m.countEveryStep!==false;
  const eplen=+m.eplen,eps=+m.episodes,hoursOverride=+m.hours,epochs=+m.epochs;
  const N=(+m.params)*(m.paramUnit==="1e6"?1e6:1e9);

  const patches=Math.pow(Math.floor(res/patch),2);
  const visPerFrame=patches*views;
  const totalSeconds=hoursOverride>0?hoursOverride*3600:eplen*eps;
  const totFrames=Math.round(totalSeconds*fps);
  const numEp=hoursOverride>0?Math.max(1,Math.round(totalSeconds/eplen)):eps;

  const naiveVis=visPerFrame*totFrames;
  const effVis=visPerFrame*(numEp+(totFrames-numEp)*nov);
  const sa=state+action;
  const naiveSA=sa*totFrames;
  const effSA=actNovel?naiveSA:sa*(numEp+(totFrames-numEp)*nov);
  const langTot=lang*numEp;

  const naive=naiveVis+naiveSA+langTot, eff=effVis+effSA+langTot;
  const flopsEff=6*N*eff*epochs;
  return {N,naive,eff,flopsEff,visPerFrame,totalSeconds,totFrames,numEp,nov};
}

// LLM reference points
const LANDMARKS=[
  {name:"GPT-2",     n:1.5e9, d:10e9,  c:"#9aa4b2", r:5, dy:-12},
  {name:"GPT-3",     n:175e9, d:300e9, c:"#d97706", r:6, dy:-12},
  {name:"Chinchilla",n:70e9,  d:1.4e12,c:"#9aa4b2", r:5, dy:20},
  {name:"Llama 2",   n:70e9,  d:2e12,  c:"#9aa4b2", r:5, dy:-12},
];

function pointSVG(n,d,c,r,label,dy,anch){
  const x=xm(n),y=ym(d);
  let s=`<circle cx=${x} cy=${y} r=${r} fill="${c}" stroke="#fff" stroke-width="2"/>`;
  if(label) s+=`<text x=${x} y=${y+dy} fill="${c}" font-size="12" font-weight="600" text-anchor="${anch||"middle"}">${label}</text>`;
  return s;
}

// Grid, axes, Chinchilla line, and the LLM reference points. Caller adds robot points on top.
function plotScaffold(){
  const {W,H,pL,pR,pT,pB}=PLOT;
  let s="";
  const xticks=[[1e9,"1B"],[1e10,"10B"],[1e11,"100B"]];
  const yticks=[[1e9,"1B"],[1e10,"10B"],[1e11,"100B"],[1e12,"1T"]];
  xticks.forEach(([v,l])=>{const x=xm(v);
    s+=`<line x1=${x} y1=${pT} x2=${x} y2=${H-pB} stroke="#eceff3"/><text x=${x} y=${H-pB+18} fill="#6b7688" font-size="12" text-anchor="middle">${l}</text>`;});
  yticks.forEach(([v,l])=>{const y=ym(v);
    s+=`<line x1=${pL} y1=${y} x2=${W-pR} y2=${y} stroke="#eceff3"/><text x=${pL-9} y=${y+4} fill="#6b7688" font-size="12" text-anchor="end">${l}</text>`;});
  s+=`<text x=${(pL+W-pR)/2} y=${H-8} fill="#2f3946" font-size="13" text-anchor="middle" font-weight="600">Model size (parameters) →</text>`;
  const my=(pT+H-pB)/2;
  s+=`<text x="18" y=${my} fill="#2f3946" font-size="13" text-anchor="middle" font-weight="600" transform="rotate(-90 18 ${my})">Training tokens →</text>`;
  // Chinchilla-optimal line: D = 20N
  s+=`<line x1=${xm(1e9)} y1=${ym(20e9)} x2=${xm(1.99e11)} y2=${ym(3.98e12)} stroke="#c9a15a" stroke-width="1.5" stroke-dasharray="6,5"/>`;
  s+=`<line x1=${pL} y1="16" x2=${pL+24} y2="16" stroke="#c9a15a" stroke-width="1.5" stroke-dasharray="6,5"/>`;
  s+=`<a href="https://arxiv.org/abs/2203.15556" target="_blank" rel="noopener"><text x=${pL+30} y="20" fill="#b07d1e" font-size="12" text-anchor="start" style="cursor:pointer">Chinchilla-optimal (20 tokens/param)</text></a>`;
  LANDMARKS.forEach(m=>{ s+=pointSVG(m.n,m.d,m.c,m.r,m.name,m.dy); });
  return s;
}
function plotBorder(){const {W,H,pL,pR,pT,pB}=PLOT;
  return `<rect x=${pL} y=${pT} width=${W-pL-pR} height=${H-pT-pB} fill="none" stroke="#dbe0e8"/>`;}
function hoverLines(){
  return `<line id="hx" stroke="#b8bfca" stroke-width="1" stroke-dasharray="3,3" opacity="0"/>`+
         `<line id="hy" stroke="#b8bfca" stroke-width="1" stroke-dasharray="3,3" opacity="0"/>`;}

// Crosshair read-off anywhere in the plot. svg must already contain #hx/#hy lines.
function attachCrosshair(svg,tip){
  const {W,H,pL,pR,pT,pB}=PLOT;
  const g=id=>svg.querySelector("#"+id);
  function hide(){tip.style.opacity="0";["hx","hy"].forEach(i=>{const e=g(i);if(e)e.setAttribute("opacity","0");});}
  svg.addEventListener("mousemove",e=>{
    const rect=svg.getBoundingClientRect();
    const sx=(e.clientX-rect.left)/rect.width*W, sy=(e.clientY-rect.top)/rect.height*H;
    if(sx<pL||sx>W-pR||sy<pT||sy>H-pB){hide();return;}
    const N=xInv(sx), D=yInv(sy), r=D/(20*N);
    const hx=g("hx"),hy=g("hy");
    if(hx){hx.setAttribute("x1",pL);hx.setAttribute("x2",W-pR);hx.setAttribute("y1",sy);hx.setAttribute("y2",sy);hx.setAttribute("opacity","1");}
    if(hy){hy.setAttribute("y1",pT);hy.setAttribute("y2",H-pB);hy.setAttribute("x1",sx);hy.setAttribute("x2",sx);hy.setAttribute("opacity","1");}
    const starved = Math.abs(r-1)<0.05 ? "Chinchilla-balanced for this size"
      : r<1 ? `${(1/r).toFixed(1/r>=10?0:1)}× too few tokens for this size`
      : `${r.toFixed(r>=10?0:1)}× more tokens than needed`;
    tip.style.opacity="1";
    tip.style.left=(sx/W*rect.width)+"px";
    tip.style.top=(sy/H*rect.height)+"px";
    tip.innerHTML=`${fmt(N)} params &middot; ${fmt(D)} tokens<br><span style="color:#e0a34d">${starved}</span>`;
  });
  svg.addEventListener("mouseleave",hide);
}
