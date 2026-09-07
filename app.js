const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";

// ОСТАВЬ ЗДЕСЬ СВОЙ УЖЕ ИСПОЛЬЗУЕМЫЙ PUBLISHABLE KEY
const SUPABASE_KEY = "sb_publishable_...";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let cachedItems = [];
let registerMode = true;


// ================================
// АВТОРИЗАЦИЯ
// ================================

function toggleAuthMode() {
  registerMode = !registerMode;

  document.getElementById("registerFields")
    .classList.toggle("hidden", !registerMode);

  document.getElementById("authButton").textContent =
    registerMode ? "Зарегистрироваться" : "Войти";

  document.getElementById("authSubtitle").textContent =
    registerMode
      ? "Зарегистрируйся, чтобы пользоваться сайтом"
      : "Войди в свой аккаунт";

  document.getElementById("switchAuthText").textContent =
    registerMode
      ? "Уже есть аккаунт? Войти"
      : "Нет аккаунта? Зарегистрироваться";
}


async function handleAuth() {
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;

  if (!email || !password) {
    alert("Введи email и пароль");
    return;
  }

  if (password.length < 6) {
    alert("Пароль должен содержать минимум 6 символов");
    return;
  }

  if (registerMode) {
    await register(email, password);
  } else {
    await login(email, password);
  }
}


async function register(email, password) {
  const name = document.getElementById("regName").value.trim();

  if (!name) {
    alert("Введи своё имя");
    return;
  }

  const { data, error } = await db.auth.signUp({
    email,
    password
  });

  if (error) {
    alert("❌ " + error.message);
    return;
  }

  if (!data.user) {
    alert("❌ Не удалось создать аккаунт");
    return;
  }

  const { error: profileError } = await db
    .from("profiles")
    .upsert({
      id: data.user.id,
      name: name
    });

  if (profileError) {
    alert(
      "Аккаунт создан, но профиль не сохранился:\n" +
      profileError.message
    );
    return;
  }

  alert("✅ Регистрация завершена!");

  await checkAuth();
}


async function login(email, password) {
  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("❌ " + error.message);
    return;
  }

  await checkAuth();
}


async function logout() {
  const { error } = await db.auth.signOut();

  if (error) {
    alert("❌ Не удалось выйти");
    return;
  }

  document.getElementById("siteScreen").classList.add("hidden");
  document.getElementById("authScreen").classList.remove("hidden");

  document.getElementById("authEmail").value = "";
  document.getElementById("authPassword").value = "";
}


// ================================
// ПРОВЕРКА ВХОДА
// ================================

async function checkAuth() {
  const {
    data: { user }
  } = await db.auth.getUser();

  const authScreen = document.getElementById("authScreen");
  const siteScreen = document.getElementById("siteScreen");

  if (!user) {
    authScreen.classList.remove("hidden");
    siteScreen.classList.add("hidden");
    return;
  }

  authScreen.classList.add("hidden");
  siteScreen.classList.remove("hidden");

  await loadProfile();
  await loadItems();
}


// ================================
// ПРОФИЛЬ
// ================================

async function loadProfile() {
  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) return;

  const { data, error } = await db
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("profileName").value =
    data?.name || "";
}


async function saveProfile() {
  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("Сначала войди в аккаунт");
    return;
  }

  const name =
    document.getElementById("profileName").value.trim();

  if (!name) {
    alert("Имя не может быть пустым");
    return;
  }

  const { error } = await db
    .from("profiles")
    .upsert({
      id: user.id,
      name
    });

  if (error) {
    alert("❌ " + error.message);
    return;
  }

  alert("✅ Профиль сохранён");
}


// ================================
// ОБЪЯВЛЕНИЯ
// ================================

async function loadItems() {
  const output = document.getElementById("output");

  output.innerHTML = "⏳ Загружаем объявления...";

  const { data, error } = await db
    .from("объявления")
    .select(`
      id,
      title,
      description,
      type,
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
    .order("created_at", {
      ascending: false
    })
    .limit(100);

  if (error) {
    console.error(error);

    output.innerHTML =
      "❌ Ошибка загрузки объявлений:<br>" +
      escapeHTML(error.message);

    return;
  }

  cachedItems = data || [];

  renderItems(cachedItems);
}


function renderItems(items) {
  const output = document.getElementById("output");

  if (!items.length) {
    output.innerHTML = "📭 Пока объявлений нет";
    return;
  }

  output.innerHTML = items.map(item => {
    let price = "Бесплатно";

    if (item.price_type === "fixed") {
      price =
        item.price_fixed !== null
          ? `${item.price_fixed} ₽`
          : "Цена не указана";
    }

    if (item.price_type === "range") {
      price =
        `${item.price_from ?? "?"}–${item.price_to ?? "?"} ₽`;
    }

    return `
      <div class="listing">

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <div class="price">
          💰 ${escapeHTML(price)}
        </div>

        <p>
          ${escapeHTML(item.description)}
        </p>

        <div class="info">
          📦 ${escapeHTML(item.type)}
        </div>

        ${
          item.contact
            ? `
              <div class="contact">
                📱 ${escapeHTML(
                  item.contact_type || "Контакт"
                )}:
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

        <button
          class="buy-button"
          onclick="buyItem(${item.id})"
        >
          🛒 Купить / связаться
        </button>

      </div>
    `;
  }).join("");
}


