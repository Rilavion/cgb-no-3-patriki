window.CGB_ROLES=(function(){
  "use strict";
  let myRole="user";
  let myRoleDefinition=null;
  let displayName="";
  const listeners=[];

  const FALLBACK_PERMISSIONS={
    admin:{"*":{"*":true}},
    staff:{news:{create:true,edit:true},faq:{edit:true},info:{edit:false}},
    user:{}
  };

  function emit(){listeners.slice().forEach(listener=>{try{listener({role:myRole,roleDefinition:myRoleDefinition,displayName})}catch(_){}})}
  function onChange(listener){listeners.push(listener);listener({role:myRole,roleDefinition:myRoleDefinition,displayName});return()=>{const index=listeners.indexOf(listener);if(index>=0) listeners.splice(index,1)}}
  function authState(){return window.CGB_AUTH&&window.CGB_AUTH.state}
  function permissions(){return myRoleDefinition&&myRoleDefinition.permissions||FALLBACK_PERMISSIONS[myRole]||{}}

  function can(section,action){
    if(myRole==="admin") return true;
    const value=permissions();
    return Boolean(value&&(
      value[section]&&(value[section][action]===true||value[section]["*"]===true)||
      value["*"]&&(value["*"][action]===true||value["*"]["*"]===true)
    ));
  }
  function applyPermGates(){
    document.body.classList.toggle("cgb-is-admin",myRole==="admin");
    document.body.classList.toggle("cgb-is-staff",myRole==="admin"||myRole==="staff");
    const state=authState();
    document.body.classList.toggle("cgb-is-logged",Boolean(state&&state.user));
    document.querySelectorAll("[data-admin]").forEach(element=>{element.style.display=myRole==="admin"?"":"none"});
    document.querySelectorAll("[data-loggedin]").forEach(element=>{element.style.display=state&&state.user?"":"none"});
    document.querySelectorAll("[data-perm]").forEach(element=>{
      const allowed=String(element.dataset.perm||"").split(",").some(rule=>{
        const [section,action]=rule.trim().split(":");return section&&action&&can(section,action);
      });
      element.style.display=allowed?"":"none";
    });
  }

  async function waitReady(timeout=5000){
    const state=authState();if(state&&state.ready) return state;
    return new Promise(resolve=>{
      let finished=false;
      const finish=value=>{if(finished) return;finished=true;resolve(value)};
      let off=()=>{};
      if(window.CGB_AUTH) off=window.CGB_AUTH.onChange(next=>{if(next&&next.ready){off();finish(next)}});
      setTimeout(()=>finish(authState()),timeout);
    });
  }
  async function loadMyRole(){
    const state=await waitReady();
    myRole="user";myRoleDefinition=null;displayName="";
    if(!state||!state.client||!state.user){applyPermGates();emit();return myRole}
    try{
      const {data,error}=await state.client.from("user_roles").select("role,display_name").eq("user_id",state.user.id).maybeSingle();
      if(error) throw error;
      if(data){myRole=data.role||"user";displayName=data.display_name||""}
      const {data:definition,error:definitionError}=await state.client.from("custom_roles").select("key,name,permissions,sort").eq("key",myRole).maybeSingle();
      if(!definitionError&&definition) myRoleDefinition=definition;
    }catch(error){console.warn("[CGB_ROLES] Не удалось загрузить роль:",error.message)}
    applyPermGates();emit();return myRole;
  }

  async function listUsers(){
    const state=authState();if(!state||!state.client||!can("staff","view")) return [];
    const {data,error}=await state.client.from("user_roles").select("user_id,role,display_name,created_at,updated_at").order("created_at",{ascending:true});
    if(error){console.warn("[CGB_ROLES] Не удалось получить список пользователей:",error.message);return []}
    return data||[];
  }
  async function listRoleDefinitions(){
    const state=authState();if(!state||!state.client) return [];
    const {data,error}=await state.client.from("custom_roles").select("key,name,permissions,sort").order("sort",{ascending:true});
    if(error) return [];return data||[];
  }
  async function setRole(userId,role,name){
    const state=authState();if(!state||!state.client) return {ok:false,error:"Supabase недоступен"};
    const {error}=await state.client.rpc("staff_upsert_role",{p_user_id:userId,p_role:role,p_display_name:name||null});
    return error?{ok:false,error:error.message}:{ok:true};
  }

  document.addEventListener("DOMContentLoaded",applyPermGates);
  if(window.CGB_AUTH) window.CGB_AUTH.onChange(state=>{if(state&&state.ready) loadMyRole();else applyPermGates()});
  else setTimeout(loadMyRole,0);

  return {
    onChange,can,applyPermGates,loadMyRole,listUsers,listRoleDefinitions,setRole,
    get role(){return myRole},get roleDefinition(){return myRoleDefinition},get displayName(){return displayName}
  };
})();
