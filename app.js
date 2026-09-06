const SUPABASE_URL = 'https://psyqffckpcajzdzkcboh.supabase.co';
const SUPABASE_KEY = 'ТВОЙ_PUBLISHABLE_KEY';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function loadItems() {
  const out = document.getElementById('output');
  out.innerHTML = '⏳ Загрузка...';

  const { data, error } = await supabaseClient
    .from('объявления')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    out.innerHTML = '❌ Ошибка: ' + error.message;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    out.innerHTML = '📭 Объявлений пока нет';
    return;
  }

  out.innerHTML = data.map(item => `
    <div class="item">
      <h3>${escapeHtml(item.title || 'Без названия')}</h3>

      <strong>
        ${escapeHtml(item.price || '?')} ₽
      </strong>

      <p>
        ${escapeHtml(item.description || '')}
      </p>

      <small>
        ${item.created_at
          ? new Date(item.created_at).toLocaleString('ru-RU')
          : ''}
      </small>

      <button
        class="btn btn-danger"
        onclick="deleteItem('${item.id}')">
        Удалить
      </button>
    </div>
  `).join('');
}


async function addItem() {
  const title = document.getElementById('title').value.trim();
  const price = document.getElementById('price').value.trim();
  const description = document.getElementById('desc').value.trim();

  if (!title) {
    alert('Название обязательно!');
    return;
  }

  const { error } = await supabaseClient
    .from('объявления')
    .insert([
      {
        title: title,
        price: price,
        description: description
      }
    ]);

  if (error) {
    alert('❌ Ошибка: ' + error.message);
    console.error(error);
    return;
  }

  alert('✅ Объявление опубликовано!');

  document.getElementById('title').value = '';
  document.getElementById('price').value = '';
  document.getElementById('desc').value = '';

  loadItems();
}


async function deleteItem(id) {
  if (!confirm('Удалить это объявление?')) {
    return;
  }

  const { error } = await supabaseClient
    .from('объявления')
    .delete()
    .eq('id', id);

  if (error) {
    alert('❌ Не удалось удалить: ' + error.message);
    console.error(error);
    return;
  }

  loadItems();
}


function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


loadItems();
