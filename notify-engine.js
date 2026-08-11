window.CGB_NOTIFY=(function(){
  "use strict";
  const KEY_SEEN="cgb-notify-seen";
  const KEY_QUEUE="cgb-notify-queue";
  const KEY_MUTE="cgb-notify-mute";
  let timer=null;
  let checking=false;

  function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key)||"")||fallback}catch(_){return fallback}}
  function save(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function escapeHtml(value){return String(value==null?"":value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]))}
  function isMuted(){try{return localStorage.getItem(KEY_MUTE)==="1"}catch(_){return false}}
  function setMuted(value){try{localStorage.setItem(KEY_MUTE,value?"1":"0")}catch(_){}renderPanel()}
  function queue(){return parse(KEY_QUEUE,[])}
  function setQueue(items){save(KEY_QUEUE,items.slice(0,40));updateBadge();renderPanel()}

  function updateBadge(){
    const count=queue().filter(item=>item.unread).length;
    document.querySelectorAll("[data-notify-badge]").forEach(badge=>{
      badge.textContent=count>9?"9+":String(count||"");badge.classList.toggle("visible",count>0);
    });
  }
  function timeAgo(value){
    const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));
    if(seconds<60) return "только что";if(seconds<3600) return Math.floor(seconds/60)+" мин назад";
    if(seconds<86400) return Math.floor(seconds/3600)+" ч назад";
    return new Date(value).toLocaleDateString("ru-RU");
  }
  function showToast(item){
    let holder=document.getElementById("cgbToasts");
    if(!holder){holder=document.createElement("div");holder.id="cgbToasts";holder.className="cgb-toasts";document.body.appendChild(holder)}
    const toast=document.createElement("a");toast.className="cgb-toast";toast.href=item.href;
    toast.innerHTML=`<div class="cgb-toast-icon">✚</div><div class="cgb-toast-body"><div class="cgb-toast-label">Новая публикация</div><div class="cgb-toast-title">${escapeHtml(item.title)}</div></div><button class="cgb-toast-close" type="button" title="Закрыть">✕</button>`;
    holder.appendChild(toast);
    const close=()=>{toast.classList.add("closing");setTimeout(()=>toast.remove(),260)};
    toast.querySelector(".cgb-toast-close").addEventListener("click",event=>{event.preventDefault();event.stopPropagation();close()});
    setTimeout(close,7000);
    if(!isMuted()&&window.CGB_SOUND) window.CGB_SOUND.play("notify");
  }

  function panel(){
    let element=document.getElementById("cgbNotifyPanel");
    if(element) return element;
    element=document.createElement("aside");element.id="cgbNotifyPanel";element.className="cgb-notify-panel";
    element.setAttribute("aria-label","Уведомления");document.body.appendChild(element);
    element.addEventListener("click",event=>{
      const action=event.target.closest("[data-act]");
      if(action){
        event.preventDefault();
        if(action.dataset.act==="mute") setMuted(!isMuted());
        if(action.dataset.act==="read") setQueue(queue().map(item=>({...item,unread:false})));
        if(action.dataset.act==="clear") setQueue([]);
        if(action.dataset.act==="close") element.classList.remove("active");
        return;
      }
      const link=event.target.closest(".cgb-np-item");
      if(link){const id=link.dataset.id;setQueue(queue().map(item=>String(item.id)===id?({...item,unread:false}):item))}
    });
    return element;
  }
  function renderPanel(){
    const element=document.getElementById("cgbNotifyPanel");if(!element) return;
    const items=queue();
    element.innerHTML=`<div class="cgb-np-head"><span class="cgb-np-title">Уведомления</span><div class="cgb-np-actions">
      <button class="cgb-np-btn" data-act="mute" title="${isMuted()?"Включить звук":"Выключить звук"}">${isMuted()?"🔕":"🔔"}</button>
      <button class="cgb-np-btn" data-act="read" title="Отметить прочитанными">✓</button>
      <button class="cgb-np-btn" data-act="clear" title="Очистить">🗑</button>
      <button class="cgb-np-btn" data-act="close" title="Закрыть">✕</button></div></div>
      <div class="cgb-np-body">${items.length?items.map(item=>`<a class="cgb-np-item ${item.unread?"unread":""}" data-id="${escapeHtml(item.id)}" href="${escapeHtml(item.href)}">
        <div class="cgb-np-icon">✚</div><div class="cgb-np-content"><div class="cgb-np-label">Новости больницы</div><div class="cgb-np-name">${escapeHtml(item.title)}</div><div class="cgb-np-time">${timeAgo(item.at)}</div></div></a>`).join(""):
        '<div class="cgb-np-empty">Новых уведомлений пока нет.</div>'}</div>`;
  }
  function togglePanel(){const element=panel();renderPanel();element.classList.toggle("active")}

  async function check(){
    if(checking) return;checking=true;
    try{
      const auth=window.CGB_AUTH;
      const client=auth&&auth.state&&auth.state.client;
      if(!client) return;
      const {data,error}=await client.from("news").select("id,title,date,created_at").order("created_at",{ascending:false}).limit(20);
      if(error) return;
      const rows=data||[];
      let seen=parse(KEY_SEEN,null);
      const ids=rows.map(row=>String(row.id));
      if(!Array.isArray(seen)){save(KEY_SEEN,ids);return}
      const fresh=rows.filter(row=>!seen.includes(String(row.id))).reverse();
      if(fresh.length){
        const existing=queue();
        const additions=fresh.map(row=>({id:String(row.id),title:row.title||"Новая публикация",at:row.created_at||row.date||new Date().toISOString(),href:"news.html#news-"+encodeURIComponent(row.id),unread:true}));
        setQueue(additions.reverse().concat(existing));fresh.forEach(row=>showToast(additions.find(item=>item.id===String(row.id))));
      }
      save(KEY_SEEN,Array.from(new Set(ids.concat(seen))).slice(0,200));
    }finally{checking=false}
  }
  function start(){if(timer) return;check();timer=setInterval(check,60000)}

  document.addEventListener("DOMContentLoaded",()=>{
    document.querySelectorAll("[data-open-notify]").forEach(button=>button.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();togglePanel()}));
    document.addEventListener("click",event=>{const element=document.getElementById("cgbNotifyPanel");if(element&&element.classList.contains("active")&&!element.contains(event.target)&&!event.target.closest("[data-open-notify]")) element.classList.remove("active")});
    updateBadge();
    if(window.CGB_AUTH) window.CGB_AUTH.onChange(state=>{if(state&&state.ready) start()});else start();
  });

  return {check,start,updateBadge,togglePanel};
})();
