/* Aurora 5.0 release candidate: Turnstile verified chat. */
(()=>{'use strict';
const ENDPOINT='https://tabarjal-gemini-api.fr8ack-s.workers.dev/api/weather-chat';
const SITE_KEY='0x4AAAAAAFV1K7_JPFdDS1O1';
const launch=document.getElementById('aiLaunch'),panel=document.getElementById('aiPanel'),close=document.getElementById('aiClose'),chat=document.getElementById('aiChat'),form=document.getElementById('aiForm'),input=document.getElementById('aiInput'),send=document.getElementById('aiSend'),status=document.getElementById('aiSecurityStatus');
if(!launch||!panel||!chat||!form)return;
let widgetId=null,busy=false;
// App exposes only the user-selected city/GPS snapshot, not its mutable state.
function selectedCoordinates(){
 const selected=typeof window.getTabarjalSelectedLocation==='function'?window.getTabarjalSelectedLocation():null;
 const latitude=selected?.lat,longitude=selected?.lon;
 return {latitude:typeof latitude==='number'&&Number.isFinite(latitude)&&latitude>=-90&&latitude<=90?latitude:30.5,
 longitude:typeof longitude==='number'&&Number.isFinite(longitude)&&longitude>=-180&&longitude<=180?longitude:38.216};
}
function bubble(message,who){const el=document.createElement('div');el.className='ai-bubble '+who;el.textContent=message;chat.append(el);chat.scrollTop=chat.scrollHeight;return el;}
function toggle(open){panel.hidden=!open;launch.setAttribute('aria-expanded',String(open));if(open){input.focus();initializeSecurity();}else launch.focus();}
launch.addEventListener('click',()=>toggle(panel.hidden));close.addEventListener('click',()=>toggle(false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggle(false)});
function initializeSecurity(){if(SITE_KEY.startsWith('REPLACE_')){status.textContent='يلزم إعداد مفتاح Turnstile قبل إتاحة المحادثة.';send.disabled=true;return;}if(!window.turnstile){status.textContent='جارٍ تحميل التحقق الأمني…';return;}if(widgetId!==null)return;try{widgetId=window.turnstile.render('#aiTurnstile',{sitekey:SITE_KEY,action:'weather_chat',theme:'auto',callback:()=>{status.textContent='التحقق الأمني جاهز';send.disabled=false},'expired-callback':()=>{status.textContent='انتهت صلاحية التحقق، أعد المحاولة';send.disabled=true},'error-callback':()=>{status.textContent='تعذر التحقق الأمني';send.disabled=true}});}catch{status.textContent='تعذر بدء التحقق الأمني';send.disabled=true;}}
window.onTabarjalTurnstileReady=initializeSecurity;
async function ask(message){message=message.trim();if(!message||busy)return;if(message.length>600){bubble('الحد الأقصى للسؤال 600 حرف.','bot');return;}if(!window.turnstile||widgetId===null){bubble('التحقق الأمني غير جاهز.','bot');return;}const token=window.turnstile.getResponse(widgetId);if(!token){bubble('أكمل التحقق الأمني أولًا.','bot');return;}busy=true;send.disabled=true;input.disabled=true;bubble(message,'me');input.value='';const pending=bubble('جارٍ تحليل التوقعات…','bot');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),38000);
try{const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,...selectedCoordinates(),turnstileToken:token}),signal:controller.signal,cache:'no-store'});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'تعذر الاتصال بالمساعد');pending.textContent=result.answer||'لم تصل إجابة.';if(result.weather_time){const small=document.createElement('small');small.style.display='block';small.style.opacity='.75';small.textContent='Open-Meteo | '+result.weather_time;pending.append(small);}}catch(err){pending.textContent=err.name==='AbortError'?'انتهت مهلة الاتصال. حاول مجددًا.':(err.message==='Failed to fetch'?'تعذر الاتصال بالخدمة.':'المساعد غير متاح: '+err.message);}finally{clearTimeout(timeout);busy=false;input.disabled=false;window.turnstile.reset(widgetId);send.disabled=true;input.focus();}}
form.addEventListener('submit',e=>{e.preventDefault();ask(input.value)});document.querySelectorAll('[data-ai-question]').forEach(b=>b.addEventListener('click',()=>ask(b.dataset.aiQuestion)));
})();
