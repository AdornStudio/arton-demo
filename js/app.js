/* Спільне: іконки, шапка, підвал, пошук за моделлю, мобільне меню, чат */
(function () {
  const P = window.ARTON_PRODUCTS || [];
  const page = document.body.dataset.page || "";

  /* ---------- іконки (власний набір, штрих 1.6) ---------- */
  const sprite = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
  <symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-down" viewBox="0 0 24 24"><path d="M12 4v12M6.5 11l5.5 5.5 5.5-5.5M5 20h14"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></symbol>
  <symbol id="i-doc" viewBox="0 0 24 24"><path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></symbol>
  <symbol id="i-rows" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
  <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></symbol>
  <symbol id="i-replay" viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></symbol>
  <symbol id="i-factory" viewBox="0 0 24 24"><path d="M3 20V10l5 3V10l5 3V6h4l1 14z"/><path d="M3 20h18"/></symbol>
  <symbol id="i-wrench" viewBox="0 0 24 24"><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2z"/></symbol>
  <symbol id="i-compare" viewBox="0 0 24 24"><path d="M8 4v16M16 4v16M4 8h8M12 16h8"/></symbol>
</svg>`;
  document.body.insertAdjacentHTML("afterbegin", sprite);

  const icon = (id, cls = "") => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  window.icon = icon;

  const logo = `
<a class="logo" href="index.html" aria-label="АРТОН — на головну">
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="17" cy="20" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/>
    <circle cx="17" cy="20" r="4" fill="#d4231b"/>
    <path d="M31 12.5a11 11 0 0 1 0 15M35.5 9a16 16 0 0 1 0 22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  </svg>
  <span class="logo__word">ARTON</span>
  <span class="logo__since">Чернівці<br>з 1998</span>
</a>`;

  const nav = [
    ["catalog.html", "Продукція", "catalog"],
    ["index.html#vektor", "Адресна система", ""],
    ["index.html#docs", "Документація", ""],
    ["index.html#buy", "Де купити", ""],
    ["index.html#news", "Новини", ""],
    ["#footer", "Контакти", ""],
  ];
  const navHtml = nav.map(([h, t, k]) => `<a href="${h}"${k && k === page ? ' aria-current="page"' : ""}>${t}</a>`).join("");

  const searchBox = (id, ph) => `
<div class="search" role="search">
  ${icon("search", "icon--s")}
  <label class="sr-only" for="${id}">Пошук за моделлю</label>
  <input id="${id}" type="search" autocomplete="off" placeholder="${ph}" data-search>
  <kbd aria-hidden="true">/</kbd>
  <div class="search-pop" role="listbox"></div>
</div>`;

  const header = `
<div class="topbar">
  <div class="wrap">
    <a class="topbar__hide" href="tel:+380372557498">${"+38 (0372) 55-74-98"}</a>
    <span class="topbar__hide">Пн–Пт 8:00–17:00</span>
    <span class="topbar__spacer"></span>
    <a class="topbar__hide" href="index.html#buy">Для дилерів</a>
    <a class="topbar__hide" href="https://cem.arton.com.ua/index_ua.html">Контрактне виробництво</a>
    <nav class="topbar__langs" aria-label="Мова"><a href="#" aria-current="true">UA</a><a href="#">EN</a><a href="#">RU</a></nav>
  </div>
</div>
<header class="header">
  <div class="wrap">
    ${logo}
    <nav class="nav" aria-label="Головне меню">${navHtml}</nav>
    <span class="header__spacer"></span>
    ${searchBox("q-head", "SPD-3, FT-A2, Вектор…")}
    <button class="menu-btn" type="button" aria-label="Меню" aria-expanded="false" data-menu>${icon("menu")}</button>
  </div>
</header>
<div class="mnav" id="mnav" aria-hidden="true">
  <div class="mnav__head">${logo}<button class="menu-btn" style="display:inline-flex" type="button" aria-label="Закрити меню" data-menu-close>${icon("close")}</button></div>
  ${searchBox("q-mob", "Модель: SPD-3, FT-A2…")}
  <nav aria-label="Мобільне меню">${navHtml}</nav>
  <div class="mnav__foot"><a href="tel:+380372557498">+38 (0372) 55-74-98 — комерційний відділ</a><span>вул. Прутська, 6, Чернівці</span></div>
</div>`;

  const footer = `
<footer class="footer" id="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div>
        ${logo}
        <address>
          ПП «АРТОН»<br>вул. Прутська, 6, м. Чернівці, 58008<br>
          Пн–Пт 8:00–17:00, обід 13:00–14:00
        </address>
      </div>
      <div>
        <h4>Комерційний відділ</h4>
        <ul>
          <li><a class="mono" href="tel:+380372557498">+38 (0372) 55-74-98</a></li>
          <li><a class="mono" href="tel:+380503740314">+38 (050) 374-03-14</a></li>
          <li><a href="mailto:arton@arton.com.ua">arton@arton.com.ua</a></li>
        </ul>
      </div>
      <div>
        <h4>Технічна підтримка</h4>
        <ul>
          <li><a class="mono" href="tel:+380504340326">+38 (050) 434-03-26</a></li>
          <li>Гарантія і сервіс<br><a class="mono" href="tel:+380503740316">+38 (050) 374-03-16</a></li>
        </ul>
      </div>
      <div>
        <h4>Розділи</h4>
        <ul>
          <li><a href="catalog.html">Продукція</a></li>
          <li><a href="index.html#docs">Паспорти й сертифікати</a></li>
          <li><a href="index.html#buy">Дилери</a></li>
          <li><a href="https://cem.arton.com.ua/index_ua.html">Контрактне виробництво</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© 1998–2026 ПП «АРТОН». Розробка і виробництво приладів пожежної та охоронної сигналізації.</span>
      <span>Демо-версія дизайну · дані з arton.com.ua</span>
    </div>
  </div>
</footer>`;

  const h = document.querySelector("[data-header]");
  if (h) h.outerHTML = header;
  const f = document.querySelector("[data-footer]");
  if (f) f.outerHTML = footer;

  /* ---------- мобільне меню ---------- */
  const mnav = document.getElementById("mnav");
  const openBtn = document.querySelector("[data-menu]");
  const setMenu = (open) => {
    mnav.classList.toggle("is-open", open);
    mnav.setAttribute("aria-hidden", String(!open));
    openBtn && openBtn.setAttribute("aria-expanded", String(open));
    document.documentElement.style.overflow = open ? "hidden" : "";
  };
  openBtn && openBtn.addEventListener("click", () => setMenu(true));
  document.querySelector("[data-menu-close]").addEventListener("click", () => setMenu(false));
  mnav.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- пошук за моделлю ---------- */
  const norm = (s) => s.toLowerCase().replace(/[\s\-.«»"()]/g, "")
    .replace(/[аa]/g, "a").replace(/[вb]/g, "b").replace(/[сc]/g, "c").replace(/[еe]/g, "e")
    .replace(/[кk]/g, "k").replace(/[мm]/g, "m").replace(/[нh]/g, "h").replace(/[оo]/g, "o")
    .replace(/[рp]/g, "p").replace(/[тt]/g, "t").replace(/[хx]/g, "x");
  const extra = [
    { name: "Вектор-1", desc: "Адресний ППКП", href: "index.html#vektor", img: "img/products/prd_img_vektor_1.webp" },
    { name: "Спектра-16", desc: "ППКП «Спектра»", href: "catalog.html", img: "img/products/spectra_16_white.webp" },
    { name: "Arton AirAlert", desc: "Керування мовленнєвим оповіщенням", href: "catalog.html", img: "img/products/arton_airalert_3.webp" },
  ];
  const pool = P.map((p) => ({ name: p.name, desc: p.desc || p.cat, href: `product.html?p=${p.slug}`, img: p.photos[0] })).concat(extra);

  window.productUrl = (slug) => `product.html?p=${slug}`;

  document.querySelectorAll("[data-search]").forEach((input) => {
    const pop = input.parentElement.querySelector(".search-pop");
    let active = -1;
    const render = () => {
      const q = norm(input.value);
      if (!q) { pop.classList.remove("is-open"); return; }
      const hits = pool.filter((x) => norm(x.name).includes(q) || norm(x.desc).includes(q)).slice(0, 6);
      active = -1;
      pop.innerHTML = hits.length
        ? hits.map((x) => `<a href="${x.href}" role="option"><img src="${x.img}" alt=""><div><b>${x.name}</b><span>${x.desc}</span></div></a>`).join("")
        : `<div class="search-pop__empty">Нічого не знайшли за «${input.value}». Спробуйте код моделі, напр. <b>SPD-3</b> або <b>FT-A2</b>.</div>`;
      pop.classList.add("is-open");
    };
    input.addEventListener("input", render);
    input.addEventListener("focus", render);
    input.addEventListener("keydown", (e) => {
      const links = [...pop.querySelectorAll("a")];
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!links.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle("is-active", i === active));
      } else if (e.key === "Enter") {
        const l = links[active] || links[0];
        if (l) location.href = l.getAttribute("href");
      } else if (e.key === "Escape") {
        pop.classList.remove("is-open");
        input.blur();
      }
    });
    input.addEventListener("blur", () => setTimeout(() => pop.classList.remove("is-open"), 150));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      const i = document.querySelector("[data-search-primary]") || [...document.querySelectorAll("[data-search]")].find((x) => x.offsetParent);
      if (i) { e.preventDefault(); i.focus(); }
    }
  });

  /* ---------- LiveHelperChat: той самий віджет, що й на поточному сайті (UA: мова ukr, тема 4) ---------- */
  window.LHCChatOptions = { opt: { widget_height: 340, widget_width: 300, popup_height: 520, popup_width: 500 } };
  if (location.protocol.startsWith("http")) {
    const po = document.createElement("script");
    po.async = true;
    const ref = document.referrer ? encodeURIComponent(document.referrer.substr(document.referrer.indexOf("://") + 1)) : "";
    const loc = encodeURIComponent(location.href.substring(location.protocol.length));
    po.src = "https://lhc.arton.com.ua/index.php/ukr/chat/getstatus/(click)/internal/(position)/bottom_right/(ma)/br/(top)/350/(units)/pixels/(leaveamessage)/true/(theme)/4?r=" + ref + "&l=" + loc;
    document.body.appendChild(po);
  }
})();
