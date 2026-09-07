const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let authMode = "login";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Ошибка получения сессии:", error);
  }

  currentUser = data?.session?.user || null;

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateProfileUI();
    loadItems();
  });

  updateProfileUI();
  togglePrice();
  await loadItems();
}

function showSection(id) {
  const sections = document.querySelectorAll("main > section");

  sections.forEach(section => {
    section.classList.add("hidden");
  });

  const target = document.getElementById(id);

  if (target) {
    target.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showProfile() {
  showSection("profile");
  loadProfile();
}

function requestPublish() {
  if (!currentUser) {
    openAuth("register");
    return;
  }

  showSection("publish");
}

function openAuth(mode = "login") {
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("open");

  setAuthMode(mode);
}

function closeAuth() {
  const modal = document.getElementById("authModal");

  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("open");
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";

  const title = document.getElementById("authTitle");
  const nameBlock = document.getElementById("registerNameBlock");
  const submit = document.getElementById("authSubmit");
  const switchLink = document.getElementById("authSwitch");
  const nameInput = document.getElementById("authName");

  if (title) {
    title.textContent =
      authMode === "login"
        ? "🔐 Войти"
        : "📝 Регистрация";
  }

  if (nameBlock) {
    nameBlock.classList.toggle(
      "hidden",
      authMode !== "register"
    );
  }

  if (submit) {
    submit.textContent =
      authMode === "login"
        ? "Войти"
        : "Зарегистрироваться";
  }

  if (switchLink) {
    switchLink.textContent =
      authMode === "login"
        ? "Нет аккаунта? Зарегистрироваться"
        : "Уже есть аккаунт? Войти";
  }

  if (nameInput && authMode === "login") {
    nameInput.value = "";
  }
}

function toggleAuthMode() {
  setAuthMode(
    authMode === "login"
      ? "register"
      : "login"
  );
}

async function handleAuth() {
  if (authMode === "register") {
    await register();
  } else {
    await login();
  }
}

async function register() {
  const nickname =
    document.getElementById("authName")?.value.trim();

  const email =
    document.getElementById("authEmail")?.value.trim();

  const password =
    document.getElementById("authPassword")?.value;

  if (!nickname || !email || !password) {
    alert("Заполни ник, email и пароль.");
    return;
  }

  if (nickname.length < 2) {
    alert("Ник должен содержать минимум 2 символа.");
    return;
  }

  if (password.length < 6) {
    alert("Пароль должен содержать минимум 6 символов.");
    return;
  }

  const { data, error } =
    await db.auth.signUp({
      email,
      password
    });

  if (error) {
    alert(error.message);
    return;
  }

  if (!data?.user) {
    alert("Не удалось создать аккаунт.");
    return;
  }

  /*
   * Если в Supabase включено подтверждение email,
   * session может быть null до подтверждения почты.
   * Профиль всё равно можно создать через запрос,
   * если RLS разрешает это для текущей сессии.
   */

  if (data.session) {
    const { error: profileError } =
      await db
        .from("profiles")
        .upsert({
          id: data.user.id,
          name: nickname
        });

    if (profileError) {
      console.error(profileError);
      alert(
        "Аккаунт создан, но профиль не сохранился: " +
        profileError.message
      );
      return;
    }

    currentUser = data.user;

    closeAuth();
    updateProfileUI();
    showProfile();

    alert("Аккаунт создан.");
  } else {
    alert(
      "Аккаунт создан. Проверь почту и подтверди email, затем войди на сайт."
    );

    closeAuth();
  }
}

async function login() {
  const email =
    document.getElementById("authEmail")?.value.trim();

  const password =
    document.getElementById("authPassword")?.value;

  if (!email || !password) {
    alert("Введи email и пароль.");
    return;
  }

  const { data, error } =
    await db.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = data?.user || null;

  closeAuth();
  updateProfileUI();
  showProfile();
}

async function logout() {
  const { error } =
    await db.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = null;

  updateProfileUI();
  showSection("home");
}

async function updateProfileUI() {
  const notLogged =
    document.getElementById("profileNotLogged");

  const logged =
    document.getElementById("profileLogged");

  if (!currentUser) {
    if (notLogged) {
      notLogged.classList.remove("hidden");
    }

    if (logged) {
      logged.classList.add("hidden");
    }

    return;
  }

  if (notLogged) {
    notLogged.classList.add("hidden");
  }

  if (logged) {
    logged.classList.remove("hidden");
  }

  const email =
    document.getElementById("profileEmail");

  if (email) {
    email.textContent =
      currentUser.email || "";
  }

  await loadProfile();
}

async function loadProfile() {
  if (!currentUser) return;

  const input =
    document.getElementById("profileName");

  if (!input) return;

  const { data, error } =
    await db
      .from("profiles")
      .select("name")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (error) {
    console.error("Ошибка загрузки профиля:", error);
    return;
  }

  input.value = data?.name || "";
}

async function saveProfile(event) {
  if (event) {
    event.preventDefault();
  }

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const nickname =
    document.getElementById("profileName")
      ?.value.trim();

  if (!nickname) {
    alert("Введи ник.");
    return;
  }

  const { error } =
    await db
      .from("profiles")
      .upsert({
        id: currentUser.id,
        name: nickname
      });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Профиль сохранён.");
}

async function loadItems() {
  const list =
    document.getElementById("output");

  if (!list) return;

  list.innerHTML =
    "<p>Загрузка объявлений...</p>";

  const { data, error } =
    await db
      .from("объявления")
      .select("*")
      .eq("status", "active")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error("Ошибка загрузки объявлений:", error);

    list.innerHTML =
      `<p>Ошибка загрузки объявлений.</p>
       <p style="color:#777;font-size:13px;">
         ${escapeHTML(error.message)}
       </p>`;

    return;
  }

  renderItems(data || []);
}

function renderItems(items) {
  const list =
    document.getElementById("output");

  if (!list) return;

  if (!items.length) {
    list.innerHTML =
      '<div class="empty">Объявлений пока нет.</div>';

    return;
  }

  list.innerHTML = items.map(item => {
    let price = "Бесплатно";

    if (
      item.price_type === "fixed" &&
      item.price_fixed != null
    ) {
      price = `${item.price_fixed} ₽`;
    }

    if (item.price_type === "range") {
      const from =
        item.price_from != null
          ? `${item.price_from} ₽`
          : "";

      const to =
        item.price_to != null
          ? `${item.price_to} ₽`
          : "";

      if (from && to) {
        price = `${from} – ${to}`;
      } else {
        price =
          from ||
          to ||
          "Цена не указана";
      }
    }

    const contactHTML =
      item.contact
        ? `<div class="contact">
             <strong>Контакт:</strong>
             ${escapeHTML(item.contact_type || "")}
             —
             ${escapeHTML(item.contact)}
           </div>`
        : "";

    const paymentHTML =
      item.payment
        ? `<p>
             <strong>Оплата:</strong>
             ${escapeHTML(item.payment)}
           </p>`
        : "";

    return `
      <article class="listing">
        <span class="type">
          ${escapeHTML(item.type || "Другое")}
        </span>

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <p>
          ${escapeHTML(item.description)}
        </p>

        <div class="price">
          ${escapeHTML(price)}
        </div>

        ${paymentHTML}

        ${contactHTML}

        <button
          class="buy"
          type="button"
          onclick="requestBuy(${Number(item.id)})"
        >
          ${currentUser
            ? "Купить / связаться"
            : "Войти для покупки"}
        </button>
      </article>
    `;
  }).join("");
}

async function requestBuy(id) {
  if (!currentUser) {
    openAuth("login");
    return;
  }

  const { data, error } =
    await db
      .from("объявления")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    alert(error.message);
    return;
  }

  if (!data) {
    alert("Объявление не найдено.");
    return;
  }

  if (data.user_id === currentUser.id) {
    alert("Это твоё объявление.");
    return;
  }

  let message =
    `Объявление: ${data.title}`;

  if (data.contact_type && data.contact) {
    message +=
      `\n${data.contact_type}: ${data.contact}`;
  }

  if (data.payment) {
    message +=
      `\nОплата: ${data.payment}`;
  }

  alert(message);
}

