const SUPABASE_URL = "https://psyqffckpcajzdzkcboh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Npm2bjIqxtACscbdjxHbFA_NCqknFxv";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const { data } = await db.auth.getSession();
  currentUser = data.session?.user || null;

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateProfileUI();
  });

  updateProfileUI();
  await loadItems();
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(el => {
    el.classList.remove("active");
  });

  document.getElementById(id)?.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
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

  modal.classList.add("open");
  setAuthMode(mode);
}

function closeAuth() {
  document.getElementById("authModal")?.classList.remove("open");
}

function setAuthMode(mode) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const title = document.getElementById("authTitle");

  if (loginForm) {
    loginForm.style.display =
      mode === "login" ? "block" : "none";
  }

  if (registerForm) {
    registerForm.style.display =
      mode === "register" ? "block" : "none";
  }

  if (title) {
    title.textContent =
      mode === "login" ? "Вход" : "Регистрация";
  }
}

function toggleAuthMode() {
  const loginForm = document.getElementById("loginForm");

  setAuthMode(
    loginForm?.style.display !== "none"
      ? "register"
      : "login"
  );
}

async function register() {
  const email =
    document.getElementById("registerEmail")?.value.trim();

  const password =
    document.getElementById("registerPassword")?.value;

  const nickname =
    document.getElementById("registerNickname")?.value.trim();

  if (!email || !password || !nickname) {
    alert("Заполни все поля.");
    return;
  }

  if (password.length < 6) {
    alert("Пароль должен быть минимум 6 символов.");
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

  if (!data.user) {
    alert("Не удалось создать аккаунт.");
    return;
  }

  const { error: profileError } =
    await db
      .from("profiles")
      .upsert({
        id: data.user.id,
        name: nickname
      });

  if (profileError) {
    alert(profileError.message);
    return;
  }

  currentUser = data.user;

  closeAuth();
  updateProfileUI();
  showProfile();

  alert("Аккаунт создан.");
}

async function login() {
  const email =
    document.getElementById("loginEmail")?.value.trim();

  const password =
    document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Введи почту и пароль.");
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

  currentUser = data.user;

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
  const loggedOut =
    document.getElementById("loggedOut");

  const loggedIn =
    document.getElementById("loggedIn");

  if (!currentUser) {
    if (loggedOut) loggedOut.style.display = "block";
    if (loggedIn) loggedIn.style.display = "none";
    return;
  }

  if (loggedOut) loggedOut.style.display = "none";
  if (loggedIn) loggedIn.style.display = "block";

  const email =
    document.getElementById("profileEmail");

  if (email) {
    email.textContent = currentUser.email || "";
  }

  await loadProfile();
}

async function loadProfile() {
  if (!currentUser) return;

  const input =
    document.getElementById("profileNickname");

  if (!input) return;

  const { data, error } =
    await db
      .from("profiles")
      .select("name")
      .eq("id", currentUser.id)
      .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  input.value = data?.name || "";
}

async function saveProfile(event) {
  event?.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const nickname =
    document.getElementById("profileNickname")
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
    document.getElementById("itemsList");

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
    console.error(error);
    list.innerHTML =
      "<p>Ошибка загрузки объявлений.</p>";
    return;
  }

  renderItems(data || []);
}

function renderItems(items) {
  const list =
    document.getElementById("itemsList");

  if (!list) return;

  if (!items.length) {
    list.innerHTML =
      "<p>Объявлений пока нет.</p>";
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

      price =
        from && to
          ? `${from} – ${to}`
          : from || to || "Цена не указана";
    }

    return `
      <article class="item-card">
        <h3>${escapeHTML(item.title)}</h3>

        <p>
          ${escapeHTML(item.description)}
        </p>

        <p>
          ${escapeHTML(item.type || "")}
        </p>

        <strong>
          ${escapeHTML(price)}
        </strong>

        ${
          item.contact
            ? `<p>
                Контакт:
                ${escapeHTML(item.contact)}
              </p>`
            : ""
        }

        ${
          item.payment
            ? `<p>
                Оплата:
                ${escapeHTML(item.payment)}
              </p>`
            : ""
        }

        <button
          type="button"
          onclick="requestBuy(${Number(item.id)})"
        >
          ${currentUser ? "Купить / связаться" : "Войти"}
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
  event.preventDefault();

  if (!currentUser) {
    openAuth("login");
    return;
  }

  const title =
    document.getElementById("itemTitle")?.value.trim();

  const description =
    document.getElementById("itemDescription")
      ?.value.trim();

  const type =
    document.getElementById("itemType")?.value.trim();

  const priceType =
    document.getElementById("priceType")?.value || "fixed";

  const contactType =
    document.getElementById("contactType")?.value || null;

  const contact =
    document.getElementById("contact")?.value.trim() || null;

  const payment =
    document.getElementById("payment")?.value.trim() || null;

  if (!title || !description || !type) {
    alert("Заполни название, описание и тип.");
    return;
  }

  const row = {
    user_id: currentUser.id,
    title,
    description,
    type,
    price_type: priceType,
    contact_type: contactType,
    contact,
    payment,
    status: "active"
  };

  if (priceType === "fixed") {
    const value =
      document.getElementById("priceFixed")?.value;

    row.price_fixed =
      value === "" ? null : Number(value);

    row.price_from = null;
    row.price_to = null;
  }

  if (priceType === "range") {
    const from =
      document.getElementById("priceFrom")?.value;

    const to =
      document.getElementById("priceTo")?.value;

    row.price_fixed = null;
    row.price_from =
      from === "" ? null : Number(from);
    row.price_to =
      to === "" ? null : Number(to);
  }

  if (priceType === "free") {
    row.price_fixed = null;
    row.price_from = null;
    row.price_to = null;
  }

  const { error } =
    await db
      .from("объявления")
      .insert(row);

  if (error) {
    alert(error.message);
    return;
  }

  event.target.reset();

  togglePrice();

  await loadItems();

  showSection("home");

  alert("Объявление опубликовано.");
}

function togglePrice() {
  const type =
    document.getElementById("priceType")?.value;

  const fixed =
    document.getElementById("fixedPrice");

  const range =
    document.getElementById("rangePrice");

  if (fixed) {
    fixed.style.display =
      type === "fixed" ? "block" : "none";
  }

  if (range) {
    range.style.display =
      type === "range" ? "block" : "none";
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
window.register = register;
window.login = login;
window.logout = logout;
window.saveProfile = saveProfile;
window.addItem = addItem;
window.togglePrice = togglePrice;
window.loadItems = loadItems;
