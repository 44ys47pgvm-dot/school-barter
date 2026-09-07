const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

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

  const title =
    document.getElementById("authTitle");

  const subtitle =
    document.getElementById("authSubtitle");

  const button =
    document.getElementById("authButton");

  const fields =
    document.getElementById("registerFields");

  const switchText =
    document.querySelector(".switch-auth");

  if (registerMode) {

    title.textContent = "🏫 School Barter №52";

    subtitle.textContent =
      "Зарегистрируйся, чтобы пользоваться сайтом";

    button.textContent =
      "Зарегистрироваться";

    fields.classList.remove("hidden");

    switchText.textContent =
      "Уже есть аккаунт? Войти";

  } else {

    title.textContent =
      "👋 Вход в School Barter";

    subtitle.textContent =
      "Войди в свой аккаунт";

    button.textContent =
      "Войти";

    fields.classList.add("hidden");

    switchText.textContent =
      "Нет аккаунта? Зарегистрироваться";
  }
}


async function register() {

  const email =
    document.getElementById("authEmail")
      .value
      .trim();

  const password =
    document.getElementById("authPassword")
      .value;

  if (!email || !password) {
    alert("Введи email и пароль");
    return;
  }

  if (password.length < 6) {
    alert("Пароль должен быть минимум 6 символов");
    return;
  }

  if (!registerMode) {
    await login(email, password);
    return;
  }

  const name =
    document.getElementById("regName")
      .value
      .trim();

  const className =
    document.getElementById("regClass")
      .value
      .trim();

  const building =
    document.getElementById("regBuilding")
      .value;

  if (!name || !className) {
    alert("Заполни имя и класс");
    return;
  }

  const {
    data,
    error
  } = await db.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error(error);
    alert("❌ " + error.message);
    return;
  }

  if (!data.user) {
    alert("Не удалось создать аккаунт");
    return;
  }

  let avatarUrl = null;

  const avatar =
    document.getElementById("regAvatar")
      .files[0];

  if (avatar) {
    avatarUrl =
      await uploadAvatar(
        data.user.id,
        avatar
      );
  }

  const {
    error: profileError
  } = await db
    .from("profiles")
    .insert({
      id: data.user.id,
      name,
      class_name: className,
      building,
      avatar_url: avatarUrl
    });

  if (profileError) {
    console.error(profileError);
    alert(
      "Аккаунт создан, но профиль сохранить не удалось"
    );
    return;
  }

  alert("✅ Регистрация завершена!");

  await checkAuth();
}


async function login(email, password) {

  const {
    error
  } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error(error);
    alert("❌ " + error.message);
    return;
  }

  await checkAuth();
}


async function logout() {

  await db.auth.signOut();

  document
    .getElementById("siteScreen")
    .classList.add("hidden");

  document
    .getElementById("authScreen")
    .classList.remove("hidden");
}


// ================================
// ПРОВЕРКА ВХОДА
// ================================

async function checkAuth() {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) {

    document
      .getElementById("authScreen")
      .classList.remove("hidden");

    document
      .getElementById("siteScreen")
      .classList.add("hidden");

    return;
  }

  document
    .getElementById("authScreen")
    .classList.add("hidden");

  document
    .getElementById("siteScreen")
    .classList.remove("hidden");

  await loadProfile();

  await loadItems();
}


// ================================
// ПРОФИЛЬ
// ================================

async function loadProfile() {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) return;

  const {
    data,
    error
  } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  document.getElementById("profileName").value =
    data.name || "";

  document.getElementById("profileClass").value =
    data.class_name || "";

  document.getElementById("profileBuilding").value =
    data.building || "";

  setAvatar(
    data.avatar_url
  );
}


function setAvatar(url) {

  const defaultAvatar =
    "https://ui-avatars.com/api/?name=User";

  const avatarUrl =
    url || defaultAvatar;

  document.getElementById(
    "profileAvatar"
  ).src = avatarUrl;

  document.getElementById(
    "headerAvatar"
  ).src = avatarUrl;
}


async function saveProfile() {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) {
    alert("Сначала войди в аккаунт");
    return;
  }

  const name =
    document
      .getElementById("profileName")
      .value
      .trim();

  const className =
    document
      .getElementById("profileClass")
      .value
      .trim();

  const building =
    document
      .getElementById("profileBuilding")
      .value;

  let avatarUrl = null;

  const file =
    document
      .getElementById("profileAvatarFile")
      .files[0];

  if (file) {
    avatarUrl =
      await uploadAvatar(
        user.id,
        file
      );
  }

  const updateData = {
    id: user.id,
    name,
    class_name: className,
    building
  };

  if (avatarUrl) {
    updateData.avatar_url =
      avatarUrl;
  }

  const {
    error
  } = await db
    .from("profiles")
    .upsert(updateData);

  if (error) {
    console.error(error);
    alert(
      "❌ Не удалось сохранить профиль"
    );
    return;
  }

  alert("✅ Профиль сохранён");

  await loadProfile();
}


// ================================
// АВАТАРКА
// ================================

async function uploadAvatar(
  userId,
  file
) {

  const extension =
    file.name
      .split(".")
      .pop();

  const filePath =
    `${userId}/avatar.${extension}`;

  const {
    error
  } = await db.storage
    .from("avatars")
    .upload(
      filePath,
      file,
      {
        upsert: true,
        contentType: file.type
      }
    );

  if (error) {
    console.error(
      "Ошибка загрузки аватарки:",
      error
    );

    alert(
      "Аватарку загрузить не получилось"
    );

    return null;
  }

  const {
    data
  } = db.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return data.publicUrl;
}


