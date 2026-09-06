const key='school_barter_listings_v3';
let listings=JSON.parse(localStorage.getItem(key)||'[]');

const form=document.querySelector('#listingForm');
const container=document.querySelector('#listings');
const search=document.querySelector('#search');

form.addEventListener('submit',e=>{
  e.preventDefault();
  const item={
    id:Date.now(),
    title:title.value.trim(),
    description:description.value.trim(),
    price:Number(price.value),
    type:type.value,
    className:className.value.trim(),
    phone:phone.value.trim()
  };
  listings.unshift(item);
  localStorage.setItem(key,JSON.stringify(listings));
  form.reset();
  render();
  alert('Объявление опубликовано!');
});

search.addEventListener('input',render);

function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=listings.filter(x=>
    !q || [x.title,x.description,x.type,x.className].join(' ').toLowerCase().includes(q)
  );
  container.innerHTML=filtered.length ? filtered.map(x=>`
    <article class="listing">
      <h3>${esc(x.title)}</h3>
      <div class="price">${x.price.toLocaleString('ru-RU')} ₽</div>
      <p>${esc(x.description)}</p>
      <div class="meta">${esc(x.type)} · класс ${esc(x.className)}</div>
      <button onclick="showContact('${x.id}')">Оформить заказ</button>
    </article>
  `).join('') : '<p>Объявлений пока нет.</p>';
}

function showContact(id){
  const x=listings.find(v=>v.id==id);
  if(!x)return;
  alert('Заказ оформлен.\n\nКонтакт продавца для связи: '+x.phone+
        '\n\nВажно: перевод денег через сайт не выполняется.');
}

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
render();
