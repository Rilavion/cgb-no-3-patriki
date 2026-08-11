window.VSRF_FAQ=(function(){
  const KEY="cgb-faq-local";
  const DEFAULTS=[];

  function readLocal(){
    try{
      const raw=localStorage.getItem(KEY);
      if(raw===null) return [];
      return JSON.parse(raw)||[];
    }catch(e){return []}
  }
  function writeLocal(list){try{localStorage.setItem(KEY,JSON.stringify(list||[]))}catch(e){}}

  let mode="local";

  async function loadAll(){
    const auth=window.VSRF_AUTH;
    if(auth&&auth.state&&auth.state.client){
      try{
        const {data,error}=await auth.state.client.from("faq").select("*").order("sort",{ascending:true});
        if(!error&&data){
          mode="supabase";
          return data.map(r=>({id:r.id,cat:r.cat||"Общее",q:r.q||"",a:r.a||"",sort:r.sort||0}));
        }
      }catch(e){}
    }
    mode="local";
    return readLocal();
  }
  async function save(item){
    if(mode==="supabase"){
      const client=window.VSRF_AUTH.state.client;
      try{
        const {error}=await client.from("faq").upsert(item);
        if(!error) return true;
      }catch(e){}
    }
    const list=readLocal();
    const i=list.findIndex(x=>x.id===item.id);
    if(i>=0) list[i]=item;else list.push(item);
    writeLocal(list);
    return true;
  }
  async function remove(id){
    if(mode==="supabase"){
      const client=window.VSRF_AUTH.state.client;
      try{
        const {error}=await client.from("faq").delete().eq("id",id);
        if(!error) return true;
      }catch(e){}
    }
    writeLocal(readLocal().filter(x=>x.id!==id));
    return true;
  }
  function getMode(){return mode}
  function resetDefaults(){writeLocal(DEFAULTS.slice())}
  function clearAll(){writeLocal([])}
  function makeId(){return "faq_"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

  return {DEFAULTS,loadAll,save,remove,makeId,readLocal,writeLocal,getMode,resetDefaults,clearAll};
})();
