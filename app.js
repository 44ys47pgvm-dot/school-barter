const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let authMode = "login";
let loadingItems = false;


// =========================
// НАВИГАЦИЯ
// =========================

function showSection(sectionId) {
  const sections = ["home", "items", "profile", "publish"];

  sections.forEach(id => {
    const section = document.getElementById(id);

    if (section) {
      section.classList.toggle("hidden", id !== sectionId);
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (sectionId === "items") {
    loadItems();
  }

  if (sectionId === "profile") {
    updateProfile();
  }
}


// =========================
// АВТОРИЗАЦИЯ
// =========================

function openAuth(mode = "login") {
  authMode = mode;

  const modal = document.getElementById("authModal");
  const title = document.getElementById("authTitle");
  const description = document.getElementById("authDescription");
  const submit = document.getElementById("authSubmit");
  const switchButton = document.getElementById("authSwitch");
  const error = document.getElementById("authError");

  if (!modal) return;

  if (error) {
    error.textContent = "";
    error.classList.add("hidden");
  }

  if (authMode === "login") {
    title.textContent = "Вход";
    description.textContent = "Введи свой ник и пароль.";
    submit.textContent = "Войти";
    switchButton.textContent = "Нет аккаунта? Зарегистрироваться";
  } else {
    title.textContent = "Регистрация";
    description.textContent = "Придумай ник и пароль.";
    submit.textContent = "Зарегистрироваться";
    switchButton.textContent = "Уже есть аккаунт? Войти";
  }

  modal.classList.remove("hidden");
}


function closeAuth() {
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.classList.add("hidden");

  const form = document.getElementById("authForm");

  if (form) {
    form.reset();
  }

  const error = document.getElementById("authError");

  if (error) {
    error.textContent = "";
    error.classList.add("hidden");
  }
}


function switchAuthMode() {
  openAuth(
    authMode === "login"
      ? "register"
      : "login"
  );
}


async function handleAuth(event) {
  event.preventDefault();

  const nickname = document
    .getElementById("authNickname")
    .value
    .trim();

  const password = document
    .getElementById("authPassword")
    .value;

  if (nickname.length < 3) {
    showAuthError("Ник должен содержать минимум 3 символа.");
    return;
  }

  if (nickname.length > 30) {
    showAuthError("Ник должен содержать максимум 30 символов.");
    return;
  }

  if (!/^[a-zA-Zа-яА-ЯёЁ0-9_]+$/.test(nickname)) {
    showAuthError(
      "В нике можно использовать буквы, цифры и _."
    );
    return;
  }

  if (password.length < 6) {
    showAuthError("Пароль должен содержать минимум 6 символов.");
    return;
  }

  showAuthError(
    "Регистрация по нику пока не подключена."
  );
}


function showAuthError(message) {
  const error = document.getElementById("authError");

  if (!error) return;

  error.textContent = message;
  error.classList.remove("hidden");
}


// =========================
// ПРОФИЛЬ
// =========================

function updateProfile() {
  const notLogged = document.getElementById("profileNotLogged");
  const logged = document.getElementById("profileLogged");
  const name = document.getElementById("profileName");

  if (!notLogged || !logged) return;

  if (!currentUser) {
    notLogged.classList.remove("hidden");
    logged.classList.add("hidden");
    return;
  }

  notLogged.classList.add("hidden");
  logged.classList.remove("hidden");

  if (name) {
    name.textContent =
      currentUser.user_metadata?.nickname ||
      currentUser.user_metadata?.name ||
      "Пользователь";
  }
}


async function logout() {
  const { error } = await db.auth.signOut();

  if (error) {
    console.error(error);
    showToast("Не удалось выйти.");
    return;
  }

  currentUser = null;

  updateProfile();

  showToast("Вы вышли из аккаунта.");
}


// =========================
// ПУБЛИКАЦИЯ
// =========================

function requestPublish() {
  if (!currentUser) {
    openAuth("login");
    showToast("Сначала войди в аккаунт.");
    return;
  }

  showSection("publish");
}


function togglePrice() {
  const type = document
    .getElementById("priceType")
    ?.value;

  const fixed = document.getElementById("fixedPrice");
  const range = document.getElementById("rangePrice");

  if (!fixed || !range) return;

  fixed.classList.toggle(
    "hidden",
    type !== "fixed"
  );

  range.classList.toggle(
    "hidden",
    type !== "range"
  );
}


async function addItem(event) {
  event.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const title = document
    .getElementById("title")
    .value
    .trim();

  const description = document
    .getElementById("description")
    .value
    .trim();

  const type = document
    .getElementById("type")
    .value;

  const priceType = document
    .getElementById("priceType")
    .value;

  const priceFixed = document
    .getElementById("priceFixed")
    .value;

  const priceFrom = document
    .getElementById("priceFrom")
    .value;

  const priceTo = document
    .getElementById("priceTo")
    .value;

  const contactType = document
    .getElementById("contactType")
    .value;

  const contact = document
    .getElementById("contact")
    .value
    .trim();

  const payment = document
    .getElementById("payment")
    .value
    .trim();

  if (!title || !description) {
    showToast("Заполни название и описание.");
    return;
  }

  if (priceType === "range" &&
      priceFrom &&
      priceTo &&
      Number(priceFrom) > Number(priceTo)) {

    showToast(
      "Цена «от» не может быть больше цены «до»."
    );

    return;
  }

  const data = {
    user_id: currentUser.id,

    title,
    description,
    type,

    price_type: priceType,

    price_fixed:
      priceType === "fixed"
        ? Number(priceFixed) || null
        : null,

    price_from:
      priceType === "range"
        ? Number(priceFrom) || null
        : null,

    price_to:
      priceType === "range"
        ? Number(priceTo) || null
        : null,

    contact_type: contactType,
    contact: contact || null,
    payment: payment || null,

    status: "active"
  };

  const button = document.querySelector(
    "#publishForm button[type='submit']"
  );

  if (button) {
    button.disabled = true;
  }

  try {
    const { error } = await db
      .from("объявления")
      .insert(data);

    if (error) {
      console.error(
        "Ошибка публикации:",
        error
      );

      showToast(
        "Не удалось разместить объявление."
      );

      return;
    }

    const form = document.getElementById("publishForm");

    if (form) {
      form.reset();
    }

    togglePrice();

    showToast(
      "Объявление опубликовано!"
    );

    showSection("items");

  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}


// =========================
// ЗАГРУЗКА ОБЪЯВЛЕНИЙ
// =========================

async function loadItems() {
  const output = document.getElementById("output");

  if (!output) return;

  if (loadingItems) return;

  loadingItems = true;

  output.innerHTML = `
    <div class="loading">
      <div>
        <div class="spinner"></div>
        Загружаем объявления...
      </div>
    </div>
  `;

  try {
    const request = db
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
      });

    const timeout = new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: null,
          error: {
            message:
              "Сервер не ответил за 8 секунд."
          }
        });
      }, 8000);
    });

    const result = await Promise.race([
      request,
      timeout
    ]);

    const { data, error } = result;

    if (error) {
      console.error(
        "Ошибка загрузки:",
        error
      );

      output.innerHTML = `
        <div class="loading">
          <div>

            <strong>
              Не удалось загрузить объявления
            </strong>

            <br><br>

            <span>
              ${escapeHtml(
                error.message ||
                "Ошибка соединения."
              )}
            </span>

            <br><br>

            <button
              class="primary-btn"
              onclick="loadItems()"
            >
              🔄 Повторить
            </button>

          </div>
        </div>
      `;

      return;
    }

    if (!data || data.length === 0) {
      output.innerHTML = `
        <div class="loading">
          <div>

            Пока объявлений нет.

            <br><br>

            Будь первым! 🚀

            <br><br>

            <button
              class="primary-btn"
              onclick="requestPublish()"
            >
              + Разместить
            </button>

          </div>
        </div>
      `;

      return;
    }

    output.innerHTML = data
      .map(renderItem)
      .join("");

  } catch (error) {
    console.error(
      "Ошибка:",
      error
    );

    output.innerHTML = `
      <div class="loading">
        <div>

          <strong>
            Ошибка соединения
          </strong>

          <br><br>

          Проверь интернет и попробуй ещё раз.

          <br><br>

          <button
            class="primary-btn"
            onclick="loadItems()"
          >
            🔄 Повторить
          </button>

        </div>
      </div>
    `;

  } finally {
    loadingItems = false;
  }
}


