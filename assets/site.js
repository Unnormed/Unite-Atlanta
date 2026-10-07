/* UNITE ATLANTA · site.js · concept v5 (Vercel) */
(function(){
const D = window.UA_DATA;
const $ = s => document.querySelector(s);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---- store: demo persistence in this browser ---- */
const KEY = "ua-store-v1";
function loadStore(){
  try{ return Object.assign({submissions:[],handled:{},approvedEvents:[],subscribers:[],rsvps:{},speaksStatus:{},settings:{},customPosts:[],hiddenEvents:[],pitches:[],rejectReasons:{},owners:{}}, JSON.parse(localStorage.getItem(KEY)||"{}")); }
  catch(e){ return {submissions:[],handled:{},approvedEvents:[],subscribers:[],rsvps:{},speaksStatus:{},settings:{},customPosts:[],hiddenEvents:[],pitches:[],rejectReasons:{},owners:{}}; }
}
function saveStore(st){ try{ localStorage.setItem(KEY, JSON.stringify(st)); }catch(e){} }
let ST = loadStore();
window.UA_STORE = { load: loadStore, save: saveStore };

const SETTINGS = () => Object.assign({}, D.settings, ST.settings);
const EVENTS = () => D.events.filter(e=>!(ST.hiddenEvents||[]).includes(e.id)).concat(ST.approvedEvents);
const RSVPS = id => (Array.isArray(ST.rsvps[id]) ? ST.rsvps[id].length : 0);

const TYPES = {
  mixer:{label:"Mixer",bg:"#D7F204",fg:"#0D0D0D"},
  panel:{label:"Panel",bg:"#858AE3",fg:"#0D0D0D"},
  listening:{label:"Listening",bg:"#613DC1",fg:"#F2EFE9"},
  performance:{label:"Performance",bg:"#FF4A1C",fg:"#0D0D0D"},
  civic:{label:"Civic",bg:"#F2EFE9",fg:"#0D0D0D"},
  legacy:{label:"Legacy",bg:"#FF9F1C",fg:"#0D0D0D"},
  other:{label:"Other",bg:"#CFC9BD",fg:"#0D0D0D"}
};
const MONTHS = [[2026,8],[2026,9],[2026,10]];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const DAYS_S = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
const DAYS_L = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
let curMonth = 0, curFilter = "all", plusActive = false;

(function(){ const t = new Date(); const i = MONTHS.findIndex(([y,m])=>y===t.getFullYear()&&m===t.getMonth()); if(i>=0) curMonth = i; })();
function evDate(e){ return new Date(e.d+"T00:00:00"); }
function evById(id){ return EVENTS().find(e=>e.id===id); }
function monthEvents(mi){ const [y,m]=MONTHS[mi]; return EVENTS().filter(e=>{const dt=evDate(e);return dt.getFullYear()===y&&dt.getMonth()===m;}); }
function filtered(list){ return curFilter==="all"?list:list.filter(e=>e.type===curFilter); }
function tOf(e){ return TYPES[e.type]||TYPES.other; }
function css(e){ const c=tOf(e); return `--pc:${c.bg};--fc:${c.fg}`; }

/* ---- hero ---- */
const now = new Date();
$("#todayStamp").textContent = DAYS_S[now.getDay()]+" "+String(now.getDate()).padStart(2,"0")+"."+String(now.getMonth()+1).padStart(2,"0")+"."+now.getFullYear();
function renderNextUp(){
  const today0 = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const upcoming = EVENTS().filter(e=>evDate(e)>=today0).sort((a,b)=>a.d.localeCompare(b.d)).slice(0,3);
  $("#nextUpRows").innerHTML = upcoming.map(e=>{
    const dt = evDate(e), c = tOf(e);
    return `<button class="nu-row" onclick="openEvent('${e.id}')">
      <span class="nu-date" style="background:${c.bg};color:${c.fg}">${String(dt.getDate()).padStart(2,"0")}<small>${MONTH_SHORT[dt.getMonth()]}</small></span>
      <span class="nu-t">${esc(e.title)}<small>${e.tier==="plus"&&!plusActive?"Behind the code":esc(e.venue)} · ${c.label}${e.tier==="plus"?" · PLUS":""}</small></span>
      <span class="nu-go">→</span>
    </button>`;
  }).join("");
  const se = $("#statEvents"); if(se) se.textContent = EVENTS().length;
}

/* ---- calendar ---- */
function renderLegend(){
  $("#legendBar").innerHTML = Object.values(TYPES).map(c=>`<span class="lg" style="--pc:${c.bg};color:${c.fg}">${c.label}</span>`).join("")
    + `<span class="lg plus-lg">■ Plus = code required</span>`;
}
function renderTabs(){
  $("#monthTabs").innerHTML = MONTHS.map(([y,m],i)=>`<button class="${i===curMonth?"on":""}" data-i="${i}">${MONTH_NAMES[m]} ${String(y).slice(2)}</button>`).join("");
  document.querySelectorAll("#monthTabs button").forEach(b=>b.addEventListener("click",()=>{curMonth=+b.dataset.i;renderCal();}));
}
function renderFilters(){
  const list = monthEvents(curMonth);
  let html = `<button class="chip ${curFilter==="all"?"on":""}" data-f="all">All <span class="cnt">${list.length}</span></button>`;
  for(const k in TYPES){
    const n = list.filter(e=>e.type===k).length;
    if(k==="other" && n===0) continue;
    html += `<button class="chip ${curFilter===k?"on":""}" data-f="${k}"><span class="sw" style="--pc:${TYPES[k].bg}"></span>${TYPES[k].label} <span class="cnt">${n}</span></button>`;
  }
  $("#filterBar").innerHTML = html;
  document.querySelectorAll("#filterBar .chip").forEach(c=>c.addEventListener("click",()=>{curFilter=c.dataset.f;renderCal();}));
}
function shortTitle(t){ return t.length>44 ? t.slice(0,42).trim()+"…" : t; }
function renderGrid(){
  const [y,m] = MONTHS[curMonth];
  const list = filtered(monthEvents(curMonth));
  const offset = (new Date(y,m,1).getDay()+6)%7;
  const dim = new Date(y,m+1,0).getDate();
  const prevDim = new Date(y,m,0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const cells = Math.ceil((offset+dim)/7)*7;
  let html = "";
  for(let i=0;i<cells;i++){
    const dayN = i-offset+1;
    if(dayN<1){ html+=`<div class="day out"><span class="dnum">${prevDim+dayN}</span></div>`; continue; }
    if(dayN>dim){ html+=`<div class="day out"><span class="dnum">${dayN-dim}</span></div>`; continue; }
    const isToday = new Date(y,m,dayN).getTime()===today.getTime();
    const evs = list.filter(e=>evDate(e).getDate()===dayN);
    let evHtml = "";
    evs.forEach(e=>{
      const locked = e.tier==="plus";
      evHtml += `<button class="evt ${locked?"locked":""}" style="${locked?"":css(e)}" onclick="openEvent('${e.id}')">
        <span class="t">${e.t}${locked?" · PLUS ■":""}</span>${esc(shortTitle(e.title))}</button>`;
    });
    html += `<div class="day ${isToday?"today":""}"><span class="dnum">${String(dayN).padStart(2,"0")}</span>${evHtml}</div>`;
  }
  $("#calGrid").innerHTML = html;
}
function renderList(){
  const list = filtered(monthEvents(curMonth)).slice().sort((a,b)=>(a.d+a.t).localeCompare(b.d+b.t));
  $("#calList").innerHTML = list.map(e=>{
    const dt = evDate(e), c = tOf(e);
    return `<button class="lrow" onclick="openEvent('${e.id}')">
      <span class="sw" style="--pc:${c.bg}"></span>
      <span class="ld">${DAYS_S[dt.getDay()]} ${String(dt.getDate()).padStart(2,"0")} · ${e.t}</span>
      <span class="lt">${esc(e.title)}<small>${e.tier==="plus"&&!plusActive?"Address behind the code":esc(e.venue)}</small></span>
      <span class="cat" style="${css(e)}">${c.label}</span>
      <span class="pill ${e.tier==="plus"?"plus":""}">${e.tier==="plus"?"Plus ■":"Open"}</span>
    </button>`;
  }).join("");
  $("#calEmpty").style.display = list.length?"none":"block";
}
function renderCal(){ renderTabs(); renderFilters(); renderGrid(); renderList(); }
$("#vGrid").addEventListener("click",()=>{$("#calShell").className="cal-shell grid-mode rv on";$("#vGrid").classList.add("on");$("#vList").classList.remove("on");});
$("#vList").addEventListener("click",()=>{$("#calShell").className="cal-shell list-mode rv on";$("#vList").classList.add("on");$("#vGrid").classList.remove("on");});

/* ---- back room ---- */
function renderBackroom(){
  const plusEvents = EVENTS().filter(e=>e.tier==="plus").sort((a,b)=>a.d.localeCompare(b.d));
  $("#brEvents").innerHTML = plusEvents.map(e=>{
    const dt = evDate(e);
    return `<div class="br-evt">
      <span class="bd">${String(dt.getDate()).padStart(2,"0")}<small>${MONTH_SHORT[dt.getMonth()]}</small></span>
      <span class="bt">${esc(e.title)}<small>${esc(e.venue)} · ${e.t} ET${RSVPS(e.id)?` · ${RSVPS(e.id)} on the list`:""}</small></span>
      <button class="rsvp-btn" onclick="openEvent('${e.id}')">RSVP</button>
    </div>`;
  }).join("") || `<div class="br-evt"><span class="bt" style="padding:16px">Nothing scheduled behind the code right now.</span></div>`;
  $("#brRotates").textContent = SETTINGS().codeRotates;
}


/* ---- speaks ---- */
let speaksPage = 0;
window.speaksNav = function(d){ speaksPage += d; renderSpeaks(); };
function renderSpeaks(){
  const builtIn = D.speaks.filter(p => (ST.speaksStatus[p.id]||p.status) === "published").map(p=>({p, href:"/speaks/"+p.slug}));
  const custom = (ST.customPosts||[]).filter(p=>p.status==="published").map(p=>({p, href:"/speaks/post?id="+p.id}));
  const all = custom.concat(builtIn);
  const pages = Math.max(1, Math.ceil(all.length/3));
  if(speaksPage >= pages) speaksPage = pages-1;
  if(speaksPage < 0) speaksPage = 0;
  const pubs = all.slice(speaksPage*3, speaksPage*3+3);
  const pager = $("#speaksPager");
  if(pager){
    if(pages > 1){
      pager.style.display = "flex";
      pager.innerHTML = `<button onclick="speaksNav(-1)" ${speaksPage===0?"disabled":""} aria-label="Previous voices">←</button>
        <span class="pg">${String(speaksPage+1).padStart(2,"0")} / ${String(pages).padStart(2,"0")}</span>
        <button onclick="speaksNav(1)" ${speaksPage===pages-1?"disabled":""} aria-label="Next voices">→</button>`;
    } else { pager.style.display = "none"; }
  }
  $("#voicesWrap").innerHTML = pubs.map(({p, href})=>`<div class="voice">
      ${p.img?`<a class="vph" href="${href}"><img src="${p.img}" alt="Portrait for ${esc(p.name)}"></a>`:`<a class="vph vph-txt" href="${href}"><span>${esc(String(p.name||"UA").split(" ").map(w=>w[0]||"").join("").slice(0,3).toUpperCase())}</span></a>`}
      <a class="vq" href="${href}">
        <span class="vkind">${esc(p.kind||"Opinion")} · ${p.source==="community"?"Community pitch":"Commissioned"}</span>
        <p>&ldquo;${esc(p.quote)}&rdquo;</p>
        <cite>${esc(p.name)} · ${esc(p.role)}</cite>
        <span class="rm">Read more ↗</span>
      </a>
    </div>`).join("");
}

/* ---- how it runs (proposal v1, from data.js) ---- */
function renderHow(){
  const O = D.ops; if(!O) return;
  const owners = ST.owners || {};
  const critHtml = O.criteria.map(c=>`<li><strong>${esc(c.label)}</strong><span>${esc(c.hint)}</span></li>`).join("");
  const hs = $("#howSteps"); if(hs) hs.innerHTML = O.steps.map(x=>`<div class="how-step"><span class="hn">${esc(x.n)}</span><h4>${esc(x.t)}</h4><p>${esc(x.d)}</p></div>`).join("");
  const hc = $("#howCriteria"); if(hc) hc.innerHTML = critHtml;
  const sc = $("#submitCriteria"); if(sc) sc.innerHTML = O.criteria.map(c=>`<li>${esc(c.label)}</li>`).join("");
  const hp = $("#howPolicy"); if(hp) hp.innerHTML = O.speaksPolicy.map(x=>`<li><strong>${esc(x.t)}</strong><span>${esc(x.d)}</span></li>`).join("");
  const hr = $("#howRoles"); if(hr) hr.innerHTML = O.roles.map(r=>{
    const who = String(owners[r.id]||"").trim();
    return `<div class="role">
      <span class="role-load">${esc(r.load)}</span>
      <h4>${esc(r.title)}</h4>
      <p>${esc(r.does)}</p>
      <span class="role-owner ${who?"set":""}">${who?"Owner: "+esc(who):"Owner: to be decided"}</span>
    </div>`;
  }).join("");
}

/* ---- event modal ---- */
window.openEvent = function(id){
  const e = evById(id); if(!e) return;
  const dt = evDate(e), c = tOf(e);
  const locked = e.tier==="plus" && !plusActive;
  $("#eventModalBody").innerHTML = `
    <p class="m-cat"><span style="${css(e)}">${c.label}</span>${e.tier==="plus"?`<span class="plus-tag">Plus ■ code required</span>`:`<span>Open to the city</span>`}</p>
    <h3>${esc(e.title)}</h3>
    ${e.img?`<div class="m-img"><img src="${e.img}" alt=""></div>`:""}
    <div class="m-meta">
      <div><span>Date</span><span>${DAYS_L[dt.getDay()]} ${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}</span></div>
      <div><span>Time</span><span>${e.t} ET</span></div>
      <div><span>Venue</span><span>${locked?"Revealed to code holders":esc(e.venue)}</span></div>
      ${e.social?`<div><span>Social</span><span><a href="${esc(e.social)}" target="_blank" rel="noopener" style="text-decoration:underline">${esc(e.social)}</a></span></div>`:""}
    </div>
    <p class="m-desc">${esc(e.desc)}</p>
    ${locked
      ? `<div class="m-lockbox"><p>This room is behind the code</p><button class="btn-lime" onclick="closeModal('eventModal');document.getElementById('plus').scrollIntoView({behavior:'smooth'})">I have the code ↗</button></div>`
      : `<div style="margin-top:22px"><button class="btn-ink" onclick="startRsvp('${e.id}')">RSVP ↗</button></div>`}
  `;
  openModal("eventModal");
};
function ticketCode(){ return "UA-" + Math.random().toString(36).slice(2,6).toUpperCase(); }
function icsFor(e){
  const [h,m] = e.t.split(":").map(Number);
  const st = new Date(e.d+"T00:00:00"); st.setHours(h,m);
  const en = new Date(st.getTime()+2*3600*1000);
  const f = d => d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+"T"+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+"00";
  const body = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Unite Atlanta//EN","BEGIN:VEVENT","UID:"+e.id+"@unite-atlanta","DTSTAMP:"+f(new Date()),"DTSTART:"+f(st),"DTEND:"+f(en),"SUMMARY:"+e.title.replace(/,/g,"\\,"),"LOCATION:"+String(e.venue||"").replace(/,/g,"\\,"),"END:VEVENT","END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(body);
}
window.startRsvp = function(id){
  const e = evById(id); if(!e) return;
  const c = tOf(e);
  $("#eventModalBody").innerHTML = `
    <p class="m-cat"><span style="${css(e)}">${c.label}</span><span>RSVP</span></p>
    <h3>${esc(e.title)}</h3>
    <p class="m-desc">Leave your name and email. Your ticket appears right here. Show it at the door.</p>
    <form id="rsvpForm">
      <div class="row">
        <label>Your name<input required name="name"></label>
        <label>Email<input required type="email" name="email"></label>
      </div>
      <button class="btn-ink" type="submit">Confirm RSVP ↗</button>
    </form>`;
  $("#rsvpForm").addEventListener("submit",ev=>{
    ev.preventDefault();
    const f = new FormData(ev.target);
    const entry = { name:String(f.get("name")), email:String(f.get("email")), code:ticketCode(), ts:new Date().toISOString().slice(0,10) };
    if(!Array.isArray(ST.rsvps[id])) ST.rsvps[id] = [];
    ST.rsvps[id].push(entry); saveStore(ST);
    showTicket(e, entry);
    renderBackroom();
  });
};
function mailtoTicket(e, entry){
  const dt = evDate(e);
  const subject = "Your Unite Atlanta ticket · " + e.title;
  const body = ["You're on the list.","","Ticket: "+entry.code,"Name: "+entry.name,"Event: "+e.title,"Date: "+DAYS_L[dt.getDay()]+" "+MONTH_NAMES[dt.getMonth()]+" "+dt.getDate()+", "+dt.getFullYear(),"Time: "+e.t+" ET","Venue: "+e.venue,"","Show this ticket at the door.","unite-atlanta.vercel.app"].join("\n");
  return "mailto:"+encodeURIComponent(entry.email)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
}
function showTicket(e, entry){
  const dt = evDate(e), c = tOf(e);
  $("#eventModalBody").innerHTML = `
    <p class="m-cat"><span style="${css(e)}">${c.label}</span><span class="plus-tag">Confirmed ✓</span></p>
    <div class="ticket">
      <div class="tk-top">
        <div><span class="tk-l">Admit one</span><div class="tk-name">${esc(entry.name)}</div></div>
        <div class="tk-code">${entry.code}</div>
      </div>
      <h3 style="margin:14px 0 4px">${esc(e.title)}</h3>
      <div class="m-meta">
        <div><span>Date</span><span>${DAYS_L[dt.getDay()]} ${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}</span></div>
        <div><span>Time</span><span>${e.t} ET</span></div>
        <div><span>Venue</span><span>${esc(e.venue)}</span></div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn-lime" href="${icsFor(e)}" download="${e.id}-unite-atlanta.ics">Add to calendar</a>
        <a class="btn-ink" href="${mailtoTicket(e, entry)}">Email my ticket</a>
        <button class="btn-ink" onclick="closeModal('eventModal')">Done</button>
      </div>
      <p class="m-desc" style="margin-top:14px;opacity:.6">Screenshot this or show it at the door. Demo build: your ticket is stored in this browser, no confirmation email is sent yet.</p>
    </div>`;
}

/* ---- modals ---- */
window.openModal = function(id){ document.getElementById(id).classList.add("open"); document.body.style.overflow="hidden"; };
window.closeModal = function(id){ document.getElementById(id).classList.remove("open"); document.body.style.overflow=""; };
document.querySelectorAll(".modal-bg").forEach(bg=>bg.addEventListener("click",ev=>{ if(ev.target===bg) closeModal(bg.id); }));
document.addEventListener("keydown",ev=>{ if(ev.key==="Escape") document.querySelectorAll(".modal-bg.open").forEach(m=>closeModal(m.id)); });

/* ---- plus ---- */
function activatePlus(){
  plusActive = true;
  document.body.classList.add("plus-active");
  try{ localStorage.setItem("ua-plus","1"); }catch(e){}
  renderNextUp(); renderCal(); renderBackroom();
}
$("#codeForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const v = $("#codeInput").value.trim().toUpperCase(), msg = $("#codeMsg");
  if(v===SETTINGS().plusCode.toUpperCase()){
    activatePlus();
    msg.textContent = "Welcome to the room. The Back Room is open.";
    msg.className = "code-msg ok";
    setTimeout(()=>{ document.getElementById("backroom").scrollIntoView({behavior:"smooth"}); }, 500);
  } else {
    msg.textContent = "That's not it. Ask the one who invited you.";
    msg.className = "code-msg err";
    $("#codeInput").value = "";
  }
});
try{ if(localStorage.getItem("ua-plus")==="1") activatePlus(); }catch(e){}

/* ---- submit ---- */
let uploadDataUri = null;
$("#subImg").addEventListener("change",ev=>{
  const f = ev.target.files && ev.target.files[0]; if(!f) return;
  const img = new Image();
  img.onload = () => {
    const maxW = 1200, scale = Math.min(1, maxW/img.width);
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width*scale); cv.height = Math.round(img.height*scale);
    cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
    uploadDataUri = cv.toDataURL("image/jpeg",.72);
    $("#upPreviewImg").src = uploadDataUri;
    $("#upPreview").style.display = "block";
  };
  img.src = URL.createObjectURL(f);
});
$("#submitForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const f = new FormData($("#submitForm"));
  ST.submissions.push({
    id:"s"+Date.now(), status:"pending", sample:false,
    name:f.get("name"), email:f.get("email"), org:f.get("org")||"", title:f.get("title"),
    d:f.get("date"), t:f.get("time"), venue:f.get("venue"),
    type:f.get("type"), tier:f.get("tier"), social:f.get("social")||null,
    img:uploadDataUri, desc:f.get("desc")||""
  });
  saveStore(ST);
  $("#submitForm").style.display="none";
  $("#submitDone").style.display="block";
  $("#submitDoneNote").textContent = "Filed with the calendar editor. Reviewed against the listing criteria within 48 hours.";
});
(function(){ const sd = $("#subDate"); if(sd) sd.min = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0"); })();

/* ---- pitch a piece ---- */
$("#pitchForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const f = new FormData($("#pitchForm"));
  ST.pitches = ST.pitches || [];
  ST.pitches.push({
    id:"t"+Date.now(), status:"pending", sample:false,
    name:String(f.get("name")), email:String(f.get("email")), role:String(f.get("role")),
    kind:String(f.get("kind")), title:String(f.get("title")), pitch:String(f.get("pitch")), link:f.get("link")||null
  });
  saveStore(ST);
  $("#pitchForm").style.display="none";
  $("#pitchDone").style.display="block";
});
try{ if(new URLSearchParams(location.search).get("pitch")==="1") openModal("pitchModal"); }catch(e){}
$("#mailForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  ST.subscribers.push({email: $("#mailInput").value.trim(), ts: MONTH_SHORT[now.getMonth()]+" "+now.getDate()+", "+now.getFullYear()});
  saveStore(ST);
  $("#mailDone").textContent = "You're in. First digest lands Monday.";
  $("#mailForm").style.display = "none";
});

/* ---- ambient ---- */
const io = new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting){en.target.classList.add("on");io.unobserve(en.target);}})},{threshold:.1});
document.querySelectorAll(".rv").forEach(el=>io.observe(el));

renderNextUp(); renderLegend(); renderCal(); renderBackroom(); renderSpeaks(); renderHow();
})();
