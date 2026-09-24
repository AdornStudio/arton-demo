/* Головна: графік випробування, реєстр номенклатури, підбір класу, документи, дилери */
(function () {
  const P = window.ARTON_PRODUCTS || [];
  const icon = window.icon;
  const $ = (s, r = document) => r.querySelector(s);
  const count = (t) => P.filter((p) => p.type === t).length;
  const img = (f) => `img/products/${f}.webp`;

  /* ================= Графік нагріву ================= */
  const svg = $("#plot");
  const NS = "http://www.w3.org/2000/svg";
  const X0 = 64, X1 = 600, Y0 = 34, Y1 = 478, T0 = 20, T1 = 90, MIN = 30;
  const y = (T) => Y1 - ((T - T0) / (T1 - T0)) * (Y1 - Y0);
  const x = (m) => X0 + (m / MIN) * (X1 - X0);
  const el = (tag, attrs = {}, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };

  const bands = [
    { cls: "A1", min: 54, max: 65, model: "FT-A1", col: 640 },
    { cls: "A2", min: 54, max: 70, model: "FT-A2", col: 700 },
    { cls: "B", min: 69, max: 85, model: "FT-B", col: 760 },
  ];

  const axis = el("g", { class: "axis" });
  for (let T = 20; T <= 90; T += 10) {
    el("line", { x1: X0 - 6, x2: X0, y1: y(T), y2: y(T) }, axis);
    el("text", { x: X0 - 12, y: y(T) + 4, "text-anchor": "end" }, axis).textContent = T;
  }
  for (let m = 0; m <= MIN; m += 5) {
    el("line", { x1: x(m), x2: x(m), y1: Y1, y2: Y1 + 6 }, axis);
    el("text", { x: x(m), y: Y1 + 22, "text-anchor": "middle" }, axis).textContent = m;
  }
  el("line", { x1: X0, x2: X0, y1: Y0 - 10, y2: Y1 }, axis);
  el("line", { x1: X0, x2: X1 + 10, y1: Y1, y2: Y1 }, axis);
  el("text", { x: X0 - 12, y: Y0 - 18, "text-anchor": "end" }, axis).textContent = "°C";
  el("text", { x: X1 + 14, y: Y1 + 22 }, axis).textContent = "хв";

  const bandEls = bands.map((b) => {
    const g = el("g", { class: "band" });
    el("rect", { class: "zone", x: b.col - 16, y: y(b.max), width: 32, height: y(b.min) - y(b.max), rx: 3 }, g);
    el("line", { class: "tick", x1: b.col - 16, x2: b.col + 16, y1: y(b.max), y2: y(b.max) }, g);
    el("line", { class: "tick", x1: b.col - 16, x2: b.col + 16, y1: y(b.min), y2: y(b.min) }, g);
    el("line", { class: "tick", x1: b.col, x2: b.col, y1: y(b.max), y2: y(b.min) }, g);
    el("text", { class: "cls", x: b.col, y: y(b.max) - 34, "text-anchor": "middle" }, g).textContent = b.cls;
    el("text", { x: b.col, y: y(b.max) - 16, "text-anchor": "middle" }, g).textContent = b.model;
    el("text", { x: b.col, y: y(b.min) + 18, "text-anchor": "middle", style: "font-size:11px" }, g).textContent = `${b.min}–${b.max}`;
    el("text", { class: "fire", x: b.col, y: y(b.min) + 34, "text-anchor": "middle", style: "font-size:10.5px" }, g).textContent = "ПОЖЕЖА";
    return g;
  });

  const guide = el("line", { class: "trace-now", x1: X0, x2: 780, y1: y(24), y2: y(24) });
  const line = el("polyline", { class: "trace-line", points: "" });
  const halo = el("circle", { class: "trace-dot-halo", r: 11, cx: x(0), cy: y(24) });
  const dot = el("circle", { class: "trace-dot", r: 4.5, cx: x(0), cy: y(24) });

  const outT = $("[data-t]"), outTime = $("[data-time]");
  const chip = $("[data-chip]"), chipState = $("[data-state]");
  const temp = (m) => 24 + 64 * (1 - Math.exp(-m / 17)) + 0.12 * Math.sin(m * 1.3); // ілюстративна крива
  const pad = (n) => String(n).padStart(2, "0");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf, start;

  const drawTo = (m) => {
    const pts = [];
    for (let i = 0; i <= m + 1e-6; i += 0.1) pts.push(`${x(i).toFixed(1)},${y(temp(i)).toFixed(1)}`);
    line.setAttribute("points", pts.join(" "));
    const T = temp(m);
    dot.setAttribute("cx", x(m)); dot.setAttribute("cy", y(T));
    halo.setAttribute("cx", x(m)); halo.setAttribute("cy", y(T));
    guide.setAttribute("y1", y(T)); guide.setAttribute("y2", y(T)); guide.setAttribute("x1", x(m));
    outT.textContent = T.toFixed(1);
    const secs = Math.round(m * 60);
    outTime.textContent = `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
    bands.forEach((b, i) => {
      bandEls[i].classList.toggle("is-armed", T >= b.min);
      bandEls[i].classList.toggle("is-fire", T >= b.max);
    });
    const a2 = bands[1];
    const fire = T >= a2.max, armed = T >= a2.min;
    chip.classList.toggle("is-fire", fire);
    chipState.textContent = fire ? "ПОЖЕЖА — не пізніше 70 °C" : armed ? "Зона спрацювання 54–70 °C" : "Черговий режим";
  };

  const run = () => {
    cancelAnimationFrame(raf);
    if (reduce) { drawTo(MIN); return; }
    start = null;
    const dur = 9000;
    const step = (ts) => {
      if (!start) start = ts;
      const k = Math.min(1, (ts - start) / dur);
      drawTo(MIN * k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  drawTo(0);
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.35 });
  io.observe(svg);
  $("[data-replay]").addEventListener("click", run);

  document.querySelectorAll("[data-fill]").forEach((b) => b.addEventListener("click", () => {
    const i = $("#q-hero");
    i.value = b.dataset.fill;
    i.focus();
    i.dispatchEvent(new Event("input"));
  }));

  /* ================= Реєстр номенклатури ================= */
  const reg = [
    { name: "Сповіщувачі димові оптичні", meta: `${count("smoke")} моделей · EN 54-7`, desc: "Точкові, лінійні та двохточкові; 2- і 4-провідне підключення.", imgs: ["prd_img_spd-3_1", "arton-dl32", "sp21"], href: "catalog.html?type=smoke" },
    { name: "Сповіщувачі теплові", meta: `${count("heat")} моделі · EN 54-5`, desc: "Класи A1, A2, B; варіанти S для кухонь і котелень та максимально-диференційні R.", imgs: ["prd_img_ft-rt_1", "spt-2b", "prd_img_tpt_1"], href: "catalog.html?type=heat" },
    { name: "Мультисенсорні", meta: `${count("multi")} моделі · EN 54-29`, desc: "Дим і тепло в одному корпусі, компенсація дрейфу чутливості, самодіагностика.", imgs: ["spd-3.3-3.5_p"], href: "catalog.html?type=multi", tag: "Новий сертифікат" },
    { name: "Ручні сповіщувачі", meta: `${count("manual")} моделі · EN 54-11`, desc: "Кнопкові, зі світлодіодною індикацією та ключем повернення.", imgs: ["spr-1-2-3l", "spr_1"], href: "catalog.html?type=manual" },
    { name: "Адресна система «Вектор»", meta: "ППКП · адресні пристрої · ПЗ", desc: "Адресний ППКП Вектор-1, адаптери, блоки вводу-виводу, пульти.", imgs: ["prd_img_vektor_1"], href: "#vektor" },
    { name: "Приймально-контрольні прилади", meta: "АРТОН · Вектор · Спектра", desc: "Безадресні ППКП на 2–40 шлейфів і охоронно-пожежні «Спектра».", imgs: ["arton_08p_ru", "prd_img_ppkp_vektor_40", "spectra_16_white"], href: "https://arton.com.ua/products/facp/" },
    { name: "Радіоканальні й автономні", meta: "ASD · SPD-10QR · ArtonRL", desc: "Для об’єктів, де прокладати шлейф складно або неможливо.", imgs: ["asd-10", "photo-2022-08-23-19-20-20"], href: "https://arton.com.ua/products/radiokanalnij_shlejf/" },
    { name: "Покажчики евакуації «Люкс»", meta: "світлові покажчики", desc: "Покажчики шляхів евакуації та виходу.", imgs: ["pfexitleft_", "pfarrowright_"], href: "https://arton.com.ua/products/light_indicators/" },
    { name: "Arton AirAlert", meta: "мовленнєве оповіщення", desc: "Устатковання керування та індикації мовленнєвого оповіщування.", imgs: ["arton_airalert_3"], href: "https://arton.com.ua/products/arton_airalert/" },
  ];
  $("[data-register]").innerHTML = reg.map((r) => `
    <a class="register__row" href="${r.href}">
      <div class="register__name">${r.name}<small>${r.meta}</small></div>
      <p class="register__desc">${r.desc}${r.tag ? ` <span class="tag tag--new">${r.tag}</span>` : ""}</p>
      <div class="register__specimens">${r.imgs.map((i) => `<img src="${img(i)}" alt="" loading="lazy">`).join("")}</div>
      <span class="register__go">${icon("arrow")}</span>
    </a>`).join("");

  /* ================= Підбір класу EN 54-5 ================= */
  const CLASSES = [
    { code: "A1", typ: 25, maxUse: 50, min: 54, max: 65 },
    { code: "A2", typ: 25, maxUse: 50, min: 54, max: 70 },
    { code: "B", typ: 40, maxUse: 65, min: 69, max: 85 },
  ];
  const variant = (p) => {
    const m = p.name.match(/(A1|A2|B)(S|R)?$/i);
    if (m) return { base: m[1].toUpperCase(), suf: (m[2] || "").toUpperCase() };
    const c = (p.cls || "").toUpperCase().match(/^(A1|A2|B)(S|R)?$/);
    return c ? { base: c[1], suf: c[2] || "" } : null;
  };
  const heat = P.filter((p) => p.type === "heat").map((p) => ({ p, v: variant(p) })).filter((x) => x.v);

  const range = $("#room"), out = $("[data-room-out]");
  const sw = { S: $('[data-sw="S"]'), R: $('[data-sw="R"]') };
  const box = $("[data-classes]");

  const renderClasses = () => {
    const t = +range.value;
    out.textContent = t;
    range.style.setProperty("--p", ((t - 15) / 60) * 100 + "%");
    const wantS = sw.S.checked, wantR = sw.R.checked;
    const best = CLASSES.find((c) => c.maxUse >= t);
    let html = CLASSES.map((c) => {
      const ok = c.maxUse >= t;
      const isBest = best && c.code === best.code;
      const verdict = !ok
        ? "Не підходить: спрацювання від звичайного нагріву приміщення"
        : isBest ? "Рекомендований клас для цього приміщення" : "Допустимий, але спрацює пізніше";
      const models = heat.filter(({ v }) => v.base === c.code && (
        (!wantS && !wantR && !v.suf) || (wantS && v.suf === "S") || (wantR && v.suf === "R")
      ));
      const chips = models.length
        ? models.map(({ p }) => `<a href="${window.productUrl(p.slug)}"><img src="${p.photos[0]}" alt="">${p.name}</a>`).join("")
        : `<span class="cls__empty">Немає моделей із вибраними умовами — зверніться до технічного відділу.</span>`;
      return `<article class="cls ${ok ? "" : "is-off"} ${isBest ? "is-best" : ""}">
        <div class="cls__code">${c.code}<small>${c.min}–${c.max} °C<br>спрацювання</small></div>
        <div>
          <div class="cls__meta"><span>Типова t° застосування <b>${c.typ} °C</b></span><span>Макс. t° застосування <b>${c.maxUse} °C</b></span></div>
          <p class="cls__verdict">${verdict}</p>
          <div class="cls__models">${chips}</div>
        </div>
      </article>`;
    }).join("");
    if (!best) {
      html = `<article class="cls is-best"><div class="cls__code">C+</div><div><p class="cls__verdict">Для приміщень понад 65 °C потрібні класи C і вище.</p><p class="cls__empty">У поточній номенклатурі АРТОН таких моделей немає. Технічний відділ підкаже рішення: <a style="color:#fff" href="tel:+380504340326">+38 (050) 434-03-26</a></p></div></article>` + html;
    }
    box.innerHTML = html;
  };
  range.addEventListener("input", renderClasses);
  sw.S.addEventListener("change", renderClasses);
  sw.R.addEventListener("change", renderClasses);
  renderClasses();

  /* ================= Документи ================= */
  const KINDS = { all: "Усі", passport: "Паспорти", cert_eu: "Сертифікати ЄС", cert_ua: "Сертифікати України", scheme: "Схеми" };
  const docs = [];
  P.forEach((p) => p.docs.forEach((d) => { if (KINDS[d.kind]) docs.push({ ...d, model: p.name, slug: p.slug }); }));
  let kind = "all";
  const kindsBox = $("[data-docs-kinds]"), body = $("[data-docs-body]"), more = $("[data-docs-more]"), q = $("[data-docs-q]");
  const kindLabel = { passport: "Паспорт", cert_eu: "Сертифікат ЄС", cert_ua: "Сертифікат України", scheme: "Схема підключення" };
  const normalize = (s) => s.toLowerCase().replace(/[\s\-.]/g, "");
  const renderKinds = () => {
    kindsBox.innerHTML = Object.entries(KINDS).map(([k, t]) => {
      const n = k === "all" ? docs.length : docs.filter((d) => d.kind === k).length;
      return `<button class="chip" type="button" data-kind="${k}" aria-pressed="${k === kind}">${t}<span class="num">${n}</span></button>`;
    }).join("");
  };
  const renderDocs = () => {
    const s = normalize(q.value);
    const rows = docs.filter((d) => (kind === "all" || d.kind === kind) && (!s || normalize(d.model).includes(s)));
    body.innerHTML = rows.slice(0, 8).map((d) => `<tr>
      <td><a href="${window.productUrl(d.slug)}"><b>${d.model}</b></a></td>
      <td><span class="doc-kind"><i class="${d.kind}"></i>${kindLabel[d.kind]}</span></td>
      <td class="num hide-s">${d.size || "—"}</td>
      <td style="text-align:right"><a class="pdf-link" href="${d.href}" target="_blank" rel="noopener">${icon("down", "icon--s")}PDF</a></td>
    </tr>`).join("") || `<tr><td colspan="4" style="padding:28px 0;color:var(--ink-2)">Для «${q.value}» документів не знайдено. Перевірте код моделі або відкрийте <a href="catalog.html" style="color:var(--trace)">каталог</a>.</td></tr>`;
    more.textContent = rows.length > 8 ? `Показано 8 з ${rows.length}. Уточніть модель, щоб звузити список.` : "";
  };
  kindsBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    kind = b.dataset.kind;
    renderKinds(); renderDocs();
  });
  q.addEventListener("input", renderDocs);
  renderKinds(); renderDocs();

  /* ================= Дилери (з arton.com.ua/dealers) ================= */
  const D = {
    "Київ": [
      { n: "Представник з адресних систем АРТОН", a: "вул. Виборзька, 70", t: "+38 (050) 862-27-76", hq: true },
      { n: "ТОВ «ЕРІС»", a: "вул. Академіка Корольова, 9", t: "+38 (050) 386-62-98" },
      { n: "ТОВ «ОРІОН-ГРУП»", a: "вул. Студентська, 6", t: "+38 (044) 486-07-80" },
      { n: "ТОВ «ТРІНІТІ-СБ»", a: "вул. Якова Гніздовського, 1Е", t: "+38 (044) 503-04-04", w: "triniti-sb.com.ua" },
      { n: "ТОВ «ТД «Планета безпеки»", a: "вул. Світлицького, 35", t: "+38 (044) 585-81-81", w: "planeta-security.com" },
      { n: "ОПТА", a: "просп. Берестейський, 61/2", t: "+38 (067) 301-61-84", w: "opta.ua" },
      { n: "ТОВ «Ротатор»", a: "вул. Дружківська, 10", t: "+38 (044) 393-90-88", w: "rotator.com.ua" },
    ],
    "Львів": [
      { n: "ТОВ «РС-Безпека»", a: "вул. Шевченка, 134а", t: "+38 (067) 341-47-88", w: "rs.ua" },
      { n: "ТОВ «ТД «Флоріан»", a: "вул. Дж. Вашингтона, 4В", t: "+38 (067) 344-72-01", w: "florian-ltd.com" },
    ],
    "Харків": [{ n: "ТОВ «ОПТА»", a: "вул. Шевченка, 193", t: "+38 (057) 704-33-65", w: "opta.ua" }],
    "Дніпро": [
      { n: "KIBSTORE", a: "вул. Тітова, 2", t: "0 800 33-12-76", w: "kibstore.com" },
      { n: "ТОВ фірма «Делішес»", a: "вул. Надії Алексєєнко, 14/2", t: "+38 (067) 736-22-02", w: "delishes.com.ua" },
    ],
    "Одеса": [{ n: "ТОВ «КТЦ «Охоронні системи»", a: "пров. Книжковий, 3", t: "+38 (067) 182-34-37" }],
    "Запоріжжя": [{ n: "ТОВ «Компанія «Комплекс-Центр»", a: "вул. Портова, 2", t: "+38 (067) 614-34-55", w: "complex.zp.ua" }],
    "Хмельницький": [{ n: "ДП «Центр «Інновації та технології»", a: "вул. Святослава Хороброго, 5", t: "+38 (093) 469-07-65" }],
    "Кропивницький": [{ n: "ТОВ «Безпека 2017»", a: "вул. Івана Похитонова, 1а", t: "", w: "bezpeka.kr.ua" }],
    "Чернівці": [
      { n: "ПП «АРТОН» — комерційний відділ", a: "вул. Прутська, 6", t: "+38 (0372) 55-74-98", hq: true },
      { n: "CIFRA", a: "вул. Головна, 190-а", t: "+38 (050) 430-30-50" },
    ],
  };
  let city = "Київ";
  const cities = $("[data-cities]"), dealers = $("[data-dealers]");
  const renderCities = () => {
    cities.innerHTML = Object.keys(D).map((c) => `<button class="chip" type="button" aria-pressed="${c === city}" data-city="${c}">${c}<span class="num">${D[c].length}</span></button>`).join("");
  };
  const renderDealers = () => {
    dealers.innerHTML = D[city].map((d) => `<div class="dealer ${d.hq ? "dealer--hq" : ""}">
      <b>${d.n}</b><p>м. ${city}, ${d.a}</p>
      ${d.t ? `<a class="mono" href="tel:${d.t.replace(/[^\d+]/g, "")}">${d.t}</a>` : ""}
      ${d.w ? `<p><a href="https://${d.w}" target="_blank" rel="noopener">${d.w}</a></p>` : ""}
    </div>`).join("");
  };
  cities.addEventListener("click", (e) => {
    const b = e.target.closest("[data-city]");
    if (!b) return;
    city = b.dataset.city;
    renderCities(); renderDealers();
  });
  renderCities(); renderDealers();
})();
