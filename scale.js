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
function flopsRatioHTML(flops){
  const ratio=flops/GPT3_FLOPS;
  const phrase=ratio>=1
    ? `${ratio.toFixed(ratio>=10?0:1)}× GPT-3's`
    : `${(1/ratio).toFixed(1/ratio>=10?0:1)}× smaller`;
  return `training GPT-3 took ~3.1e23 → this is <b>${phrase}</b>`;
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

function primarySource(model){
  return model.sources.find(source=>source.id===model.primarySourceId)
    || model.sources.find(source=>source.status==="included");
}

function editableDefaults(model){
  const source=primarySource(model),q=source.quantity||{},v=source.visual||{},c=source.control||{};
  const hours=+q.hours||0;
  const eplen=+c.sequenceSeconds||(hours&&q.sequences?hours*3600/(+q.sequences):60);
  const defaults={
    params:model.params,paramUnit:model.paramUnit,
    res:v.resolution,patch:v.patch,views:v.views,
    state:c.state||0,action:c.action||0,lang:c.languagePerSequence||0,
    fps:c.fps||0,novelty:model.novelty,eplen,
    episodes:q.sequences||Math.max(1,Math.round(hours*3600/eplen)),
    hours,epochs:model.epochs,countEveryStep:model.countEveryStep!==false
  };
  Object.keys(defaults).forEach(key=>{
    if(model[key]!=null) defaults[key]=model[key];
  });
  return defaults;
}

function applyPrimaryOverrides(model,vals){
  const next=Object.assign({},model,{
    novelty:+vals.novelty,epochs:+vals.epochs,
    countEveryStep:vals.countEveryStep
  });
  if(!Array.isArray(model.sources)) return next;
  const sources=model.sources.map(source=>Object.assign({},source));
  const index=sources.findIndex(source=>source.id===model.primarySourceId);
  if(index<0){next.sources=sources;return next;}

  const primary=sources[index];
  const quantity=Object.assign({},primary.quantity);
  const visual=Object.assign({},primary.visual,{
    resolution:+vals.res,patch:+vals.patch,views:+vals.views
  });
  const control=Object.assign({},primary.control,{
    fps:+vals.fps,state:+vals.state,action:+vals.action,
    languagePerSequence:+vals.lang,sequenceSeconds:+vals.eplen
  });
  quantity.sequences=+vals.episodes;
  if(+vals.hours>0){
    quantity.hours=+vals.hours;
    delete quantity.frames;
  }else{
    delete quantity.hours;
    quantity.frames=(+vals.episodes)*(+vals.eplen)*(+vals.fps);
  }
  sources[index]=Object.assign({},primary,{quantity,visual,control});
  next.sources=sources;
  return next;
}

function sourceTokens(source,novelty,countEveryStep){
  if(source.status!=="included"){
    return Object.assign({},source,{
      included:false,frames:0,sequences:0,totalSeconds:0,
      visualTokensPerFrame:0,naiveVisual:0,effVisual:0,
      stateActionTokens:0,languageTokens:0,naive:0,eff:0,math:[]
    });
  }

  const q=source.quantity||{},v=source.visual||{},c=source.control||{};
  const fps=+c.fps||0,nov=Number.isFinite(novelty)?novelty:0.05;
  const frames=q.frames!=null ? +q.frames
    : q.clips!=null ? (+q.clips)*(+q.framesPerClip||1)
    : (+q.hours||0)*3600*fps;
  const totalSeconds=q.hours!=null ? (+q.hours)*3600 : (fps?frames/fps:0);
  const sequences=q.sequences!=null ? +q.sequences
    : q.clips!=null ? +q.clips
    : c.sequenceSeconds&&totalSeconds ? Math.max(1,Math.round(totalSeconds/(+c.sequenceSeconds)))
    : Math.min(frames,1);
  const grid=Math.ceil(((+v.resolution||0)/(+v.patch||1))/(+v.pooling||1));
  const visualTokensPerFrame=grid*grid*(+v.views||0);
  const boundedSequences=Math.min(frames,sequences);
  const effectiveFrames=boundedSequences+(frames-boundedSequences)*nov;
  const naiveVisual=frames*visualTokensPerFrame;
  const effVisual=effectiveFrames*visualTokensPerFrame;
  const stateActionPerFrame=(+c.state||0)+(+c.action||0);
  const naiveSA=frames*stateActionPerFrame;
  const effSA=countEveryStep===false ? effectiveFrames*stateActionPerFrame : naiveSA;
  const languageTokens=sequences*(+c.languagePerSequence||0);
  const frameMath=q.frames!=null
    ? `${q.frames.toLocaleString()} disclosed frames`
    : q.clips!=null
      ? `${q.clips.toLocaleString()} clips × ${q.framesPerClip} frames = ${frames.toLocaleString()} frames`
      : `${q.hours.toLocaleString()} h × 3,600 × ${fps} FPS = ${frames.toLocaleString()} frames`;
  const visualMath=`ceil((${v.resolution} ÷ ${v.patch}) ÷ ${v.pooling||1})² × ${v.views} views = ${visualTokensPerFrame.toLocaleString()} visual tokens/frame`;

  return Object.assign({},source,{
    included:true,frames,sequences,totalSeconds,effectiveFrames,
    visualTokensPerFrame,naiveVisual,effVisual,
    stateActionTokens:effSA,languageTokens,
    naive:naiveVisual+naiveSA+languageTokens,
    eff:effVisual+effSA+languageTokens,
    math:[frameMath,visualMath,
      `${sequences.toLocaleString()} sequences + later frames × ${(nov*100).toFixed(0)}% novelty`]
  });
}

// Aggregate the heterogeneous, audited sources for one model.
function tokensFrom(m){
  if(!Array.isArray(m.sources)) throw new TypeError("tokensFrom requires audited sources");
  const nov=(+m.novelty)/100;
  const sources=m.sources.map(source=>sourceTokens(source,nov,m.countEveryStep));
  const included=sources.filter(source=>source.included);
  const sum=key=>included.reduce((total,source)=>total+source[key],0);
  const frames=sum("frames"),eff=sum("eff"),naive=sum("naive");
  const N=(+m.params)*(m.paramUnit==="1e6"?1e6:1e9);
  const epochs=+m.epochs||1;
  return {
    N,naive,eff,flopsEff:6*N*eff*epochs,
    visPerFrame:frames?included.reduce((total,source)=>
      total+source.visualTokensPerFrame*source.frames,0)/frames:0,
    totalSeconds:sum("totalSeconds"),totFrames:frames,numEp:sum("sequences"),nov,
    sources,
    excludedSources:sources.filter(source=>source.status==="excluded"),
    contextSources:sources.filter(source=>source.status==="context"),
    estimateKind:m.estimateKind||"estimate"
  };
}

function escapeHTML(value){
  return String(value==null?"":value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

function evidenceHTML(items){
  return (items||[]).map(item=>{
    const citation=`<cite><span class="fact-tag">${escapeHTML(item.kind)}</span> `+
      `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.location)}</a></cite>`;
    if(item.quote) return `<blockquote><p>“${escapeHTML(item.quote)}”</p>${citation}</blockquote>`;
    return `<div class="evidence"><p>${escapeHTML(item.statement)}</p>${citation}</div>`;
  }).join("");
}

function auditHTML(model,result){
  const parameter=model.parameterEvidence;
  const cards=result.sources.map(source=>{
    const status=source.included
      ? `<span class="audit-status included">Included · ${escapeHTML(source.estimateKind||"estimate")}</span>`
      : source.status==="context"
        ? `<span class="audit-status context">Context only</span>`
        : `<span class="audit-status excluded">Excluded from total</span>`;
    const contribution=source.included
      ? `<p class="contribution"><b>${fmt(source.eff)}</b> effective · ${fmt(source.naive)} naive tokens</p>`
      : `<p class="exclusion">${escapeHTML(source.exclusionReason)}</p>`;
    const math=source.included&&source.math.length
      ? `<div class="audit-math"><b>Conversion</b><ol>${source.math.map(line=>`<li><code>${escapeHTML(line)}</code></li>`).join("")}</ol></div>`:"";
    const assumptions=source.assumptions&&source.assumptions.length
      ? `<div class="assumptions"><b>Assumptions</b><ul>${source.assumptions.map(line=>`<li>${escapeHTML(line)}</li>`).join("")}</ul></div>`:"";
    return `<article class="audit-card"><div class="audit-card-head"><h3>${escapeHTML(source.label)}</h3>${status}</div>`+
      contribution+evidenceHTML(source.evidence)+math+assumptions+`</article>`;
  }).join("");
  const parameterBlock=parameter
    ? `<div class="parameter-source"><b>Parameter count</b>${evidenceHTML([parameter])}</div>`:"";
  return `<section class="audit" aria-labelledby="auditTitle">`+
    `<div class="audit-title"><div><h2 id="auditTitle">Sources and conversion audit</h2>`+
    `<p>Included sources contribute to totals; excluded and contextual sources stay visible.</p></div>`+
    `<a href="${escapeHTML(model.auditDoc)}">Full audit document →</a></div>`+
    `<p class="audit-summary"><b>${escapeHTML(result.estimateKind)}</b> · `+
    `${result.sources.filter(source=>source.included).length} quantified sources · `+
    `${result.excludedSources.length} exclusions</p>`+
    parameterBlock+`<div class="audit-grid">${cards}</div></section>`;
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

const ROBOT_POINT={radius:7,effective:"#0d9488",naive:"#3b5bbf"};
function robotPointSVG(n,d,color,label,dy){
  return pointSVG(n,d,color,ROBOT_POINT.radius,label,dy);
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