async function addItem(event) {
  if (event) {
    event.preventDefault();
  }

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const title =
    document.getElementById("title")
      ?.value.trim();

  const description =
    document.getElementById("description")
      ?.value.trim();

  const type =
    document.getElementById("type")
      ?.value;

  const priceType =
    document.getElementById("priceType")
      ?.value || "fixed";

  const contactType =
    document.getElementById("contactType")
      ?.value || null;

  const contact =
    document.getElementById("contact")
      ?.value.trim() || null;

  const payment =
    document.getElementById("payment")
      ?.value.trim() || null;

  if (!title || !description || !type) {
    alert(
      "Заполни название, описание и тип товара."
    );
    return;
  }

  const row = {
    user_id: currentUser.id,
    title,
    description,
    type,
    price_type: priceType,
    price_fixed: null,
    price_from: null,
    price_to: null,
    contact_type: contactType,
    contact,
    payment,
    status: "active"
  };

  if (priceType === "fixed") {
    const value =
      document.getElementById("priceFixed")
        ?.value;

    if (value === "") {
      alert("Укажи цену.");
      return;
    }

    row.price_fixed = Number(value);
  }

  if (priceType === "range") {
    const from =
      document.getElementById("priceFrom")
        ?.value;

    const to =
      document.getElementById("priceTo")
        ?.value;

    if (from === "" && to === "") {
      alert("Укажи хотя бы одну границу цены.");
      return;
    }

    row.price_from =
      from === ""
        ? null
        : Number(from);

    row.price_to =
      to === ""
        ? null
        : Number(to);

    if (
      row.price_from !== null &&
      row.price_to !== null &&
      row.price_from > row.price_to
    ) {
      alert(
        "Цена «от» не может быть больше цены «до»."
      );
      return;
    }
  }

  const { error } =
    await db
      .from("объявления")
      .insert(row);

  if (error) {
    console.error("Ошибка публикации:", error);
    alert(error.message);
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("type").value = "";
  document.getElementById("priceType").value = "fixed";
  document.getElementById("priceFixed").value = "";
  document.getElementById("priceFrom").value = "";
  document.getElementById("priceTo").value = "";
  document.getElementById("contact").value = "";
  document.getElementById("payment").value = "";

  togglePrice();

  await loadItems();

  showSection("home");

  alert("Объявление опубликовано.");
}

function togglePrice() {
  const type =
    document.getElementById("priceType")
      ?.value;

  const fixed =
    document.getElementById("fixedPrice");

  const range =
    document.getElementById("rangePrice");

  if (fixed) {
    fixed.style.display =
      type === "fixed"
        ? "block"
        : "none";
  }

  if (range) {
    range.style.display =
      type === "range"
        ? "block"
        : "none";
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.showSection = showSection;
window.showProfile = showProfile;
window.requestPublish = requestPublish;
window.requestBuy = requestBuy;

window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.setAuthMode = setAuthMode;
window.toggleAuthMode = toggleAuthMode;
window.handleAuth = handleAuth;

window.register = register;
window.login = login;
window.logout = logout;

window.loadProfile = loadProfile;
window.saveProfile = saveProfile;

window.loadItems = loadItems;
window.renderItems = renderItems;

window.addItem = addItem;
window.togglePrice = togglePrice;
