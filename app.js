const listingKey='school52_listings_v5';
const userKey='school52_user_v5';
let listings=JSON.parse(localStorage.getItem(listingKey)||'[]');
let user=JSON.parse(localStorage.getItem(userKey)||'null');

const auth=document.querySelector('#auth'), app=document.querySelector('#app');
const authForm=document.querySelector('#authForm'), listingForm=document.querySelector('#listingForm');
const search=document.querySelector('#search'), container=document.querySelector('#listings');
const typeEl=document.querySelector('#type'), priceType=document.querySelector('#priceType');

function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

authForm.addEventListener('submit',e=>{
 e.preventDefault();
 user={email:email.value.trim(),password:password.value,nickname:nickname.value.trim(),className:className.value.trim(),school:'№52'};
 localStorage.setItem(userKey,JSON.stringify(user)); enter();
});

typeEl.addEventListener('change',updateTypeFields);
priceType.addEventListener('change',updatePriceFields);
search.addEventListener('input',render);

function updateTypeFields(){
 const service=typeEl.value==='Услуга';
 document.querySelector('#pickupFields').classList.toggle('hidden',service);
 document.querySelector('#onlineFields').classList.toggle('hidden',!service);
}
function updatePriceFields(){
 const range=priceType.value==='range';
 document.querySelector('#fixedPriceBox').classList.toggle('hidden',range);
 document.querySelector('#rangePriceBox').classList.toggle('hidden',!range);
}

listingForm.addEventListener('submit',e=>{
 e.preventDefault();
 let priceText;
 if(priceType.value==='fixed'){
   if(!fixedPrice.value)return alert('Укажи цену.');
   priceText=Number(fixedPrice.value).toLocaleString('ru-RU')+' ₽';
 }else{
   const a=Number(priceFrom.value),b=Number(priceTo.value);
   if(!a||!b||a>b)return alert('Проверь диапазон цены.');
   priceText='от '+a.toLocaleString('ru-RU')+' до '+b.toLocaleString('ru-RU')+' ₽';
 }
 const service=typeEl.value==='Услуга';
 const item={
  id:Date.now(),title:title.value.trim(),description:description.value.trim(),priceText,
  type:typeEl.value,className:listingClass.value.trim(),
  building:service?'':building.value,floor:service?'':floor.value,
  format:service?format.value:'',contactType:contactType.value,contact:contact.value.trim(),
  seller:user.nickname
 };
 listings.unshift(item);localStorage.setItem(listingKey,JSON.stringify(listings));
 listingForm.reset();updateTypeFields();updatePriceFields();render();showSection('home');
 alert('Объявление опубликовано!');
});

function enter(){
 auth.classList.add('hidden');app.classList.remove('hidden');render();showSection('home');renderProfile();
}
function showSection(id){
 ['home','create','profile'].forEach(x=>document.getElementById(x).classList.add('hidden'));
 document.getElementById(id).classList.remove('hidden');
 if(id==='profile')renderProfile();
 window.scrollTo({top:0,behavior:'smooth'});
}
function toggleMenu(){document.getElementById('menu').classList.toggle('hidden')}
function logout(){localStorage.removeItem(userKey);location.reload()}

function renderProfile(){
 document.querySelector('#profileData').innerHTML=
 `<div class="profileLine"><b>E-mail:</b> ${esc(user.email)}</div>
  <div class="profileLine"><b>Пароль:</b> ••••••••</div>
  <div class="profileLine"><b>Никнейм:</b> ${esc(user.nickname)}</div>
  <div class="profileLine"><b>Класс:</b> ${esc(user.className)}</div>
  <div class="profileLine"><b>Школа:</b> №52</div>`;
}

function render(){
 const q=(search?.value||'').trim().toLowerCase();
 const filtered=listings.filter(x=>!q||[x.title,x.description,x.type,x.className,x.seller,x.building,x.floor,x.format].join(' ').toLowerCase().includes(q));
 container.innerHTML=filtered.length?filtered.map(x=>{
   const place=x.type==='Товар'?`📍 Корпус: ${esc(x.building)}, этаж: ${esc(x.floor)}`:`🌐 ${esc(x.format)}`;
   return `<article class="listing">
    <h3>${esc(x.title)}</h3><div class="price">${esc(x.priceText)}</div>
    <p>${esc(x.description)}</p><div class="meta">${esc(x.type)} · класс ${esc(x.className)} · продавец: ${esc(x.seller)}</div>
    <div class="meta">${place}</div>
    <button class="order" data-id="${x.id}">Оформить заказ</button>
   </article>`;
 }).join(''):'<p>Объявлений пока нет.</p>';
 document.querySelectorAll('.order').forEach(b=>b.onclick=()=>showContact(b.dataset.id));
}
function showContact(id){
 const x=listings.find(v=>v.id==id);if(!x)return;
 const label=x.contactType==='telegram'?'Telegram':'Телефон';
 alert('Заказ оформлен.\n\n'+label+': '+x.contact+'\n\nПеревод денег через сайт не выполняется.');
}
updateTypeFields();updatePriceFields();
if(user)enter();