// ================================
// КУПИТЬ
// ================================

async function buyItem(id) {
  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("🔒 Сначала войди в аккаунт");
    return;
  }

  const item = cachedItems.find(
    item => item.id === id
  );

  if (!item) {
    alert("Объявление не найдено");
    return;
  }

  if (!item.contact) {
    alert("У продавца пока нет контакта");
    return;
  }

  alert(
    `Свяжись с продавцом:\n\n` +
    `${item.contact_type || "Контакт"}: ${item.contact}`
  );
}


// ================================
// СОЗДАНИЕ ОБЪЯВЛЕНИЯ
// ================================

async function addItem() {
  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) {
    alert("🔒 Сначала войди в аккаунт");
    return;
  }

  const title =
    document.getElementById("title").value.trim();

  const description =
    document.getElementById("description").value.trim();

  const type =
    document.getElementById("type").value;

  const priceType =
    document.getElementById("priceType").value;

  const priceFixed =
    document.getElementById("priceFixed").value;

  const priceMin =
    document.getElementById("priceMin").value;

  const priceMax =
    document.getElementById("priceMax").value;

  const contactType =
    document.getElementById("contactType").value;

  const contact =
    document.getElementById("contact").value.trim();

  const payment =
    document.getElementById("payment").value.trim();


  if (!title || !description || !type) {
    alert(
      "Заполни название, описание и тип товара"
    );
    return;
  }


  if (priceType === "fixed" && !priceFixed) {
    alert("Укажи цену");
    return;
  }


  if (
    priceType === "range" &&
    (!priceMin || !priceMax)
  ) {
    alert(
      "Укажи минимальную и максимальную цену"
    );
    return;
  }


  if (!contact) {
    alert("Укажи Telegram или телефон");
    return;
  }


  const announcement = {
    user_id: user.id,

    title,
    description,
    type,

    price_type: priceType,

    price_fixed:
      priceType === "fixed"
        ? Number(priceFixed)
        : null,

    price_from:
      priceType === "range"
        ? Number(priceMin)
        : null,

    price_to:
      priceType === "range"
        ? Number(priceMax)
        : null,

    contact_type: contactType,
    contact: contact,
    payment: payment || null,

    status: "active"
  };


  const { error } = await db
    .from("объявления")
    .insert(announcement);


  if (error) {
    console.error(error);

    alert(
      "❌ Не удалось разместить объявление:\n" +
      error.message
    );

    return;
  }


  alert("✅ Объявление размещено!");


  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("type").value = "";
  document.getElementById("priceFixed").value = "";
  document.getElementById("priceMin").value = "";
  document.getElementById("priceMax").value = "";
  document.getElementById("contact").value = "";
  document.getElementById("payment").value = "";

  document.getElementById("priceType").value = "fixed";

  togglePrice();

  showSection("announcements");

  await loadItems();
}


// ================================
// ЦЕНА
// ================================

function togglePrice() {
  const type =
    document.getElementById("priceType").value;

  document
    .getElementById("priceFixedWrap")
    .classList.toggle(
      "hidden",
      type !== "fixed"
    );

  document
    .getElementById("priceRangeWrap")
    .classList.toggle(
      "hidden",
      type !== "range"
    );
}


// ================================
// НАВИГАЦИЯ
// ================================

function showSection(id) {
  document
    .querySelectorAll("main section")
    .forEach(section => {
      section.classList.toggle(
        "hidden",
        section.id !== id
      );
    });
}


function showProfile() {
  showSection("profile");
}


function showMenu() {
  showSection("menu");
}


function showPublish() {
  showSection("publish");
  togglePrice();
}


// ================================
// ЗАЩИТА HTML
// ================================

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ================================
// ЗАПУСК
// ================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    togglePrice();

    await checkAuth();

    db.auth.onAuthStateChange(
      async () => {
        await checkAuth();
      }
    );
  }
);