// ================================
// ОБЪЯВЛЕНИЯ
// ================================

async function loadItems() {

  const output =
    document.getElementById("output");

  output.innerHTML =
    "⏳ Загружаем объявления...";

  const {
    data,
    error
  } = await db
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
    .order(
      "created_at",
      {
        ascending: false
      }
    )
    .limit(100);

  if (error) {

    console.error(error);

    output.innerHTML =
      "❌ Ошибка загрузки объявлений";

    return;
  }

  cachedItems =
    data || [];

  renderItems(
    cachedItems
  );
}


function renderItems(items) {

  const output =
    document.getElementById("output");

  if (!items.length) {

    output.innerHTML =
      "📭 Пока объявлений нет";

    return;
  }

  output.innerHTML =
    items
      .map(item => {

        let price =
          "Бесплатно";

        if (
          item.price_type ===
          "fixed"
        ) {

          price =
            item.price_fixed !== null
              ? `${item.price_fixed} ₽`
              : "Цена не указана";
        }

        if (
          item.price_type ===
          "range"
        ) {

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
              ${escapeHTML(
                item.description || ""
              )}
            </p>

            <div class="info">
              📦 ${escapeHTML(
                item.type || ""
              )}
            </div>

            <div class="info">
              🏫 ${escapeHTML(
                item.class_name || ""
              )}

              ${
                item.building
                  ? " · " +
                    escapeHTML(
                      item.building
                    )
                  : ""
              }

              ${
                item.floor
                  ? " · " +
                    escapeHTML(
                      item.floor
                    ) +
                    " этаж"
                  : ""
              }
            </div>

            ${
              item.contact
                ? `
                  <div class="contact">
                    📱 ${escapeHTML(
                      item.contact_type ||
                      "Контакт"
                    )}:
                    ${escapeHTML(
                      item.contact
                    )}
                  </div>
                `
                : ""
            }

            ${
              item.payment
                ? `
                  <div class="info">
                    💳 ${escapeHTML(
                      item.payment
                    )}
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
      })
      .join("");
}


// ================================
// ПОКУПКА
// ================================

async function buyItem(id) {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) {

    alert(
      "🔒 Чтобы покупать, нужно зарегистрироваться"
    );

    return;
  }

  const item =
    cachedItems.find(
      x => x.id === id
    );

  if (!item) return;

  if (!item.contact) {

    alert(
      "У продавца пока не указан контакт"
    );

    return;
  }

  alert(
    `Свяжись с продавцом:\n\n` +
    `${item.contact_type || "Контакт"}: ` +
    `${item.contact}`
  );
}


// ================================
// ДОБАВЛЕНИЕ ОБЪЯВЛЕНИЯ
// ================================

async function addItem() {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) {

    alert(
      "🔒 Сначала зарегистрируйся"
    );

    return;
  }

  const title =
    document.getElementById("title")
      .value
      .trim();

  const description =
    document.getElementById("description")
      .value
      .trim();

  const type =
    document.getElementById("type")
      .value;

  const className =
    document.getElementById("className")
      .value
      .trim();

  const building =
    document.getElementById("building")
      .value;

  const floor =
    document.getElementById("floor")
      .value
      .trim();

  const priceType =
    document.getElementById("priceType")
      .value;

  const priceFixed =
    document.getElementById("priceFixed")
      .value;

  const priceMin =
    document.getElementById("priceMin")
      .value;

  const priceMax =
    document.getElementById("priceMax")
      .value;

  const contactType =
    document.getElementById("contactType")
      .value;

  const contact =
    document.getElementById("contact")
      .value
      .trim();

  const payment =
    document.getElementById("payment")
      .value
      .trim();

  if (
    !title ||
    !description ||
    !type
  ) {

    alert(
      "Заполни название, описание и тип товара"
    );

    return;
  }

  const newItem = {

    user_id: user.id,

    title,
    description,
    type,

    class_name:
      className || null,

    building:
      building || null,

    floor:
      floor || null,

    price_type:
      priceType || "fixed",

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

    contact_type:
      contactType || null,

    contact:
      contact || null,

    payment:
      payment || null,

    status: "active"
  };

  const {
    error
  } = await db
    .from("объявления")
    .insert(newItem);

  if (error) {

    console.error(error);

    alert(
      "❌ Ошибка размещения:\n" +
      error.message
    );

    return;
  }

  alert(
    "✅ Объявление размещено!"
  );

  document
    .querySelectorAll(
      "#publish input, #publish textarea"
    )
    .forEach(
      element => {
        element.value = "";
      }
    );

  showSection(
    "announcements"
  );

  await loadItems();
}


// ================================
// ЦЕНА
// ================================

function togglePrice() {

  const type =
    document.getElementById(
      "priceType"
    ).value;

  const fixed =
    document.getElementById(
      "priceFixedWrap"
    );

  const range =
    document.getElementById(
      "priceRangeWrap"
    );

  fixed.classList.toggle(
    "hidden",
    type !== "fixed"
  );

  range.classList.toggle(
    "hidden",
    type !== "range"
  );
}


// ================================
// РАЗДЕЛЫ
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