// =========================
// КАРТОЧКА ОБЪЯВЛЕНИЯ
// =========================

function renderItem(item) {
  let price = "Договорная";

  if (item.price_type === "free") {
    price = "Бесплатно";

  } else if (
    item.price_type === "fixed" &&
    item.price_fixed !== null
  ) {
    price =
      `${formatNumber(item.price_fixed)} ₽`;

  } else if (
    item.price_type === "range"
  ) {
    const from =
      item.price_from !== null
        ? formatNumber(item.price_from)
        : "?";

    const to =
      item.price_to !== null
        ? formatNumber(item.price_to)
        : "?";

    price =
      `${from} — ${to} ₽`;
  }

  const contact = item.contact
    ? `
      <div class="listing-contact">
        ${escapeHtml(
          item.contact_type ||
          "Контакт"
        )}:
        ${escapeHtml(
          item.contact
        )}
      </div>
    `
    : "";

  return `
    <article class="listing">

      <span class="listing-type">
        ${escapeHtml(
          item.type ||
          "Объявление"
        )}
      </span>

      <h3>
        ${escapeHtml(
          item.title
        )}
      </h3>

      <div class="listing-description">
        ${escapeHtml(
          item.description
        )}
      </div>

      <div class="listing-price">
        ${price}
      </div>

      ${contact}

    </article>
  `;
}


// =========================
// УТИЛИТЫ
// =========================

function formatNumber(value) {
  return Number(value)
    .toLocaleString("ru-RU");
}


function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showToast(message) {
  const toast =
    document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.remove("hidden");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}


// =========================
// ЗАПУСК
// =========================

async function init() {
  try {
    const {
      data: {
        session
      }
    } = await db.auth.getSession();

    currentUser =
      session?.user || null;

    updateProfile();
    togglePrice();

    db.auth.onAuthStateChange(
      (_event, session) => {
        currentUser =
          session?.user || null;

        updateProfile();
      }
    );

  } catch (error) {
    console.error(
      "Ошибка запуска:",
      error
    );
  }
}


init();
