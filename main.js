(function(){
  "use strict";

  const root=document.documentElement;
  const storage={
    get(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:value}catch(_){return fallback}},
    set(key,value){try{localStorage.setItem(key,value)}catch(_){}}
  };

  function setupTheme(){
    const saved=storage.get("cgb-theme","");
    const preferred=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";
    root.setAttribute("data-theme",saved||preferred);
    const button=document.getElementById("themeToggle");
    if(!button) return;
    button.addEventListener("click",()=>{
      const next=root.getAttribute("data-theme")==="light"?"dark":"light";
      root.setAttribute("data-theme",next);
      storage.set("cgb-theme",next);
      document.dispatchEvent(new CustomEvent("cgb-theme-change",{detail:{theme:next}}));
    });
  }

  function setupNavigation(){
    const burger=document.getElementById("burger");
    const nav=document.getElementById("mainNav");
    if(!burger||!nav) return;

    const links=Array.from(nav.querySelectorAll("a"));
    const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
    links.forEach(link=>link.classList.toggle("active",(link.getAttribute("href")||"").split("#")[0].toLowerCase()===current));

    /* Мебель бокового drawer: шапка, прокручиваемая зона, подвал. */
    const scroll=document.createElement("div");
    scroll.className="nav-scroll";
    const section=document.createElement("div");
    section.className="nav-section";
    const sectionTitle=document.createElement("div");
    sectionTitle.className="nav-section-title";
    sectionTitle.textContent="Разделы сайта";
    const linkList=document.createElement("div");
    linkList.className="nav-links";
    links.forEach(link=>linkList.appendChild(link));
    section.appendChild(sectionTitle);
    section.appendChild(linkList);
    scroll.appendChild(section);

    const header=document.createElement("div");
    header.className="nav-header";
    header.innerHTML='<div class="nav-header-brand"><img src="logo.png" alt=""><div><strong>ЦГБ №3</strong><span>Меню сайта</span></div></div><button class="nav-close" type="button" aria-label="Закрыть меню">✕</button>';
    const footer=document.createElement("div");
    footer.className="nav-footer";
    footer.innerHTML='<span class="nav-footer-name">Центральная городская больница №3</span><span class="nav-footer-note">Приёмное отделение · 24/7</span>';
    nav.replaceChildren(header,scroll,footer);

    const backdrop=document.createElement("div");
    backdrop.className="nav-backdrop";
    document.body.appendChild(backdrop);

    /* Меню всегда боковое (сбоку на всех экранах). Панель сразу переносится
       в <body>: у шапки есть backdrop-filter, который делает её containing block
       для position:fixed, из-за чего панель «липла» бы к размерам шапки. */
    document.body.appendChild(nav);
    nav.setAttribute("aria-hidden","true");
    nav.inert=true;

    const open=()=>{
      nav.classList.add("open");backdrop.classList.add("visible");burger.classList.add("open");
      nav.setAttribute("aria-hidden","false");nav.inert=false;
      burger.setAttribute("aria-expanded","true");burger.setAttribute("aria-label","Закрыть меню");
      document.body.style.overflow="hidden";
      const first=nav.querySelector("a");if(first) setTimeout(()=>first.focus(),200);
    };
    const close=(restoreFocus=false)=>{
      if(!nav.classList.contains("open")) return;
      nav.classList.remove("open");backdrop.classList.remove("visible");burger.classList.remove("open");
      nav.setAttribute("aria-hidden","true");nav.inert=true;
      burger.setAttribute("aria-expanded","false");burger.setAttribute("aria-label","Открыть меню");
      document.body.style.overflow="";
      if(restoreFocus) burger.focus();
    };
    burger.addEventListener("click",()=>nav.classList.contains("open")?close():open());
    backdrop.addEventListener("click",()=>close(true));
    nav.querySelector(".nav-close").addEventListener("click",()=>close(true));
    nav.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>close(false)));
    document.addEventListener("keydown",event=>{if(event.key==="Escape") close(true)});
  }

  function setupReveal(){
    const elements=document.querySelectorAll(".reveal");
    if(!elements.length) return;
    if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      elements.forEach(element=>element.classList.add("visible"));return;
    }
    if(!("IntersectionObserver" in window)){
      elements.forEach(element=>element.classList.add("visible"));return;
    }
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}
    }),{threshold:.08,rootMargin:"0px 0px -30px"});
    elements.forEach(element=>observer.observe(element));
  }

  function setupPageActions(){
    const year=document.getElementById("year");if(year) year.textContent=new Date().getFullYear();
    const stack=document.getElementById("fabStack");
    const up=document.getElementById("fabUp");
    const print=document.getElementById("fabPrint");
    if(up) up.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
    if(print) print.addEventListener("click",()=>window.print());
    if(stack){
      const update=()=>stack.classList.toggle("visible",window.scrollY>500);
      window.addEventListener("scroll",update,{passive:true});update();
    }
  }

  function escapeHtml(value){
    return String(value==null?"":value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  }

  function setupSearch(){
    const modal=document.getElementById("searchModal");
    if(!modal) return;
    const input=modal.querySelector(".search-input");
    const results=modal.querySelector(".search-results");
    const closeButton=modal.querySelector(".search-close-kbd");
    let selected=0;
    let visible=[];
    let dataset=[
      {group:"Страницы",title:"Главная",hint:"Основная информация о больнице",href:"index.html",kw:"главная больница"},
      {group:"Страницы",title:"О больнице",hint:"Направления, услуги и порядок записи",href:"info.html",kw:"информация помощь услуги запись"},
      {group:"Страницы",title:"Новости",hint:"События и объявления больницы",href:"news.html",kw:"новости объявления"},
      {group:"Страницы",title:"Вопросы и ответы",hint:"Справочная информация для пациентов",href:"faq.html",kw:"вопросы faq справка"}
    ];

    const icon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zm2 4v10h12V8z"/></svg>`;
    function highlight(){
      results.querySelectorAll(".search-result").forEach(item=>{
        const active=Number(item.dataset.idx)===selected;
        item.classList.toggle("active",active);
        if(active) item.scrollIntoView({block:"nearest"});
      });
    }
    function render(query){
      const term=String(query||"").trim().toLocaleLowerCase("ru");
      visible=(term?dataset.filter(item=>(item.title+" "+item.hint+" "+item.kw).toLocaleLowerCase("ru").includes(term)):dataset).slice(0,50);
      selected=0;
      if(!visible.length){results.innerHTML=`<div class="search-empty">По запросу «${escapeHtml(term)}» ничего не найдено</div>`;return}
      const groups={};visible.forEach(item=>(groups[item.group]||(groups[item.group]=[])).push(item));
      let index=0;
      results.innerHTML=Object.entries(groups).map(([group,items])=>
        `<div class="search-group">${escapeHtml(group)}</div>`+items.map(item=>`<button class="search-result" type="button" data-idx="${index++}" data-href="${escapeHtml(item.href)}">
          <span class="search-result-icon">${icon}</span>
          <span class="search-result-body"><span class="search-result-title">${escapeHtml(item.title)}</span><span class="search-result-hint">${escapeHtml(item.hint)}</span></span>
          <span class="search-result-arrow">↵</span>
        </button>`).join("")
      ).join("");
      highlight();
    }
    function open(){modal.classList.add("active");render(input.value);setTimeout(()=>input.focus(),40)}
    function close(){modal.classList.remove("active");input.value=""}
    function go(href){if(href&&/^(?:[a-z0-9_-]+\.html)?(?:#[a-z0-9_-]+)?$/i.test(href)){close();location.href=href}}

    document.querySelectorAll("[data-open-search]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();open()}));
    if(closeButton) closeButton.addEventListener("click",close);
    modal.addEventListener("click",event=>{if(event.target===modal) close()});
    input.addEventListener("input",()=>render(input.value));
    results.addEventListener("click",event=>{const item=event.target.closest(".search-result");if(item) go(item.dataset.href)});
    document.addEventListener("keydown",event=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();open();return}
      if(!modal.classList.contains("active")) return;
      if(event.key==="Escape") close();
      else if(event.key==="ArrowDown"){event.preventDefault();selected=Math.min(selected+1,visible.length-1);highlight()}
      else if(event.key==="ArrowUp"){event.preventDefault();selected=Math.max(selected-1,0);highlight()}
      else if(event.key==="Enter"){
        event.preventDefault();const item=results.querySelector(`.search-result[data-idx="${selected}"]`);if(item) go(item.dataset.href);
      }
    });
    if(window.CGB_SEARCH&&typeof window.CGB_SEARCH.build==="function"){
      window.CGB_SEARCH.build().then(items=>{if(Array.isArray(items)&&items.length) dataset=items;if(modal.classList.contains("active")) render(input.value)}).catch(()=>{});
    }
  }

  function setupBackground(){
    const canvas=document.getElementById("bgCanvas");
    if(!canvas) return;
    const context=canvas.getContext("2d");
    if(!context) return;
    let width=0,height=0,frame=0,particles=[];
    let mode=storage.get("cgb-bg-mode","grid");
    if(!["grid","dots","waves"].includes(mode)) mode="grid";
    let enabled=storage.get("cgb-bg-enabled","1")!=="0";

    function resize(){
      const ratio=Math.min(window.devicePixelRatio||1,2);
      width=canvas.width=Math.round(innerWidth*ratio);height=canvas.height=Math.round(innerHeight*ratio);
      canvas.style.width=innerWidth+"px";canvas.style.height=innerHeight+"px";
      particles=Array.from({length:Math.min(80,Math.max(32,Math.floor(innerWidth/20)))},()=>({
        x:Math.random()*width,y:Math.random()*height,r:(.6+Math.random()*1.5)*ratio,
        vx:(Math.random()-.5)*.12*ratio,vy:(Math.random()-.5)*.12*ratio,phase:Math.random()*Math.PI*2
      }));
    }
    function color(alpha){return root.getAttribute("data-theme")==="light"?`rgba(31,126,148,${alpha})`:`rgba(86,174,190,${alpha})`}
    function drawGrid(){
      const ratio=Math.min(window.devicePixelRatio||1,2),step=80*ratio;
      context.lineWidth=1;context.strokeStyle=color(.07);
      for(let x=0;x<width;x+=step){context.beginPath();context.moveTo(x,0);context.lineTo(x,height);context.stroke()}
      for(let y=0;y<height;y+=step){context.beginPath();context.moveTo(0,y);context.lineTo(width,y);context.stroke()}
      drawDots(true);
    }
    function drawDots(connect){
      particles.forEach((particle,index)=>{
        particle.x+=particle.vx;particle.y+=particle.vy;particle.phase+=.012;
        if(particle.x<0) particle.x=width;if(particle.x>width) particle.x=0;
        if(particle.y<0) particle.y=height;if(particle.y>height) particle.y=0;
        context.fillStyle=color(.24+.14*Math.sin(particle.phase));context.beginPath();
        context.arc(particle.x,particle.y,particle.r,0,Math.PI*2);context.fill();
        if(connect&&index<particles.length-1){
          const next=particles[index+1],distance=Math.hypot(particle.x-next.x,particle.y-next.y);
          if(distance<170*(window.devicePixelRatio||1)){
            context.strokeStyle=color(.09);context.beginPath();context.moveTo(particle.x,particle.y);context.lineTo(next.x,next.y);context.stroke();
          }
        }
      });
    }
    function drawWaves(time){
      const ratio=Math.min(window.devicePixelRatio||1,2);
      for(let row=1;row<=5;row++){
        context.beginPath();context.lineWidth=1.2*ratio;context.strokeStyle=color(.035+row*.018);
        const center=height*row/6;
        for(let x=0;x<=width;x+=8*ratio){
          const y=center+Math.sin(x/(85*ratio)+time/1300+row)*16*ratio+Math.sin(x/(210*ratio)-time/1700)*10*ratio;
          if(x===0) context.moveTo(x,y);else context.lineTo(x,y);
        }
        context.stroke();
      }
      drawDots(false);
    }
    function tick(time){
      context.clearRect(0,0,width,height);
      if(mode==="grid") drawGrid();else if(mode==="dots") drawDots(false);else drawWaves(time);
      frame=requestAnimationFrame(tick);
    }
    function start(){
      if(!enabled){canvas.style.opacity="0";if(frame) cancelAnimationFrame(frame);frame=0;return}
      canvas.style.opacity="1";if(!frame) frame=requestAnimationFrame(tick);
    }
    function setMode(next){if(!["grid","dots","waves"].includes(next)) return;mode=next;storage.set("cgb-bg-mode",next);start()}
    function setEnabled(next){enabled=Boolean(next);storage.set("cgb-bg-enabled",enabled?"1":"0");start()}

    resize();start();
    let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(resize,150)});
    document.addEventListener("visibilitychange",()=>{if(document.hidden&&frame){cancelAnimationFrame(frame);frame=0}else start()});
    window.CGB_BG={setMode,setEnabled,getMode:()=>mode,isEnabled:()=>enabled};
    const animationToggle=document.getElementById("fsAnim");
    const modeButtons=document.querySelectorAll(".fs-mode");
    if(animationToggle&&!animationToggle.dataset.cgbWired){
      animationToggle.dataset.cgbWired="1";animationToggle.checked=enabled;
      animationToggle.addEventListener("change",()=>{setEnabled(animationToggle.checked);modeButtons.forEach(button=>button.disabled=!enabled)});
    }
    modeButtons.forEach(button=>{
      button.classList.toggle("active",button.dataset.bg===mode);button.disabled=!enabled;
      if(!button.dataset.cgbWired){button.dataset.cgbWired="1";button.addEventListener("click",()=>{setMode(button.dataset.bg);modeButtons.forEach(item=>item.classList.toggle("active",item.dataset.bg===mode))})}
    });
    document.dispatchEvent(new CustomEvent("cgb-bg-ready"));
  }

  setupTheme();
  document.addEventListener("DOMContentLoaded",()=>{
    setupNavigation();setupReveal();setupPageActions();setupSearch();setupBackground();
    if(window.CGB_ROLES&&window.CGB_ROLES.applyPermGates) window.CGB_ROLES.applyPermGates();
  });
})();
