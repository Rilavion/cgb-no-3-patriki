window.CGB_HOLIDAY=(function(){
  "use strict";
  const EVENTS={
    health:{label:"Всемирный день здоровья",banner:"7 АПРЕЛЯ · ДЕНЬ ЗДОРОВЬЯ",icon:"✚",color:"#36a6a8",color2:"#9ee4d9"},
    medic:{label:"День медицинского работника",banner:"ДЕНЬ МЕДИЦИНСКОГО РАБОТНИКА",icon:"⚕",color:"#397fa1",color2:"#b9dff2"},
    heart:{label:"Всемирный день сердца",banner:"29 СЕНТЯБРЯ · ДЕНЬ СЕРДЦА",icon:"♥",color:"#c85767",color2:"#f4b6bc"},
    newyear:{label:"Новый год",banner:"С НОВЫМ ГОДОМ!",icon:"❄",color:"#4b91b5",color2:"#d8f4ff"}
  };
  let active=null;

  function thirdSundayOfJune(date){
    const first=new Date(date.getFullYear(),5,1);
    return 1+((7-first.getDay())%7)+14;
  }
  function eventForDate(date){
    const month=date.getMonth()+1,day=date.getDate();
    if(month===4&&day===7) return "health";
    if(month===6&&day===thirdSundayOfJune(date)) return "medic";
    if(month===9&&day===29) return "heart";
    if((month===12&&day===31)||(month===1&&day<=7)) return "newyear";
    return null;
  }
  function clear(){
    Object.keys(EVENTS).forEach(key=>document.body&&document.body.classList.remove("holiday-"+key));
    document.querySelectorAll(".holiday-banner").forEach(element=>element.remove());
    document.documentElement.style.removeProperty("--holiday-color");
    document.documentElement.style.removeProperty("--holiday-color2");
    active=null;
  }
  function apply(key){
    if(!document.body) return;
    clear();
    const event=EVENTS[key];if(!event) return;
    active=key;document.body.classList.add("holiday-"+key);
    document.documentElement.style.setProperty("--holiday-color",event.color);
    document.documentElement.style.setProperty("--holiday-color2",event.color2);
    if(sessionStorage.getItem("cgb-holiday-hidden-"+key)==="1") return;
    const banner=document.createElement("div");banner.className="holiday-banner";
    banner.innerHTML=`<div class="holiday-banner-inner"><span class="holiday-banner-icon">${event.icon}</span><span class="holiday-banner-text">${event.banner}</span><span class="holiday-banner-icon holiday-banner-icon-r">${event.icon}</span><button class="holiday-banner-close" type="button" aria-label="Закрыть">✕</button></div>`;
    document.body.prepend(banner);
    banner.querySelector("button").addEventListener("click",()=>{sessionStorage.setItem("cgb-holiday-hidden-"+key,"1");banner.remove()});
    requestAnimationFrame(()=>banner.classList.add("visible"));
  }
  function init(){const key=eventForDate(new Date());if(key) apply(key)}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);else init();
  return {EVENTS,eventForDate,apply,clear,getActive:()=>active};
})();
