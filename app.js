const $=s=>document.querySelector(s),f=$('#form'),msg=t=>$('#status').textContent=t;
const admin=location.pathname.endsWith('/admin.html');
let user,mode,id=crypto.randomUUID(),generation=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(op,data={}){
 const response=await fetch(CONFIG.api,{method:'POST',body:JSON.stringify({...data,op,token:liff.getIDToken()})});
 const r=await response.json();if(!r.ok)throw Error(r.error);return r.data
}
const labels=['หัวหน้าทีม','บัญชี','AI'],cols=[11,14,16];
const badges=r=>labels.map((s,i)=>'<small data-r="'+esc(r[cols[i]])+'">'+s+' · '+esc(r[cols[i]])+'</small>').join('');
function showError(e){msg(e.message||'เชื่อมต่อไม่สำเร็จ')}
async function page(m){
 document.querySelector('nav').hidden=false;document.body.dataset.page=m;$('#title').hidden=true;$('#filter').hidden=true;$('#query').value='';$('#search').hidden=!['today','all'].includes(m);$('.mast b').textContent={today:'สาธิตวันนี้',all:'สาธิตรวม',new:'ส่งสาธิต',news:'ประชาสัมพันธ์'}[m];const gen=++generation;mode=m;msg('');$('#title').textContent={new:'ส่งรายการสาธิต',today:'สาธิตวันนี้',all:'สาธิตทั้งหมด'}[m];
 for(const [k,b] of Object.entries({new:'newBtn',today:'today',all:'all',news:'news'}))$('#'+b).classList.toggle('active',m===k);
 f.hidden=m!=='new';const list=$('#list');list.replaceChildren();if(m==='new')return;if(m==='news'){try{const news=await api('news');if(gen!==generation)return;for(const [title,body] of news){const a=document.createElement('article');a.innerHTML='<h2>'+esc(title)+'</h2><p>'+esc(body)+'</p>';list.append(a)}if(!news.length)msg('ยังไม่มีประกาศ')}catch(e){showError(e)}return}
 msg('กำลังโหลดรายการ…');try{let data=await api('list');if(gen!==generation)return;
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok'}).format(new Date());
 if(m==='today')data=data.filter(r=>r[0]===today);msg(data.length?'':'ยังไม่มีรายการสาธิต');
 const observer=new IntersectionObserver(entries=>entries.forEach(async entry=>{if(!entry.isIntersecting)return;const img=entry.target;observer.unobserve(img);try{img.src='data:image/jpeg;base64,'+await api('photo',{id:img.dataset.id})}catch{img.alt='โหลดภาพไม่สำเร็จ'}}));
 const groups=new Map();
 for(const r of data){
 let group=groups.get(r[0]);if(!group){group=document.createElement('section');const h=document.createElement('h2');h.textContent=r[0].split('-').reverse().join('/')+' ';h.append(document.createElement('small'));group.append(h);list.append(group);groups.set(r[0],group)}
 const card=document.createElement('article');card.className='record';card.dataset.find=[r[5],r[6],r[7]].join(' ').toLowerCase();
 card.innerHTML='<button class="entry"><img alt="ภาพสาธิต"><span><strong>'+esc(r[5])+'</strong><em>'+esc(r[7])+'</em><span class="phone">'+esc(r[6])+'</span></span></button><div class="foot"><div class="badges">'+badges(r)+'</div><a aria-label="โทรหาลูกค้า" href="tel:'+encodeURIComponent(r[6])+'">☎</a><a aria-label="เปิดแผนที่" target="_blank" rel="noopener" href="https://maps.google.com/?q='+encodeURIComponent(r[9])+'">📍</a></div>';
 group.append(card);const img=card.querySelector('img');img.dataset.id=r[2];observer.observe(img);card.querySelector('button').onclick=()=>detail(r,img)
 }
 filterRows();
 }catch(e){if(gen===generation)showError(e)}
}
function detail(r,img){
 const box=$('#body');box.innerHTML='<h2>'+esc(r[5])+'</h2><img alt="ภาพสาธิต"><p>'+esc(r[7]+' · '+r[6])+'</p><p>'+esc(r[4]+' / '+r[3]+' · '+r[0]+' '+r[1])+'</p><a target="_blank" rel="noopener" href="https://maps.google.com/?q='+encodeURIComponent(r[9])+'">เปิดพิกัด '+esc(r[9])+'</a>'+labels.map((s,i)=>'<p><b>'+s+' · '+esc(r[cols[i]])+'</b><br>'+esc(r[cols[i]+1]||'')+' '+esc(i<2?r[cols[i]-1]:'')+'</p>').join('');
 const photo=box.querySelector('img');if(img.getAttribute('src'))photo.src=img.src;else api('photo',{id:r[2]}).then(v=>photo.src='data:image/jpeg;base64,'+v).catch(()=>photo.alt='โหลดภาพไม่สำเร็จ');
 let col=user[2]==='admin'?14:user[2]==='lead'&&r[3]===user[1]?11:0;
 if(col&&r[col]==='รอตรวจ'){const review=document.createElement('form');review.innerHTML='<label>ผลประเมิน<select required name="result"><option value="">เลือกผล</option><option>ผ่าน</option><option>ไม่ผ่าน</option></select></label><label>ความเห็น<textarea name="note" maxlength="1500"></textarea></label><button class="primary">บันทึกผล</button><p role="status"></p>';box.append(review);review.onsubmit=async e=>{e.preventDefault();const btn=review.querySelector('button');btn.disabled=true;try{await api('review',{id:r[2],result:review.result.value,note:review.note.value});$('#detail').close();await page(mode)}catch(err){review.querySelector('p').textContent=err.message}finally{btn.disabled=false}}}
 $('#detail').showModal()
}
$('#close').onclick=()=>$('#detail').close();
$('#gps').onclick=()=>navigator.geolocation.getCurrentPosition(p=>{f.lat.value=p.coords.latitude;f.lng.value=p.coords.longitude;msg('บันทึกพิกัดแล้ว')},()=>msg('อ่านตำแหน่งไม่ได้ กรุณาอนุญาตหรือกรอกพิกัดเอง'),{enableHighAccuracy:true,timeout:15000});
async function resize(file){const bitmap=await createImageBitmap(file);let scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));c.getContext('2d').drawImage(bitmap,0,0,c.width,c.height);bitmap.close();return c.toDataURL('image/jpeg',.8).split(',')[1]}
f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('.primary');btn.disabled=true;msg('กำลังส่งรายการ…');try{await api('submit',{id,name:f.customer.value,phone:f.phone.value,product:f.product.value,loc:[Number(f.lat.value),Number(f.lng.value)],photo:await resize(f.photo.files[0])});id=crypto.randomUUID();f.reset();await page('today')}catch(err){showError(err)}finally{btn.disabled=false}};
function filterRows(){const q=$('#query').value.trim().toLowerCase();for(const g of document.querySelectorAll('#list>section')){let count=0;for(const row of g.querySelectorAll('.record')){row.hidden=!row.dataset.find.includes(q);if(!row.hidden)count++}g.hidden=!count;g.querySelector('h2 small').textContent=count}} $('#query').oninput=filterRows;$('#search').onclick=()=>{const f=$('#filter');f.hidden=!f.hidden;if(f.hidden){$('#query').value='';filterRows()}else $('#query').focus()};$('#news').onclick=()=>page('news');$('#refresh').onclick=()=>{if(user)page(mode);else location.reload()};$('#newBtn').onclick=()=>page('new');$('#today').onclick=()=>page('today');$('#all').onclick=()=>page('all');
(async()=>{try{
 if(!CONFIG.liffId||!CONFIG.api)throw Error('กรุณาตั้งค่า LIFF ID และ URL ของ Apps Script ใน config.js');
 if(!window.liff)throw Error('โหลด LINE SDK ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วรีเฟรช');
 await liff.init({liffId:CONFIG.liffId,withLoginOnExternalBrowser:true});
 if(!liff.isLoggedIn()){if(liff.isInClient())throw Error('กรุณาเปิดแอปอีกครั้งจากลิงก์ LIFF ใน LINE');liff.login();return}
 if(!liff.getIDToken())throw Error('กรุณาเปิด scope openid ใน LIFF และอนุญาตให้แอปยืนยันตัวตน');
 const data=await api('init');user=data.user;if(admin&&user[2]==='sales')throw Error('หน้านี้สำหรับผู้ตรวจ');
 $('#staff').textContent=user[0];$('#team').textContent=user[1];$('#who').textContent=user[0]+' · '+user[1];for(const p of ['',...data.products])f.product.add(new Option(p||'เลือกสินค้า',p));
 $('#app').hidden=false;$('#newBtn').hidden=admin;await page('all')
 }catch(err){showError(err)}})();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
