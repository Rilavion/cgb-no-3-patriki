window.CGB_SEARCH=(function(){
  "use strict";
  let cache=null;
  let pending=null;

  const STATIC_ITEMS=[
    {group:"Страницы",title:"Главная",hint:"Основная информация о больнице",href:"index.html",kw:"главная больница"},
    {group:"Страницы",title:"О больнице",hint:"Направления медицинской помощи",href:"info.html",kw:"информация отделения врачи"},
    {group:"Страницы",title:"Виды медицинской помощи",hint:"ОМС, ДМС и платные услуги",href:"info.html#forms",kw:"услуги омс дмс"},
    {group:"Страницы",title:"Как записаться",hint:"Порядок записи на приём",href:"info.html#steps",kw:"запись прием регистратура"},
    {group:"Страницы",title:"Новости",hint:"События и объявления больницы",href:"news.html",kw:"новости объявления"},
    {group:"Страницы",title:"Вопросы и ответы",hint:"Справочная информация для пациентов",href:"faq.html",kw:"faq вопросы помощь"}
  ];

  function safeId(value){return String(value==null?"":value).replace(/[^a-zA-Z0-9_-]/g,"")}
  async function waitForClient(){
    const auth=window.CGB_AUTH;
    if(!auth) return null;
    if(auth.state&&auth.state.ready) return auth.state.client;
    await new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done) return;done=true;resolve()};
      let off=()=>{};off=auth.onChange(state=>{if(state&&state.ready){off();finish()}});
      setTimeout(finish,1800);
    });
    return auth.state&&auth.state.client;
  }

  async function build(){
    if(cache) return cache.slice();
    if(pending) return pending;
    pending=(async()=>{
      const items=STATIC_ITEMS.slice();
      const client=await waitForClient();
      if(client){
        const [newsResult,faqResult]=await Promise.all([
          client.from("news").select("id,title,excerpt,body,tag,dept").order("date",{ascending:false}).limit(100),
          client.from("faq").select("id,cat,q,a").order("sort",{ascending:true}).limit(200)
        ]);
        if(!newsResult.error){
          (newsResult.data||[]).forEach(row=>items.push({
            group:"Новости",title:row.title||"Новость",hint:row.excerpt||"Публикация больницы",
            href:"news.html#news-"+safeId(row.id),kw:[row.body,row.tag,row.dept].filter(Boolean).join(" ")
          }));
        }
        if(!faqResult.error){
          (faqResult.data||[]).forEach(row=>items.push({
            group:"Вопросы и ответы",title:row.q||"Вопрос",hint:row.cat||"Справочная",
            href:"faq.html#"+safeId(row.id),kw:[row.a,row.cat].filter(Boolean).join(" ")
          }));
        }
      }
      cache=items;pending=null;return items.slice();
    })().catch(error=>{pending=null;console.warn("[CGB_SEARCH]",error);return STATIC_ITEMS.slice()});
    return pending;
  }

  function invalidate(){cache=null;pending=null}
  return {build,invalidate};
})();
