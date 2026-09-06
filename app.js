const SUPABASE_URL = 'ТВОЙ_SUPABASE_URL';
const SUPABASE_KEY = 'ТВОЙ_PUBLISHABLE_KEY';

const client = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


const $ = id => document.getElementById(id);


function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}


function hidePanels() {
  ['profile', 'menu', 'publish'].forEach(id => {
    $(id).classList.add('hidden');
  });
}


function showPublish() {
  hidePanels();
  $('publish').classList.remove('hidden');
}


function showProfile() {
  hidePanels();
  $('profile').classList.remove('hidden');
  loadProfile();
}


function showMenu() {
  hidePanels();
  $('menu').classList.remove('hidden');
}


function togglePrice() {
  const type = $('priceType').value;

  $('fixedPrice').classList.toggle(
    'hidden',
    type !== 'fixed'
  );

  $('priceFrom').classList.toggle(
    'hidden',
    type !== 'range'
  );

  $('priceTo').classList.toggle(
    'hidden',
    type !== 'range'
  );
}


function loadProfile() {
  const profile = JSON.parse(
    localStorage.getItem('school52_profile') || '{}'
  );

  $('profileName').value = profile.name || '';
  $('profileClass').value = profile.className || '';
  $('profileBuilding').value =
    profile.building || 'Старый';
}


function saveProfile() {
  localStorage.setItem(
    'school52_profile',
    JSON.stringify({
      name: $('profileName').value.trim(),
      className: $('profileClass').value.trim(),
      building: $('profileBuilding').value
    })
  );

  alert('✅ Профиль сохранён');
}


function getPrice() {
  const type = $('priceType').value;

  if (type === 'free') {
    return {
      price_type: 'free',
      price_fixed: null,
      price_from: null,
      price_to: null
    };
  }

  if (type === 'range') {
    const from =
      $('priceMin').value === ''
        ? null
        : Number($('priceMin').value);

    const to =
      $('priceMax').value === ''
        ? null
        : Number($('priceMax').value);

    return {
      price_type: 'range',
      price_fixed: null,
      price_from: from,
      price_to: to
    };
  }

  const fixed =
    $('priceFixed').value === ''
      ? null
      : Number($('priceFixed').value);

  return {
    price_type: 'fixed',
    price_fixed: fixed,
    price_from: null,
    price_to: null
  };
}


function formatPrice(item) {

  if (item.price_type === 'free') {
    return 'Бесплатно';
  }

  if (item.price_type === 'range') {
    if (
      item.price_from != null &&
      item.price_to != null
    ) {
      return `${item.price_from}–${item.price_to} ₽`;
    }

    if (item.price_from != null) {
      return `от ${item.price_from} ₽`;
    }

    if (item.price_to != null) {
      return `до ${item.price_to} ₽`;
    }

    return 'Цена не указана';
  }

  if (item.price_fixed != null) {
    return `${item.price_fixed} ₽`;
  }

  return 'Цена не указана';
}


async function loadItems() {

  const output = $('output');

  output.innerHTML = '⏳ Загружаю объявления...';


  const { data, error } = await client
    .from('объявления')
    .select('*')
    .order('created_at', {
      ascending: false
    });


  if (error) {

    output.innerHTML =
      '❌ Ошибка загрузки: ' +
      esc(error.message);

    console.error(error);

    return;
  }


  if (!data || data.length === 0) {

    output.innerHTML =
      '📭 Пока нет объявлений.';

    return;
  }


  output.innerHTML = data.map(item => `

    <article class="item">

      <h3>
        ${esc(item.title)}
      </h3>


      <div class="info">
        🏷️ ${esc(item.type || 'Тип не указан')}
      </div>


      <div class="info">
        🎓 Класс:
        ${esc(item.class_name || '—')}
      </div>


      <div class="info">
        🏫 Корпус:
        ${esc(item.building || '—')}
      </div>


      <div class="info">
        🏢 Этаж:
        ${esc(item.floor || '—')}
      </div>


      <div class="price">
        💰 ${esc(formatPrice(item))}
      </div>


      <p>
        ${esc(item.description || '')}
      </p>


      ${
        item.contact
          ? `
            <div class="contact">
              📞 ${
                item.contact_type === 'telegram'
                  ? 'Telegram'
                  : 'Телефон'
              }:
              <b>${esc(item.contact)}</b>
            </div>
          `
          : ''
      }


      ${
        item.payment
          ? `
            <div class="info">
              💳 По поводу оплаты:
              ${esc(item.payment)}
            </div>
          `
          : ''
      }


      <div class="info">
        ${
          item.created_at
            ? new Date(
                item.created_at
              ).toLocaleString('ru-RU')
            : ''
        }
      </div>

    </article>

  `).join('');
}


async function addItem() {

  const title =
    $('title').value.trim();

  const description =
    $('description').value.trim();


  if (!title) {
    alert('❌ Введи название товара.');
    return;
  }


  if (!description) {
    alert('❌ Введи описание.');
    return;
  }


  const price = getPrice();


  const numbers = [
    price.price_fixed,
    price.price_from,
    price.price_to
  ].filter(v => v !== null);


  if (
    numbers.some(
      v => !Number.isFinite(v) || v < 0
    )
  ) {
    alert('❌ Проверь цену.');
    return;
  }


  if (
    price.price_type === 'range' &&
    price.price_from !== null &&
    price.price_to !== null &&
    price.price_from > price.price_to
  ) {
    alert('❌ Цена «от» не может быть больше цены «до».');
    return;
  }


  const row = {

    title,

    description,

    type: $('type').value,

    class_name:
      $('className').value.trim(),

    building:
      $('building').value,

    floor:
      $('floor').value,

    price_type:
      price.price_type,

    price_fixed:
      price.price_fixed,

    price_from:
      price.price_from,

    price_to:
      price.price_to,

    contact_type:
      $('contactType').value,

    contact:
      $('contact').value.trim(),

    payment:
      $('payment').value.trim()
  };


  const { error } = await client
    .from('объявления')
    .insert([row]);


  if (error) {

    alert(
      '❌ Не удалось разместить: ' +
      error.message
    );

    console.error(error);

    return;
  }


  [
    'title',
    'description',
    'className',
    'floor',
    'priceFixed',
    'priceMin',
    'priceMax',
    'contact',
    'payment'
  ].forEach(id => {
    $(id).value = '';
  });


  $('type').value = 'Продам';
  $('building').value = 'Старый';
  $('priceType').value = 'fixed';
  $('contactType').value = 'telegram';

  togglePrice();


  hidePanels();

  await loadItems();

  alert('✅ Объявление размещено!');
}


togglePrice();
loadItems();
