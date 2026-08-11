window.CGB_COMP=(function(){
  const RANKS=[
    {key:"gen_maj",label:"Гл-Врач",short:"Гл-В",tier:1},
    {key:"gen_lt",label:"Зам. Гл-Врача",short:"ЗГВ",tier:1},
    {key:"col",label:"Зав-Отделением",short:"ЗО",tier:2},
    {key:"lt_col",label:"Ст-Врач",short:"СВ",tier:3},
    {key:"maj",label:"Врач",short:"Вр",tier:4},
    {key:"capt",label:"Интерн",short:"Инт",tier:5},
    {key:"lt",label:"Фельдшер",short:"Фел",tier:6}
  ];

  const DEFAULT_HQ_SLOTS=[
    {key:"cmd_brigade",label:"Главный врач",badge:"Гл-Врач",tier:1,locked:true},
    {key:"first_deputy",label:"Первый заместитель главврача",badge:"Зам. Гл-Врача",tier:2},
    {key:"chief_staff",label:"Зам. по медицинской части",badge:"Зам. Гл-Врача",tier:2},
    {key:"deputy_vp_vk",label:"Зам. по кадрам",badge:"Зам. Гл-Врача",tier:2},
    {key:"deputy_sso_roio",label:"Зам. по клинико-экспертной работе",badge:"Зам. Гл-Врача",tier:2},
    {key:"deputy_mch",label:"Зам. по адм.-хоз. части",badge:"Зам. Гл-Врача",tier:2},
    {key:"assistant",label:"Помощник главврача",badge:"Ст-Врач",tier:3}
  ];

  const SUB_PRESETS={
    vp:{color:"#c94b4b",icon:"🏛"},
    vk:{color:"#4b6dc9",icon:"📋"},
    sso:{color:"#2f7a52",icon:"🚑"},
    roio:{color:"#c78a2a",icon:"🛡"},
    mch:{color:"#a34a8e",icon:"⚕"},
    default:{color:"#7a8a4a",icon:"★"}
  };

  const DEFAULT_STATE={
    hq_slots:JSON.parse(JSON.stringify(DEFAULT_HQ_SLOTS)),
    hq:{
      cmd_brigade:{name:"Ян Милонов",code:"376-939",tag:"главврач",photo:""},
      first_deputy:{name:"Эдвард Милонов",code:"617-798",tag:"первый зам",photo:""},
      chief_staff:{name:"Николай Фирсов",code:"571-179",tag:"зам. по медчасти",photo:""},
      deputy_vp_vk:{name:"Александр Милонов",code:"227-368",tag:"зам. по кадрам",photo:""},
      deputy_sso_roio:{name:"",code:"",tag:"зам. по КЭР",photo:""},
      deputy_mch:{name:"",code:"",tag:"зам. по АХЧ",photo:""},
      assistant:{name:"Иридий Милонов",code:"753-294",tag:"помощник",photo:""}
    },
    subs:[
      {id:"vp",name:"Администрация больницы",short:"АБ",color:"#c94b4b",icon:"🏛",members:[
        {rank:"lt_col",name:"Анна Милонова",code:"395-957",role:"Руководитель АБ",photo:""},
        {rank:"maj",name:"Дмитрий Милонов",code:"487-898",role:"Старший администратор",photo:""},
        {rank:"maj",name:"Максим Милонов",code:"877-506",role:"Администратор",photo:""}
      ]},
      {id:"vk",name:"Отдел кадров",short:"ОК",color:"#4b6dc9",icon:"📋",members:[
        {rank:"lt_col",name:"Евгений Милонов 54",code:"737-054",role:"Начальник отдела кадров",photo:""},
        {rank:"maj",name:"Марина Милонова",code:"705-377",role:"Зам. начальника ОК",photo:""},
        {rank:"maj",name:"Алик Милонов",code:"301-420",role:"Специалист по кадрам",photo:""},
        {rank:"maj",name:"Алексей Милонов",code:"826-970",role:"Инспектор ОК",photo:""}
      ]},
      {id:"sso",name:"Служба скорой помощи",short:"СП",color:"#2f7a52",icon:"🚑",members:[
        {rank:"lt_col",name:"Владислав Милонов",code:"982-671",role:"Зав. службой скорой помощи",photo:""},
        {rank:"maj",name:"Кира Милонова",code:"895-214",role:"Старший врач выездной бригады",photo:""},
        {rank:"maj",name:"Егор Милонов",code:"812-635",role:"Врач выездной бригады",photo:""}
      ]},
      {id:"roio",name:"Служба охраны больницы",short:"СО",color:"#c78a2a",icon:"🛡",members:[
        {rank:"lt_col",name:"Георгий Милонов",code:"105-547",role:"Начальник охраны",photo:""},
        {rank:"maj",name:"Евгений Милонов 80",code:"552-580",role:"Старший охранник",photo:""},
        {rank:"maj",name:"Андрей Милонов",code:"848-254",role:"Старший охранник",photo:""}
      ]},
      {id:"mch",name:"Приёмное отделение",short:"ПО",color:"#a34a8e",icon:"⚕",members:[
        {rank:"lt_col",name:"Данила Донецкий",code:"556-484",role:"Зав. приёмным отделением",photo:""},
        {rank:"maj",name:"Александр Тугодумов",code:"981-182",role:"Врач приёмного отделения",photo:""}
      ]}
    ],
    updated_at:null
  };

  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function rankInfo(k){return RANKS.find(r=>r.key===k)||{key:k,label:k,short:k,tier:9}}

  function waitReady(){
    return new Promise(resolve=>{
      const s=window.CGB_AUTH&&window.CGB_AUTH.state;
      if(!s||s.ready) return resolve();
      const off=window.CGB_AUTH.onChange(st=>{if(st.ready){off&&off();resolve()}});
      setTimeout(()=>resolve(),1500);
    });
  }

  function readLocal(){try{return JSON.parse(localStorage.getItem("cgb-composition")||"null")}catch(e){return null}}
  function writeLocal(state){localStorage.setItem("cgb-composition",JSON.stringify(state))}

  function migrate(st){
    if(!st) st={};
    if(!st.hq_slots||!Array.isArray(st.hq_slots)||!st.hq_slots.length){
      st.hq_slots=JSON.parse(JSON.stringify(DEFAULT_HQ_SLOTS));
    }
    if(!st.hq) st.hq={};
    if(!st.subs) st.subs=[];
    return st;
  }
  async function load(){
    await waitReady();
    const s=window.CGB_AUTH&&window.CGB_AUTH.state;
    if(s&&s.available&&s.client){
      try{
        const {data,error}=await s.client.from("composition").select("*").eq("id",1).maybeSingle();
        if(error) throw error;
        if(data&&data.state){
          const st=typeof data.state==="string"?JSON.parse(data.state):data.state;
          return migrate(Object.assign({},DEFAULT_STATE,st));
        }
      }catch(e){console.warn("[CGB_COMP]",e.message)}
    }
    return migrate(readLocal()||JSON.parse(JSON.stringify(DEFAULT_STATE)));
  }

  async function save(state){
    state.updated_at=new Date().toISOString();
    writeLocal(state);
    const s=window.CGB_AUTH&&window.CGB_AUTH.state;
    if(s&&s.available&&s.client){
      try{
        const {error}=await s.client.from("composition").upsert({id:1,state:state,updated_at:state.updated_at},{onConflict:"id"});
        if(error) throw error;
        return {ok:true,remote:true};
      }catch(e){console.warn("[CGB_COMP] save err:",e.message);return {ok:true,remote:false,error:e.message}}
    }
    return {ok:true,remote:false};
  }

  async function uploadPhoto(file){
    const s=window.CGB_AUTH&&window.CGB_AUTH.state;
    if(!s||!s.client) return {ok:false,error:"no client"};
    if(!file) return {ok:false,error:"no file"};
    if(file.size>10*1024*1024) return {ok:false,error:"Файл больше 10 МБ."};
    if(window.CGB_IMG&&window.CGB_IMG.compress){
      file=await window.CGB_IMG.compress(file,{maxW:800,maxH:800,quality:0.82});
    }
    const ext=(file.name.match(/\.([a-z0-9]+)$/i)||[])[1]||"webp";
    const path="comp_"+Date.now()+"_"+Math.random().toString(36).slice(2,8)+"."+ext.toLowerCase();
    try{
      const {error}=await s.client.storage.from("composition-photos").upload(path,file,{contentType:file.type||undefined,upsert:false});
      if(error) return {ok:false,error:error.message};
      const {data:pub}=s.client.storage.from("composition-photos").getPublicUrl(path);
      return {ok:true,url:pub.publicUrl,path};
    }catch(e){return {ok:false,error:e.message}}
  }

  function uid(){return "s_"+Math.random().toString(36).slice(2,9)}

  return {RANKS,DEFAULT_HQ_SLOTS,DEFAULT_STATE,SUB_PRESETS,load,save,uploadPhoto,esc,rankInfo,uid};
})();
