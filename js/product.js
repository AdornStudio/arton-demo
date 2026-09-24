/* Картка товару: будується з даних за ?p=slug (типово SPD-3.3-N) */
(function () {
  const P = window.ARTON_PRODUCTS || [];
  const icon = window.icon;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const slug = new URLSearchParams(location.search).get("p") || "spd_33_n";
  const p = P.find((x) => x.slug === slug) || P.find((x) => x.slug === "spd_33_n");

  const TYPES = { smoke: "Димові оптичні", heat: "Теплові", multi: "Мультисенсорні", manual: "Ручні" };
  const TYPE_ONE = { smoke: "Сповіщувач пожежний димовий оптичний", heat: "Сповіщувач пожежний тепловий", multi: "Сповіщувач пожежний мультисенсорний: дим + тепло", manual: "Сповіщувач пожежний ручний" };
  const STD = { smoke: "ДСТУ EN 54-7", heat: "ДСТУ EN 54-5", multi: "ДСТУ EN 54-29", manual: "ДСТУ EN 54-11" };
  const cm = (p.name.match(/(A1|A2|B)(S|R)?$/i) || (p.cls || "").match(/^(A1|A2|B)(S|R)?$/i));
  const cls = cm ? cm[1].toUpperCase() + (cm[2] || "").toUpperCase() : "";

  document.title = `${p.name} — ${TYPE_ONE[p.type].toLowerCase()} | АРТОН`;

  /* ---------- шапка товару ---------- */
  $("[data-crumbs]").innerHTML = `
    <a href="index.html">Головна</a>${icon("chev")}
    <a href="catalog.html">Сповіщувачі пожежні</a>${icon("chev")}
    <a href="catalog.html?type=${p.type}">${TYPES[p.type]}</a>${icon("chev")}
    <span aria-current="page">${p.name}</span>`;
  $("[data-cat-link]").href = `catalog.html?type=${p.type}`;
  $("[data-name]").textContent = p.name;
  $("[data-ptabs-name]").textContent = p.name;
  $("[data-desc]").textContent = p.desc || TYPE_ONE[p.type];

  const tags = [];
  tags.push(`<span class="tag">${TYPES[p.type]}</span>`);
  tags.push(`<span class="tag tag--trace">${STD[p.type]}${cls ? " · клас " + cls : ""}</span>`);
  if (p.wires.length) tags.push(`<span class="tag">${p.wires.map((w) => w + "-провідний").join(" / ")}</span>`);
  p.region.forEach((r) => tags.push(`<span class="tag">Регіон: ${r}</span>`));
  $("[data-tags]").innerHTML = tags.join("");

  /* ---------- показники ---------- */
  const find = (...keys) => {
    for (const k of keys) {
      const s = p.specs.find(([a]) => a.toLowerCase().includes(k));
      if (s && s[1]) return s[1].replace(/;$/, "").replace(/^не більше /, "≤ ").replace(/^не менше /, "≥ ").replace(/^від (.+) до (.+)$/, "$1–$2");
    }
    return "";
  };
  const unit = (label) => (label.match(/,\s*([^,]+),?$/) || [])[1] || "";
  const withUnit = (key) => {
    const s = p.specs.find(([a]) => a.toLowerCase().includes(key));
    if (!s) return "";
    const u = unit(s[0]);
    const v = find(key);
    return u && !/[a-zа-я°%]/i.test(v.replace(/мінус/, "")) ? `${v} ${u.replace("°C", "°C")}` : v;
  };
  const rd = [];
  const volt = p.voltage || withUnit("діапазон напруги");
  if (volt) rd.push(["Напруга живлення", volt]);
  if (p.standby) rd.push(["Струм у черговому режимі", p.standby]);
  if (p.temp) rd.push(["Спрацювання", `${p.temp[0]}–${p.temp[1]} °C`]);
  const fire = withUnit('режимі "пожежа"') || withUnit("пожежна тривога") || withUnit("пожеж");
  if (fire && rd.length < 4) rd.push(["Струм у режимі «Пожежа»", fire]);
  const ip = find("ступінь захисту");
  if (ip) rd.push(["Захист оболонки", ip]);
  const tw = withUnit("робочих температур");
  if (tw) rd.push(["Робоча температура", tw.replace("мінус ", "−") + (/°/.test(tw) ? "" : " °C")]);
  if (p.dims) rd.push(["Габарити", p.dims]);
  if (p.mass && rd.length < 6) rd.push(["Маса", p.mass.replace("не більше ", "≤ ")]);
  $("[data-readouts]").innerHTML = rd.slice(0, 6).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

  /* ---------- зразок + креслення ---------- */
  const nums = (p.dims || "").match(/\d+/g) || [];
  const W = nums.length ? +nums[0] : 0;
  const H = nums.length > 1 ? +nums[nums.length - 1] : 0;
  const square = nums.length >= 3;
  const stage = $("[data-stage]"), main = $("[data-main]");
  $("[data-label]").innerHTML = `<span>Зразок</span><b>${p.name}</b><span>${STD[p.type]}</span>`;
  const dim = $("[data-dim]");
  if (W) dim.querySelector("span").textContent = square ? `${W} мм` : `Ø ${W} мм`;
  else dim.style.display = "none";

  const drawing = () => {
    const cx = 250, cy = 250, r = 150;
    const top = square
      ? `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" rx="10" class="o"/><rect x="${cx - 60}" y="${cy - 60}" width="120" height="120" rx="6" class="o"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" class="o"/><circle cx="${cx}" cy="${cy}" r="${r * 0.52}" class="o"/><circle cx="${cx}" cy="${cy}" r="${r * 0.2}" class="o"/>`;
    const hScale = W ? (H / W) * 2 * r : 90;
    const sx = 520, sw = 2 * r, sy = cy + hScale / 2;
    const side = `<path class="o" d="M${sx} ${sy} h${sw} v${-hScale * 0.45} q0 ${-hScale * 0.25} -${sw * 0.2} ${-hScale * 0.3} h-${sw * 0.6} q-${sw * 0.2} ${-hScale * 0.05} -${sw * 0.2} ${hScale * 0.3} z"/>
      <path class="o" d="M${sx + sw * 0.3} ${sy - hScale * 0.75} q${sw * 0.2} ${-hScale * 0.3} ${sw * 0.4} 0"/>`;
    return `<svg class="drawing" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid meet" aria-label="Габаритне креслення ${p.name}">
      <style>.o{fill:none;stroke:#121518;stroke-width:1.6}.d{stroke:#474d53;stroke-width:1}.c{stroke:#1f45b8;stroke-width:1;stroke-dasharray:14 4 3 4}.t{font:13px 'Fira Mono',monospace;fill:#474d53}</style>
      <line class="c" x1="${cx - r - 30}" y1="${cy}" x2="${cx + r + 30}" y2="${cy}"/><line class="c" x1="${cx}" y1="${cy - r - 30}" x2="${cx}" y2="${cy + r + 30}"/>
      ${top}
      <line class="d" x1="${cx - r}" y1="${cy + r + 44}" x2="${cx + r}" y2="${cy + r + 44}"/>
      <line class="d" x1="${cx - r}" y1="${cy + r + 34}" x2="${cx - r}" y2="${cy + r + 54}"/><line class="d" x1="${cx + r}" y1="${cy + r + 34}" x2="${cx + r}" y2="${cy + r + 54}"/>
      <text class="t" x="${cx}" y="${cy + r + 38}" text-anchor="middle">${W ? (square ? "" : "Ø") + W : ""}</text>
      ${side}
      <line class="d" x1="${sx + sw + 30}" y1="${sy}" x2="${sx + sw + 30}" y2="${sy - hScale}"/>
      <line class="d" x1="${sx + sw + 20}" y1="${sy}" x2="${sx + sw + 40}" y2="${sy}"/><line class="d" x1="${sx + sw + 20}" y1="${sy - hScale}" x2="${sx + sw + 40}" y2="${sy - hScale}"/>
      <text class="t" x="${sx + sw + 46}" y="${sy - hScale / 2 + 4}">${H || ""}</text>
      <text class="t" x="${cx}" y="60" text-anchor="middle">вигляд зверху</text>
      <text class="t" x="${sx + sw / 2}" y="60" text-anchor="middle">вигляд збоку</text>
      <text class="t" x="880" y="505" text-anchor="end">розміри в мм · за паспортом, не більше</text>
    </svg>`;
  };

  const thumbs = $("[data-thumbs]");
  const views = p.photos.map((src, i) => ({ kind: "photo", src, label: `Фото ${i + 1}` }));
  if (W) views.push({ kind: "drawing", label: "Креслення" });
  let current = 0;
  const show = (i) => {
    current = i;
    const v = views[i];
    stage.querySelector("svg.drawing")?.remove();
    if (v.kind === "photo") {
      main.hidden = false; dim.style.visibility = "";
      main.src = v.src; main.alt = `${p.name}, ${v.label.toLowerCase()}`;
    } else {
      main.hidden = true; dim.style.visibility = "hidden";
      stage.insertAdjacentHTML("afterbegin", drawing());
    }
    $$("button", thumbs).forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
  };
  thumbs.innerHTML = views.map((v, i) => `<button type="button" aria-label="${v.label}" aria-pressed="false">${v.kind === "photo"
    ? `<img src="${v.src}" alt="">`
    : `<svg viewBox="0 0 34 34" fill="none" stroke="#121518" stroke-width="1.4"><circle cx="17" cy="15" r="10"/><circle cx="17" cy="15" r="4"/><path d="M4 30h26M4 27v6M30 27v6" stroke="#474d53"/></svg>`}</button>`).join("");
  thumbs.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) show($$("button", thumbs).indexOf(b));
  });
  show(0);

  /* ---------- особливості ---------- */
  const feats = p.feats.length ? p.feats : [TYPE_ONE[p.type]];
  $("[data-feats]").innerHTML = feats.map((f) => `<li>${icon("check")}<span>${f.charAt(0).toUpperCase() + f.slice(1).replace(/[;:]$/, "")}</span></li>`).join("");

  /* ---------- діапазон (теплові) ---------- */
  if (p.temp) {
    $$("[data-only='range']").forEach((e) => (e.hidden = false));
    const T0 = 40, T1 = 90, pct = (t) => ((t - T0) / (T1 - T0)) * 100;
    const CL = [["A1", 54, 65], ["A2", 54, 70], ["B", 69, 85]];
    $("[data-range]").innerHTML = `
      <div class="mm" style="border:1px solid var(--rule-strong);border-radius:var(--radius);padding:28px 24px 20px">
        ${CL.map(([c, a, b]) => `
          <div style="display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:center;margin-bottom:12px">
            <span class="mono" style="font-size:13px;color:${cls.startsWith(c) ? "var(--ink)" : "var(--ink-3)"}">${c}</span>
            <div style="position:relative;height:22px">
              <div style="position:absolute;left:${pct(a)}%;width:${pct(b) - pct(a)}%;top:0;bottom:0;border-radius:4px;background:${cls.startsWith(c) ? "var(--alarm-soft)" : "var(--trace-soft)"};border:1px solid ${cls.startsWith(c) ? "var(--alarm)" : "transparent"}"></div>
            </div>
          </div>`).join("")}
        <div style="display:grid;grid-template-columns:44px 1fr;gap:12px;margin-top:6px">
          <span></span>
          <div style="position:relative;height:18px;border-top:1px solid var(--ink)" class="mono">
            ${[40, 50, 60, 70, 80, 90].map((t) => `<span style="position:absolute;left:${pct(t)}%;transform:translateX(-50%);top:4px;font-size:11px;color:var(--ink-3)">${t}</span>`).join("")}
          </div>
        </div>
        <p style="margin-top:22px;font-size:15px"><b>${p.name}</b>: спрацювання в діапазоні <span class="mono">${p.temp[0]}–${p.temp[1]} °C</span>${cls ? `, клас <span class="mono">${cls}</span>` : ""}.</p>
      </div>`;
  }
  if (p.type === "multi") $$("[data-only='modes']").forEach((e) => (e.hidden = false));

  /* ---------- характеристики (протокол) ---------- */
  const rows = p.specs.map(([k, v], i) => {
    const key = k.replace(/[;:,]+$/, "").replace(/,\s*$/, "");
    const val = v.replace(/;$/, "").replace("Æ", "Ø");
    return val
      ? `<tr><td class="n">${String(i + 1).padStart(2, "0")}</td><td>${key}</td><td class="v">${val}</td></tr>`
      : `<tr><td class="n">${String(i + 1).padStart(2, "0")}</td><td class="full" colspan="2">${key}</td></tr>`;
  });
  $("[data-specs]").innerHTML = `<caption>Протокол характеристик · ${p.name} · за паспортом виробника</caption>
    <thead><tr><th>№</th><th>Параметр</th><th style="text-align:right">Значення</th></tr></thead><tbody>${rows.join("")}</tbody>`;

  /* ---------- документи ---------- */
  const kindLabel = { passport: "Паспорт виробу", cert_eu: "Сертифікат ЄС", cert_ua: "Сертифікат України", scheme: "Схема підключення", other: "Документ" };
  $("[data-docs]").innerHTML = p.docs.length
    ? p.docs.map((d) => `<li><a href="${d.href}" target="_blank" rel="noopener">
        <span class="ficon">PDF</span>
        <span><b>${kindLabel[d.kind]}</b><small>${d.title}</small></span>
        <span class="num">${d.size || ""}</span>
        ${icon("down")}
      </a></li>`).join("")
    : `<li style="padding:18px 0;color:var(--ink-2)">Документи для цієї моделі надає комерційний відділ.</li>`;
  const pass = p.docs.find((d) => d.kind === "passport");
  const pb = $("[data-passport]");
  if (pass) { pb.href = pass.href; pb.lastChild.textContent = `Паспорт PDF${pass.size ? " · " + pass.size : ""}`; }
  else pb.remove();

  /* ---------- схожі ---------- */
  const rel = P.filter((x) => x.slug !== p.slug && x.type === p.type)
    .sort((a, b) => (b.name.slice(0, 3) === p.name.slice(0, 3)) - (a.name.slice(0, 3) === p.name.slice(0, 3)))
    .slice(0, 4);
  const pool = rel.length >= 2 ? rel : rel.concat(P.filter((x) => x.slug !== p.slug && x.type !== p.type).slice(0, 4 - rel.length));
  $("[data-related]").innerHTML = pool.map((x) => `
    <article class="card">
      <div class="card__media mm"><span class="card__marks"></span><img src="${x.photos[0]}" alt="${x.name}" loading="lazy"></div>
      <div class="card__body">
        <h3 class="card__name"><a href="product.html?p=${x.slug}">${x.name}</a></h3>
        <p class="card__desc">${x.desc || TYPES[x.type]}</p>
      </div>
    </article>`).join("");

  /* ---------- липка панель розділів ---------- */
  const tabs = $("[data-ptabs]");
  const sentinel = document.createElement("div");
  tabs.before(sentinel);
  new IntersectionObserver(([e]) => tabs.classList.toggle("is-stuck", !e.isIntersecting && e.boundingClientRect.top < 0)).observe(sentinel);
  const links = $$("a[href^='#']:not(.ptabs__cta)", tabs).filter((a) => !a.closest("[hidden]"));
  $$("[data-only]", tabs).forEach((a) => { const sec = $(a.getAttribute("href")); if (sec && sec.hidden) a.remove(); });
  const secs = links.map((a) => $(a.getAttribute("href"))).filter((s) => s && !s.hidden);
  const spy = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach((s) => spy.observe(s));

  /* ---------- запит ціни ---------- */
  const rfq = $("[data-rfq]"), form = rfq.querySelector("form");
  $("[data-msg]").value = `Цікавить ${p.name}. `;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    $$("[required]", form).forEach((i) => {
      const bad = !i.value.trim();
      i.setAttribute("aria-invalid", String(bad));
      if (bad && ok) { i.focus(); ok = false; }
    });
    if (ok) rfq.classList.add("is-done");
  });
  $$("[required]", form).forEach((i) => i.addEventListener("input", () => i.value.trim() && i.setAttribute("aria-invalid", "false")));
})();
