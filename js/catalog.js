/* Каталог: типи, фільтри, сортування, картки/таблиця, порівняння */
(function () {
  const P = window.ARTON_PRODUCTS || [];
  const icon = window.icon;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const TYPES = { all: "Усі", smoke: "Димові оптичні", heat: "Теплові", multi: "Мультисенсорні", manual: "Ручні" };
  const TYPE_ONE = { smoke: "Димовий", heat: "Тепловий", multi: "Мультисенсорний", manual: "Ручний" };

  const baseCls = (p) => {
    const m = (p.name.match(/(A1|A2|B)(S|R)?$/i) || (p.cls || "").match(/^(A1|A2|B)(S|R)?$/i));
    return m ? { base: m[1].toUpperCase(), suf: (m[2] || "").toUpperCase() } : null;
  };
  P.forEach((p) => {
    p._cls = baseCls(p);
    p._eu = p.docs.some((d) => d.kind === "cert_eu");
    p._scheme = p.docs.some((d) => d.kind === "scheme");
    p._duty = /так/i.test(p.dutyled || "");
    const m = (p.standby || "").replace(",", ".").match(/[\d.]+/);
    p._standby = m ? parseFloat(m[0]) * (/мкА/.test(p.standby) ? 0.001 : 1) : Infinity;
  });

  const params = new URLSearchParams(location.search);
  const S = {
    type: TYPES[params.get("type")] ? params.get("type") : "all",
    cls: new Set(), wires: new Set(), region: new Set(),
    flags: new Set(), sort: "default", view: "grid", cmp: [],
  };

  const OPTS = {
    cls: [["A1", "A1"], ["A2", "A2"], ["B", "B"], ["S", "…S"], ["R", "…R"]],
    wires: [[2, "2-провідне"], [4, "4-провідне"]],
    region: [["Україна", "Україна"], ["ЄС", "ЄС"]],
  };

  const match = (p, skip) => {
    if (skip !== "type" && S.type !== "all" && p.type !== S.type) return false;
    if (skip !== "cls" && S.cls.size) {
      const c = p._cls;
      if (!c) return false;
      const bases = [...S.cls].filter((x) => x !== "S" && x !== "R");
      const sufs = [...S.cls].filter((x) => x === "S" || x === "R");
      if (bases.length && !bases.includes(c.base)) return false;
      if (sufs.length && !sufs.includes(c.suf)) return false;
    }
    if (skip !== "wires" && S.wires.size && !p.wires.some((w) => S.wires.has(w))) return false;
    if (skip !== "region" && S.region.size && !p.region.some((r) => S.region.has(r))) return false;
    if (S.flags.has("eu") && !p._eu) return false;
    if (S.flags.has("scheme") && !p._scheme) return false;
    if (S.flags.has("duty") && !p._duty) return false;
    return true;
  };

  const countFor = (group, val) => P.filter((p) => {
    if (!match(p, group)) return false;
    if (group === "cls") {
      if (!p._cls) return false;
      return val === "S" || val === "R" ? p._cls.suf === val : p._cls.base === val;
    }
    if (group === "wires") return p.wires.includes(val);
    if (group === "region") return p.region.includes(val);
    return true;
  }).length;

  /* ---------- типи ---------- */
  const typesBox = $("[data-types]");
  const renderTypes = () => {
    typesBox.innerHTML = Object.entries(TYPES).map(([k, t]) => {
      const n = k === "all" ? P.length : P.filter((p) => p.type === k).length;
      return `<button type="button" aria-pressed="${S.type === k}" data-type="${k}">${t}<span class="num">${n}</span></button>`;
    }).join("");
  };
  typesBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b) return;
    S.type = b.dataset.type;
    if (S.type !== "heat" && S.type !== "all") S.cls.clear();
    const u = new URL(location);
    S.type === "all" ? u.searchParams.delete("type") : u.searchParams.set("type", S.type);
    history.replaceState(null, "", u);
    update();
  });

  /* ---------- фільтри ---------- */
  const renderFilters = () => {
    Object.entries(OPTS).forEach(([g, opts]) => {
      const box = $(`[data-f="${g}"]`);
      box.innerHTML = opts.map(([v, t]) => {
        const n = countFor(g, v);
        const on = S[g].has(v);
        return `<button type="button" class="chip ${g === "cls" ? "mono" : ""}" aria-pressed="${on}" data-g="${g}" data-v="${v}" ${!n && !on ? "disabled style='opacity:.4;cursor:not-allowed'" : ""}>${t}<span class="num">${n}</span></button>`;
      }).join("");
      box.closest(".fgroup").style.display = g === "cls" && !["all", "heat"].includes(S.type) ? "none" : "";
    });
  };
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-g]");
    if (!b || b.disabled) return;
    const g = b.dataset.g, v = g === "wires" ? +b.dataset.v : b.dataset.v;
    S[g].has(v) ? S[g].delete(v) : S[g].add(v);
    update();
  });
  $$("[data-flag]").forEach((c) => c.addEventListener("change", () => {
    c.checked ? S.flags.add(c.dataset.flag) : S.flags.delete(c.dataset.flag);
    update();
  }));
  const reset = () => {
    S.cls.clear(); S.wires.clear(); S.region.clear(); S.flags.clear();
    $$("[data-flag]").forEach((c) => (c.checked = false));
    update();
  };
  $("[data-reset]").addEventListener("click", reset);

  /* ---------- сортування / вигляд ---------- */
  $("[data-sort]").addEventListener("change", (e) => { S.sort = e.target.value; update(); });
  $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
    S.view = b.dataset.view;
    $$("[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    renderResults();
  }));

  /* ---------- картки ---------- */
  const specRows = (p) => {
    const rows = [];
    if (p.voltage) rows.push(["Живлення", p.voltage]);
    if (p.standby) rows.push(["Черговий", p.standby]);
    if (p.temp) rows.push(["Спрацювання", `${p.temp[0]}–${p.temp[1]} °C`]);
    if (p.dims && rows.length < 3) rows.push(["Габарити", p.dims.replace(/Сенсор 1: /, "")]);
    return rows.slice(0, 3);
  };
  const badges = (p) => {
    const b = [];
    if (p._cls) b.push(`<span class="tag tag--trace">EN 54-5 · ${p._cls.base}${p._cls.suf}</span>`);
    if (p.type === "multi") b.push(`<span class="tag tag--trace">EN 54-29</span>`);
    if (p._eu) b.push(`<span class="tag">Сертифікат ЄС</span>`);
    if (p.region.includes("ЄС") && !p._eu) b.push(`<span class="tag">Для ЄС</span>`);
    return b.join("");
  };
  const card = (p) => `
    <article class="card">
      <div class="card__media mm">
        <span class="card__marks"></span>
        <div class="card__badges">${badges(p)}</div>
        <img src="${p.photos[0]}" alt="${p.name}" loading="lazy">
      </div>
      <div class="card__body">
        <h3 class="card__name"><a href="${window.productUrl(p.slug)}">${p.name}</a></h3>
        <p class="card__desc">${p.desc || TYPE_ONE[p.type] + " пожежний сповіщувач"}</p>
        <dl class="card__specs">${specRows(p).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      </div>
      <div class="card__foot">
        <span class="card__docs">${icon("doc", "icon--s")}${p.docs.length} док.</span>
        <label class="compare-toggle"><input type="checkbox" data-cmp="${p.slug}" ${S.cmp.includes(p.slug) ? "checked" : ""}>Порівняти</label>
      </div>
    </article>`;

  const tableView = (list) => `
    <div style="overflow-x:auto">
    <table class="list-table">
      <thead><tr><th>Модель</th><th>Тип</th><th>Клас</th><th>Живлення</th><th>Черговий струм</th><th>Габарити</th><th>Документи</th><th></th></tr></thead>
      <tbody>${list.map((p) => `<tr>
        <td><a class="pr" href="${window.productUrl(p.slug)}"><img src="${p.photos[0]}" alt=""><b>${p.name}</b></a></td>
        <td>${TYPE_ONE[p.type]}</td>
        <td class="m">${p._cls ? p._cls.base + p._cls.suf : "—"}</td>
        <td class="m">${p.voltage || "—"}</td>
        <td class="m">${p.standby || "—"}</td>
        <td class="m">${(p.dims || "—").replace(/Сенсор 1: /, "")}</td>
        <td class="m">${p.docs.length}</td>
        <td><label class="compare-toggle"><input type="checkbox" data-cmp="${p.slug}" ${S.cmp.includes(p.slug) ? "checked" : ""}><span class="sr-only">Порівняти ${p.name}</span></label></td>
      </tr>`).join("")}</tbody>
    </table></div>`;

  const results = $("[data-results]");
  const sorted = (list) => {
    const l = list.slice();
    if (S.sort === "name") l.sort((a, b) => a.name.localeCompare(b.name, "uk"));
    if (S.sort === "standby") l.sort((a, b) => a._standby - b._standby);
    if (S.sort === "docs") l.sort((a, b) => b.docs.length - a.docs.length);
    return l;
  };
  const plural = (n) => (n % 10 === 1 && n % 100 !== 11 ? "модель" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "моделі" : "моделей");
  const renderResults = () => {
    const list = sorted(P.filter((p) => match(p)));
    $("[data-found]").innerHTML = `Знайдено <span class="num">${list.length}</span> ${plural(list.length)}`;
    if (!list.length) {
      results.innerHTML = `<div class="empty"><b>Немає моделей з такими параметрами</b><p>Спробуйте прибрати один із фільтрів або зверніться до технічного відділу — підкажемо аналог.</p><button class="btn btn--ink btn--s" type="button" data-reset2>Скинути фільтри</button></div>`;
      $("[data-reset2]").addEventListener("click", reset);
      return;
    }
    results.innerHTML = S.view === "grid" ? `<div class="grid">${list.map(card).join("")}</div>` : tableView(list);
  };

  /* ---------- порівняння ---------- */
  const tray = $("[data-tray]"), trayItems = $("[data-tray-items]");
  const bySlug = (s) => P.find((p) => p.slug === s);
  const renderTray = () => {
    tray.classList.toggle("is-open", S.cmp.length > 0);
    trayItems.innerHTML = S.cmp.map((s) => {
      const p = bySlug(s);
      return `<span><img src="${p.photos[0]}" alt="">${p.name}<button type="button" aria-label="Прибрати ${p.name}" data-uncmp="${s}">${icon("close", "icon--s")}</button></span>`;
    }).join("");
    $("[data-compare-open]").disabled = S.cmp.length < 2;
    $("[data-compare-open]").style.opacity = S.cmp.length < 2 ? ".5" : "";
  };
  document.addEventListener("change", (e) => {
    const c = e.target.closest("[data-cmp]");
    if (!c) return;
    const s = c.dataset.cmp;
    if (c.checked) {
      if (S.cmp.length >= 4) { c.checked = false; return; }
      S.cmp.push(s);
    } else S.cmp = S.cmp.filter((x) => x !== s);
    renderTray();
  });
  trayItems.addEventListener("click", (e) => {
    const b = e.target.closest("[data-uncmp]");
    if (!b) return;
    S.cmp = S.cmp.filter((x) => x !== b.dataset.uncmp);
    renderTray(); renderResults();
  });

  const sheet = $("[data-sheet]"), back = $("[data-back]");
  const setSheet = (open) => {
    sheet.classList.toggle("is-open", open);
    sheet.setAttribute("aria-hidden", String(!open));
    back.classList.toggle("is-open", open || $("#filters").classList.contains("is-open"));
    if (open) $("[data-sheet-close]").focus();
  };
  const cmpRows = [
    ["Тип", (p) => TYPE_ONE[p.type]],
    ["Клас EN 54-5", (p) => (p._cls ? p._cls.base + p._cls.suf : "—")],
    ["Напруга живлення", (p) => p.voltage || "—"],
    ["Струм у черговому режимі", (p) => p.standby || "—"],
    ["Температура спрацювання", (p) => (p.temp ? `${p.temp[0]}–${p.temp[1]} °C` : "—")],
    ["Підключення", (p) => (p.wires.length ? p.wires.map((w) => w + "-провідне").join(", ") : "—")],
    ["Індикація чергового режиму", (p) => p.dutyled || "—"],
    ["Габарити", (p) => p.dims || "—"],
    ["Маса", (p) => p.mass || "—"],
    ["Регіон поставки", (p) => p.region.join(", ") || "—"],
    ["Сертифікат ЄС", (p) => (p._eu ? "Так" : "Ні")],
    ["Документів", (p) => String(p.docs.length)],
  ];
  const renderCmp = () => {
    const ps = S.cmp.map(bySlug);
    const onlyDiff = $("[data-only-diff]").checked;
    const rows = cmpRows.map(([k, f]) => {
      const vals = ps.map(f);
      const diff = new Set(vals).size > 1;
      if (onlyDiff && !diff) return "";
      return `<tr class="${diff ? "diff" : ""}"><th scope="row">${k}</th>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`;
    }).join("");
    $("[data-cmp-body]").innerHTML = `<table class="cmp"><thead><tr><th></th>${ps.map((p) => `<td><img src="${p.photos[0]}" alt=""><b><a href="${window.productUrl(p.slug)}">${p.name}</a></b></td>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
  };
  $("[data-compare-open]").addEventListener("click", () => { renderCmp(); setSheet(true); });
  $("[data-only-diff]").addEventListener("change", renderCmp);
  $("[data-sheet-close]").addEventListener("click", () => setSheet(false));

  /* ---------- мобільні фільтри ---------- */
  const filters = $("#filters");
  const setFilters = (open) => {
    filters.classList.toggle("is-open", open);
    back.classList.toggle("is-open", open || sheet.classList.contains("is-open"));
  };
  $("[data-filters-open]").addEventListener("click", () => setFilters(true));
  $$("[data-filters-close]").forEach((b) => b.addEventListener("click", () => setFilters(false)));
  back.addEventListener("click", () => { setFilters(false); setSheet(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setFilters(false); setSheet(false); } });

  function update() {
    $("[data-total]").textContent = S.type === "all" ? P.length : P.filter((p) => p.type === S.type).length;
    renderTypes(); renderFilters(); renderResults();
  }
  update(); renderTray();
})();
