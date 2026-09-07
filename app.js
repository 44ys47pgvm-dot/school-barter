const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const output = document.getElementById("output");

let cachedItems = [];

// Быстрая загрузка объявлений
async function loadItems() {
  output.innerHTML = "⏳ Загружаем...";

  const { data, error } = await db
    .from("объявления")
    .select(`
      id,
      title,
      description,
      type,
      class_name,
      building,
      floor,
      price_type,
      price_fixed,
      price_from,
      price_to,
      contact_type,
      contact,
      payment,
      created_at
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    output.innerHTML = "❌ Не удалось загрузить объявления";
    return;
  }

  cachedItems = data || [];
  renderItems(cachedItems);
}

// Отрисовка без нового запроса к базе
function renderItems(items) {
  if (!items.length) {
    output.innerHTML = "📭 Пока объявлений нет";
    return;
  }

  output.innerHTML = items.map(item => {
    let price = "Бесплатно";

    if (item.price_type === "fixed") {
      price = item.price_fixed
        ? `${item.price_fixed} ₽`
        : "Цена не указана";
    }

    if (item.price_type === "range") {
      price = `${item.price_from || "?"}–${item.price_to || "?"} ₽`;
    }

    return `
      <div class="listing">
        <h3>${escapeHTML(item.title)}</h3>

        <div class="price">💰 ${escapeHTML(price)}</div>

        <p>${escapeHTML(item.description || "")}</p>

        <div>
          📦 ${escapeHTML(item.type || "Не указан")}
        </div>

        <div>
          🏫 ${escapeHTML(item.class_name || "")}
          ${item.building ? " · " + escapeHTML(item.building) : ""}
          ${item.floor ? " · " + escapeHTML(item.floor) + " этаж" : ""}
        </div>

        ${
          item.contact
            ? `<div>📱 ${escapeHTML(item.contact_type || "Контакт")}: ${escapeHTML(item.contact)}</div>`
            : ""
        }

        ${
          item.payment
            ? `<div>💳 ${escapeHTML(item.payment)}</div>`
            : ""
        }
      </div>
    `;
  }).join("");
}

// Добавление объявления
async function addItem() {
  const title = document.getElementById("title")?.value.trim();
  const description = document.getElementById("description")?.value.trim();
  const type = document.getElementById("type")?.value;
  const className = document.getElementById("className")?.value.trim();
  const building = document.getElementById("building")?.value;
  const floor = document.getElementById("floor")?.value.trim();

  const priceType = document.getElementById("priceType")?.value;
  const priceFixed = document.getElementById("priceFixed")?.value;
  const priceMin = document.getElementById("priceMin")?.value;
  const priceMax = document.getElementById("priceMax")?.value;

  const contactType = document.getElementById("contactType")?.value;
  const contact = document.getElementById("contact")?.value.trim();
  const payment = document.getElementById("payment")?.value.trim();

  if (!title || !description || !type) {
    alert("Заполни название, описание и тип товара");
    return;
  }

  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("Сначала войди в аккаунт");
    return;
  }

  const newItem = {
    user_id: user.id,
    title,
    description,
    type,
    class_name: className,
    building,
    floor,
    price_type: priceType || "fixed",
    price_fixed: priceType === "fixed" ? Number(priceFixed) || null : null,
    price_from: priceType === "range" ? Number(priceMin) || null : null,
    price_to: priceType === "range" ? Number(priceMax) || null : null,
    contact_type: contactType,
    contact,
    payment,
    status: "active"
  };

  const { error } = await db
    .from("объявления")
    .insert(newItem);

  if (error) {
    console.error(error);
    alert("❌ Ошибка при размещении");
    return;
  }

  alert("✅ Объявление размещено!");

  document.querySelectorAll("input, textarea").forEach(el => {
    el.value = "";
  });

  // Только один запрос после добавления
  await loadItems();
}

// Защита от вставки HTML
function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Загружаем сразу после открытия страницы
document.addEventListener("DOMContentLoaded", () => {
  loadItems();
});
