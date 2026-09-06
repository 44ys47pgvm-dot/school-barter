const starterAds=[
 {title:"Учебник по математике",price:5,category:"Учёба",description:"Хорошее состояние. Можно передать в школе.",nickname:"Alex",className:"8А"},
 {title:"Набор стикеров",price:2,category:"Поделки",description:"Самодельные стикеры.",nickname:"Mila",className:"7Б"},
 {title:"Помощь с презентацией",price:3,category:"Услуги",description:"Помогу оформить школьную презентацию.",nickname:"Dima",className:"9В"}
];

let ads=JSON.parse(localStorage.getItem("schoolAds")||"null")||starterAds;
let user=JSON.parse(localStorage.getItem("schoolUser")||"null");

const $=id=>document.getElementById(id);
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function render(){
  const q=$("search").value.toLowerCase();
  const cat=$("filter").value;
  const shown=ads.filter(a=>
    (cat==="all"||a.category===cat) &&
    `${a.title} ${a.description}`.toLowerCase().includes(q)
  );
  $("count").textContent=`${shown.length} шт.`;
  $("ads").innerHTML=shown.length ? shown.map((a,i)=>`
    <article class="card">
      <span class="tag">${safe(a.category)}</span>
      <h3>${safe(a.title)}</h3>
      <p>${safe(a.description)}</p>
      <div class="price">${Number(a.price).toFixed(2)} €</div>
      <div class="seller">👤 ${safe(a.nickname)} · ${safe(a.className)}</div>
      <button class="buy" onclick="buy(${i})">Хочу купить</button>
    </article>`).join("") : `<div class="empty">Ничего не найдено.</div>`;
}

function openModal(type){
  $("modal").classList.remove("hidden");
  $("authBox").classList.toggle("hidden",type!=="auth");
  $("sellBox").classList.toggle("hidden",type!=="sell");
  $("modalTitle").textContent=type==="sell"?"Новое объявление":"Регистрация / вход";
}

$("profileBtn").onclick=()=>openModal("auth");
$("sellBtn").onclick=()=>user?openModal("sell"):openModal("auth");
$("close").onclick=()=>$("modal").classList.add("hidden");
$("modal").onclick=e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")};

$("login").onclick=()=>{
  const nickname=$("nickname").value.trim();
  const className=$("className").value.trim();
  if(!nickname||!className){alert("Заполни никнейм и класс.");return}
  user={nickname,className};
  localStorage.setItem("schoolUser",JSON.stringify(user));
  $("profileBtn").textContent=`👤 ${nickname}`;
  $("modal").classList.add("hidden");
};

$("publish").onclick=()=>{
  if(!user)return;
  const title=$("adTitle").value.trim();
  const price=Number($("adPrice").value);
  const category=$("adCategory").value;
  const description=$("adDescription").value.trim();
  if(!title||!Number.isFinite(price)||price<0||!description){
    alert("Заполни все поля.");
    return;
  }
  ads.unshift({title,price,category,description,nickname:user.nickname,className:user.className});
  localStorage.setItem("schoolAds",JSON.stringify(ads));
  ["adTitle","adPrice","adDescription"].forEach(id=>$(id).value="");
  $("modal").classList.add("hidden");
  render();
};

function buy(i){
  const a=ads[i];
  alert(`Заявка на покупку\n\n${a.title} — ${Number(a.price).toFixed(2)} €\nПродавец: ${a.nickname} (${a.className})\n\nЭто демонстрационная версия: реальные платежи и сообщения пока не подключены.`);
}

$("search").oninput=render;
$("filter").onchange=render;
if(user)$("profileBtn").textContent=`👤 ${user.nickname}`;
render();
