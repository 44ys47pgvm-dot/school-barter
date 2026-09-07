const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const output = document.getElementById("output");

let cachedItems = [];

// ===============================
// Загрузка объявлений
// ===============================

async function loadItems() {
  if (output) {
    output.innerHTML = "⏳ Загружаем объявления...";
  }

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
    console.error("Ошибка загрузки объявлений:", error);

    if (output) {
      output.innerHTML =
        "❌ Не удалось загрузить объявления. Открой консоль браузера для подробностей.";
    }

    return;
  }

  cachedItems = data || [];

  renderItems(cachedItems);
}

// ===============================
// Отображение объявлений
// ===============================

function renderItems(items) {
  if (!output) return;

  if (!items.length) {
    output.innerHTML = "📭 Пока объявлений нет";
    return;
  }

  output.innerHTML = items
    .map((item) => {
      let price = "Бесплатно";

      if (item.price_type === "fixed") {
        price =
          item.price_fixed !== null &&
          item.price_fixed !== undefined
            ? `${item.price_fixed} ₽`
            : "Цена не указана";
      }

      if (item.price_type === "range") {
        price = `${item.price_from ?? "?"}–${item.price_to ?? "?"} ₽`;
      }

      return `
        <div class="listing item">

          <h3>${escapeHTML(item.title)}</h3>

          <div class="price">
            💰 ${escapeHTML(price)}
          </div>

          <p>
            ${escapeHTML(item.description || "")}
          </p>

          <div class="info">
            📦 ${escapeHTML(item.type || "Тип не указан")}
          </div>

          <div class="info">
            🏫 ${escapeHTML(item.class_name || "")}
            ${item.building
              ? " · " + escapeHTML(item.building)
              : ""}
            ${item.floor
              ? " · " + escapeHTML(item.floor) + " этаж"
              : ""}
          </div>

          ${
            item.contact
              ? `
                <div class="contact">
                  📱 ${escapeHTML(item.contact_type || "Контакт")}:
                  ${escapeHTML(item.contact)}
                </div>
              `
              : ""
          }

          ${
            item.payment
              ? `
                <div class="info">
                  💳 ${escapeHTML(item.payment)}
                </div>
              `
              : ""
          }

        </div>
      `;
    })
    .join("");
}

// ===============================
// Добавление объявления
// ===============================

async function addItem() {
  const title =
    document.getElementById("title")?.value.trim();

  const description =
    document.getElementById("description")?.value.trim();

  const type =
    document.getElementById("type")?.value;

  const className =
    document.getElementById("className")?.value.trim();

  const building =
    document.getElementById("building")?.value;

  const floor =
    document.getElementById("floor")?.value.trim();

  const priceType =
    document.getElementById("priceType")?.value;

  const priceFixed =
    document.getElementById("priceFixed")?.value;

  const priceMin =
    document.getElementById("priceMin")?.value;

  const priceMax =
    document.getElementById("priceMax")?.value;

  const contactType =
    document.getElementById("contactType")?.value;

  const contact =
    document.getElementById("contact")?.value.trim();

  const payment =
    document.getElementById("payment")?.value.trim();

  if (!title || !description || !type) {
    alert("Заполни название, описание и тип товара");
    return;
  }

  // Проверяем авторизацию
  const {
    data: { user },
    error: userError
  } = await db.auth.getUser();

  if (userError) {
    console.error("Ошибка проверки пользователя:", userError);
  }

  if (!user) {
    alert("Сначала войди в аккаунт");
    return;
  }

  const newItem = {
    user_id: user.id,

    title,
    description,
    type,

    class_name: className || null,
    building: building || null,
    floor: floor || null,

    price_type: priceType || "fixed",

    price_fixed:
      priceType === "fixed"
        ? Number(priceFixed) || null
        : null,

    price_from:
      priceType === "range"
        ? Number(priceMin) || null
        : null,

    price_to:
      priceType === "range"
        ? Number(priceMax) || null
        : null,

    contact_type: contactType || null,
    contact: contact || null,
    payment: payment || null,

    status: "active"
  };

  const { error } = await db
    .from("объявления")
    .insert(newItem);

  if (error) {
    console.error("Ошибка размещения:", error);

    alert(
      "❌ Не удалось разместить объявление.\n\n" +
      error.message
    );

    return;
  }

  alert("✅ Объявление успешно размещено!");

  // Очищаем поля формы
  document
    .querySelectorAll(
      "#publish input, #publish textarea"
    )
    .forEach((element) => {
      element.value = "";
    });

  // Возвращаем цену к фиксированной
  const priceTypeElement =
    document.getElementById("priceType");

  if (priceTypeElement) {
    priceTypeElement.value = "fixed";
  }

  togglePrice();

  // Обновляем объявления
  await loadItems();

  // Показываем объявления
  showSection("announcements");
}

// ===============================
// Защита HTML
// ===============================

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ===============================
// Переключение разделов
// ===============================

function showSection(id) {
  document
    .querySelectorAll("section")
    .forEach((section) => {
      section.style.display =
        section.id === id ? "block" : "none";
    });
}

// ===============================
// Профиль
// ===============================

function showProfile() {
  showSection("profile");
}

// ===============================
// Меню
// ===============================

function showMenu() {
  showSection("menu");
}

// ===============================
// Размещение объявления
// ===============================

function showPublish() {
  showSection("publish");
}

// ===============================
// Цена
// ===============================

function togglePrice() {
  const type =
    document.getElementById("priceType")?.value;

  const fixed =
    document.getElementById("priceFixedWrap");

  const range =
    document.getElementById("priceRangeWrap");

  if (fixed) {
    fixed.style.display =
      type === "fixed" ? "block" : "none";
  }

  if (range) {
    range.style.display =
      type === "range" ? "block" : "none";
  }
}

// ===============================
// Сохранение профиля
// ===============================

async function saveProfile() {
  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("Сначала войди в аккаунт");
    return;
  }

  const name =
    document
      .getElementById("profileName")
      ?.value
      .trim() || "";

  const className =
    document
      .getElementById("profileClass")
      ?.value
      .trim() || "";

  const building =
    document
      .getElementById("profileBuilding")
      ?.value || "";

  const { error } = await db
    .from("profiles")
    .upsert({
      id: user.id,
      name,
      class_name: className,
      building
    });

  if (error) {
    console.error(
      "Ошибка сохранения профиля:",
      error
    );

    alert(
      "❌ Не удалось сохранить профиль.\n\n" +
      error.message
    );

    return;
  }

  alert("✅ Профиль сохранён");
}

// ===============================
// Запуск сайта
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadItems();
    togglePrice();
  }
);
