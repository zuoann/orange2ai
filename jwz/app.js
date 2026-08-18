/* =====================================================================
   菌物志 · 菌菌有神 · app.js —— 渲染与交互逻辑
   依赖：data.js（window.MUSHROOMS）、style.css、index.html 中的 DOM 结构
   ===================================================================== */
(function () {
  "use strict";

  var MUSHROOMS = window.MUSHROOMS || [];

  /* ------------------------------------------------------------------
   * 工具
   * ------------------------------------------------------------------ */
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CATEGORY = {
    edible:  { label: "可食用", cls: "badge-edible" },
    caution: { label: "慎食", cls: "badge-caution" },
    toxic:   { label: "有毒/剧毒", cls: "badge-toxic" }
  };

  /* 菌盖颜色归一化：由 features.capColor 派生（支持全部菌种） */
  function colorOf(m) {
    var c = (m.features && m.features.capColor) || "";
    var out = [];
    if (/白/.test(c)) out.push("白");
    if (/灰/.test(c)) out.push("灰");
    if (/褐|棕/.test(c)) out.push("褐");
    if (/红/.test(c)) out.push("红");
    if (/绿|青/.test(c)) out.push("绿");
    if (/黄/.test(c)) out.push("黄");
    if (/橙/.test(c)) out.push("橙");
    if (/黑/.test(c)) out.push("黑");
    if (/紫/.test(c)) out.push("紫");
    return out;
  }

  /* 真实照片路径（存于 images/ 目录，文件名与 id 一致） */
  function imageOf(m) { return "images/" + m.id + ".jpg"; }

  /* 图片 + SVG 兜底：图片加载失败时自动回退到手绘插图 */
  function artInner(m) {
    return '<img class="art-img" src="' + imageOf(m) + '" alt="' + esc(m.name) + '" loading="lazy" ' +
      'onerror="this.hidden=true;this.nextElementSibling.hidden=false" />' +
      '<span class="art-fallback" hidden>' + svgFor(m) + "</span>";
  }

  /* ------------------------------------------------------------------
   * SVG 插图生成器（纯手绘风格，仅作示意，非植物学精确图）
   * ------------------------------------------------------------------ */
  var CAP_PATHS = {
    convex:  "M16 80 Q16 36 60 32 Q104 36 104 80 Z",
    bell:    "M30 78 Q28 16 60 13 Q92 16 90 78 Z",
    flat:    "M14 80 Q14 46 60 44 Q106 46 106 80 Z",
    conical: "M22 82 Q28 20 60 9 Q92 20 98 82 Z"
  };

  function gid() { return "svg" + Math.random().toString(36).slice(2, 9); }

  function capHex(colorStr) {
    var c = colorStr || "";
    if (/黑/.test(c)) return "#4a443e";
    if (/紫/.test(c)) return "#8a6fa8";
    if (/红/.test(c)) return "#c0392b";
    if (/橙/.test(c)) return "#d28a4e";
    if (/黄/.test(c)) return "#e8c84e";
    if (/绿|青/.test(c)) return "#6fae7a";
    if (/白/.test(c)) return "#f0eadc";
    if (/灰/.test(c)) return "#9aa0a3";
    if (/褐|棕/.test(c)) return "#8b5e34";
    return "#8b5e34";
  }

  function shade(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * 0.72);
    var g = Math.round(((n >> 8) & 255) * 0.72);
    var b = Math.round((n & 255) * 0.72);
    var h = function (v) { return ("0" + v.toString(16)).slice(-2); };
    return "#" + h(r) + h(g) + h(b);
  }

  function deriveSvg(m) {
    var f = m.features || {};
    var cap = capHex(f.capColor);
    var ht = f.hymeniumType || "";
    var form = "agaric";
    if (/菌管/.test(ht)) form = "bolete";
    else if (/珊瑚/.test(ht)) form = "coral";
    else if (/网状菌裙/.test(ht)) form = "veiled";
    else if (/齿状菌刺/.test(ht)) form = "toothed";
    return {
      form: form,
      capShape: "convex",
      cap: cap,
      cap2: shade(cap),
      texture: "smooth",
      stem: /菌管|珊瑚/.test(ht) ? shade(cap) : cap,
      gill: /黄/.test(f.hymenium || "") ? "#e0c060" : "#f4ead8",
      bulbous: !!f.volva,
      ring: !!f.ring,
      volva: !!f.volva,
      bruise: /蓝/.test(f.bruise || "")
    };
  }

  function svgFor(m) {
    var p = m.svg || deriveSvg(m);
    switch (p.form) {
      case "coral":   return coralSVG(p);
      case "veiled":  return veiledSVG(p);
      case "bolete":  return boleteSVG(p);
      case "toothed": return toothedSVG(p);
      default:        return agaricSVG(p);
    }
  }

  function wrap(inner, id, w, h) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + '-cap" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="__C1__"/><stop offset="1" stop-color="__C2__"/></linearGradient></defs>' +
      inner + "</svg>";
  }

  function ground() {
    return '<ellipse cx="60" cy="138" rx="44" ry="7" fill="#b8c49c"/>' +
           '<ellipse cx="60" cy="138" rx="26" ry="5" fill="rgba(60,70,55,0.22)"/>';
  }

  function agaricSVG(p) {
    var id = gid();
    var cap = p.cap || "#c0a077", cap2 = p.cap2 || cap;
    var stem = p.stem || "#e8dcc4", gill = p.gill || "#f4ead8";
    var inner = "";
    // 菌柄
    if (p.bulbous) {
      inner += '<path d="M52 82 L68 82 L72 134 Q60 140 48 134 Z" fill="' + stem + '"/>';
    } else {
      inner += '<rect x="53" y="82" width="14" height="54" rx="7" fill="' + stem + '"/>';
    }
    // 菌环
    if (p.ring) {
      inner += '<path d="M50 106 Q60 98 70 106 Q60 116 50 106 Z" fill="' + gill + '" opacity="0.95"/>';
    }
    // 菌托
    if (p.volva) {
      inner += '<ellipse cx="60" cy="133" rx="17" ry="6" fill="' + stem + '"/>' +
               '<path d="M45 122 Q60 116 75 122 L72 132 Q60 137 48 132 Z" fill="' + gill + '" opacity="0.95"/>';
    }
    // 菌褶带
    inner += '<path d="M18 80 Q60 90 102 80 L102 89 Q60 99 18 89 Z" fill="' + gill + '"/>';
    for (var gx = 26; gx <= 94; gx += 8) {
      inner += '<line x1="' + gx + '" y1="83" x2="' + gx + '" y2="90" stroke="rgba(120,110,90,0.18)" stroke-width="1"/>';
    }
    // 菌盖
    inner += '<path d="' + CAP_PATHS[p.capShape || "convex"] + '" fill="url(#' + id + '-cap)"/>';
    // 纹理
    if (p.texture === "spotted") {
      inner += '<circle cx="46" cy="48" r="5" fill="rgba(255,255,255,0.92)"/>' +
               '<circle cx="66" cy="38" r="6" fill="rgba(255,255,255,0.92)"/>' +
               '<circle cx="80" cy="58" r="4.5" fill="rgba(255,255,255,0.92)"/>' +
               '<circle cx="34" cy="64" r="4" fill="rgba(255,255,255,0.92)"/>';
    } else if (p.texture === "scaly") {
      inner += '<path d="M40 46 L52 40 L52 56 Z" fill="rgba(0,0,0,0.28)"/>' +
               '<path d="M62 36 L74 34 L70 50 Z" fill="rgba(0,0,0,0.28)"/>' +
               '<path d="M78 54 L88 50 L82 66 Z" fill="rgba(0,0,0,0.28)"/>' +
               '<path d="M28 60 L38 56 L34 70 Z" fill="rgba(0,0,0,0.28)"/>';
    } else if (p.texture === "cracked") {
      inner += '<path d="M34 48 L48 44 L52 60 L40 64 Z" fill="none" stroke="rgba(70,90,70,0.4)" stroke-width="1.4"/>' +
               '<path d="M58 40 L74 40 L76 56 L62 58 Z" fill="none" stroke="rgba(70,90,70,0.4)" stroke-width="1.4"/>' +
               '<path d="M80 52 L90 56 L84 68 Z" fill="none" stroke="rgba(70,90,70,0.4)" stroke-width="1.4"/>';
    } else if (p.texture === "fibrillose") {
      inner += '<path d="M40 46 Q44 60 42 74" fill="none" stroke="rgba(90,60,35,0.25)" stroke-width="1.6"/>' +
               '<path d="M60 40 Q60 56 58 72" fill="none" stroke="rgba(90,60,35,0.25)" stroke-width="1.6"/>' +
               '<path d="M80 48 Q78 60 76 72" fill="none" stroke="rgba(90,60,35,0.25)" stroke-width="1.6"/>';
    }
    // 见手青受伤变蓝示意
    if (p.bruise) {
      inner += '<path d="M70 66 Q78 70 74 80 Q66 78 70 66 Z" fill="#3f6fb0" opacity="0.9"/>';
    }
    inner += ground();
    var out = wrap(inner, id, 120, 150).replace("__C1__", cap).replace("__C2__", cap2);
    return out;
  }

  function boleteSVG(p) {
    var id = gid();
    var cap = p.cap || "#8b5e34", cap2 = p.cap2 || cap;
    var stem = p.stem || "#dcc8a8", pores = p.gill || "#e8d08a";
    var inner = "";
    inner += '<rect x="50" y="78" width="20" height="58" rx="9" fill="' + stem + '"/>';
    inner += '<path d="M50 104 Q60 110 70 104" fill="none" stroke="rgba(120,95,60,0.3)" stroke-width="1.5"/>';
    // 菌管（海绵状孔）
    inner += '<path d="M18 78 Q60 90 102 78 L102 94 Q60 106 18 94 Z" fill="' + pores + '"/>';
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 9; j++) {
        inner += '<circle cx="' + (22 + j * 9.5) + '" cy="' + (84 + i * 4) + '" r="1" fill="rgba(120,95,40,0.35)"/>';
      }
    }
    inner += '<path d="' + CAP_PATHS[p.capShape || "convex"] + '" fill="url(#' + id + '-cap)"/>';
    if (p.bruise) {
      inner += '<path d="M28 74 Q36 80 30 90 Q22 82 28 74 Z" fill="#3f6fb0" opacity="0.9"/>';
    }
    inner += ground();
    return wrap(inner, id, 120, 150).replace("__C1__", cap).replace("__C2__", cap2);
  }

  function toothedSVG(p) {
    var id = gid();
    var cap = p.cap || "#6b5340", cap2 = p.cap2 || cap;
    var stem = p.stem || "#7a6248", teeth = p.gill || "#9c8a70";
    var inner = "";
    inner += '<rect x="53" y="78" width="14" height="58" rx="7" fill="' + stem + '"/>';
    // 齿状菌刺
    inner += '<path d="M22 78 Q60 88 98 78 L98 84 Q60 94 22 84 Z" fill="' + teeth + '"/>';
    for (var t = 0; t < 9; t++) {
      inner += '<path d="M' + (22 + t * 8) + ' 79 L' + (26 + t * 8) + ' 90 L' + (30 + t * 8) + ' 79 Z" fill="' + teeth + '" stroke="rgba(90,70,50,0.2)"/>';
    }
    inner += '<path d="' + CAP_PATHS[p.capShape || "convex"] + '" fill="url(#' + id + '-cap)"/>';
    inner += '<path d="M36 40 L48 34 L52 48 L42 54 Z" fill="rgba(0,0,0,0.3)"/>' +
             '<path d="M60 34 L72 34 L70 48 L58 50 Z" fill="rgba(0,0,0,0.3)"/>' +
             '<path d="M78 50 L90 46 L86 60 L76 62 Z" fill="rgba(0,0,0,0.3)"/>';
    inner += ground();
    return wrap(inner, id, 120, 150).replace("__C1__", cap).replace("__C2__", cap2);
  }

  function coralSVG(p) {
    var id = gid();
    var c1 = p.cap || "#4a443e", c2 = p.cap2 || c1;
    var inner = "";
    var lobes = [
      "M52 70 Q46 40 40 24 Q50 20 56 34 Q60 52 60 70",
      "M60 74 Q60 34 64 12 Q74 10 74 30 Q76 54 72 74",
      "M68 74 Q76 46 88 32 Q96 38 88 52 Q82 64 80 76",
      "M44 74 Q38 52 30 44 Q26 54 34 64 Q40 70 44 74",
      "M60 76 Q60 58 58 46 Q66 46 66 58 Q68 68 68 76"
    ];
    lobes.forEach(function (d, i) {
      inner += '<path d="' + d + '" fill="url(#' + id + '-cap)"/>';
      inner += '<path d="' + d + '" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="1.4"/>';
    });
    inner += '<rect x="55" y="72" width="10" height="62" rx="5" fill="' + (p.stem || c1) + '"/>';
    inner += ground();
    return wrap(inner, id, 120, 150).replace("__C1__", c1).replace("__C2__", c2);
  }

  function veiledSVG(p) {
    var id = gid();
    var stem = p.stem || "#f7f2e6", cap = p.cap2 || "#6b5b3a";
    var inner = "";
    inner += '<rect x="54" y="44" width="12" height="92" rx="6" fill="' + stem + '"/>';
    // 网状菌裙
    for (var k = 0; k < 8; k++) {
      var x1 = 30 + k * 8, x2 = 60 + (x1 - 60) * 0.5;
      inner += '<path d="M' + x1 + ' 46 Q' + x2 + ' 92 ' + x1 + ' 120" fill="none" stroke="rgba(230,225,210,0.9)" stroke-width="2"/>';
    }
    inner += '<path d="M38 60 Q60 70 82 60 M34 84 Q60 96 86 84 M40 106 Q60 116 80 106" fill="none" stroke="rgba(230,225,210,0.85)" stroke-width="1.6"/>';
    // 顶部菌盖
    inner += '<path d="M44 46 Q60 36 76 46 L72 52 Q60 56 48 52 Z" fill="' + cap + '"/>';
    inner += '<ellipse cx="60" cy="136" rx="20" ry="5" fill="rgba(120,90,60,0.3)"/>';
    inner += ground();
    var out = wrap(inner, id, 120, 150).replace("__C1__", stem).replace("__C2__", stem);
    return out;
  }

  /* ------------------------------------------------------------------
   * 图鉴：渲染 + 搜索 + 分类筛选
   * ------------------------------------------------------------------ */
  var state = { category: "all", query: "" };
  var grid = $("#mushroomGrid");
  var searchInput = $("#searchInput");

  function matchesFilters(m) {
    if (state.category !== "all" && m.category !== state.category) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = (m.name + " " + m.latin + " " + (m.aliases || []).join(" ")).toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function cardHTML(m) {
    var c = CATEGORY[m.category];
    return '<article class="mushroom-card" data-id="' + esc(m.id) + '" tabindex="0" role="button" aria-label="查看 ' + esc(m.name) + ' 详情">' +
      '<div class="card-art">' + artInner(m) + "</div>" +
      '<h3 class="card-name">' + esc(m.name) + "</h3>" +
      '<p class="card-latin">' + esc(m.latin) + "</p>" +
      '<div class="card-meta"><span class="badge ' + c.cls + '">' + c.label + "</span>" +
      '<span class="card-tag">' + esc(m.season) + "</span></div>" +
      "</article>";
  }

  function renderGallery() {
    var list = MUSHROOMS.filter(matchesFilters);
    grid.innerHTML = list.map(cardHTML).join("");
    $("#emptyTip").hidden = list.length > 0;
  }

  function bindGallery() {
    searchInput.addEventListener("input", function () {
      state.query = searchInput.value;
      renderGallery();
    });
    $("#categoryChips").addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      state.category = btn.getAttribute("data-cat");
      $all("#categoryChips .chip").forEach(function (c) { c.classList.toggle("active", c === btn); });
      renderGallery();
    });
    grid.addEventListener("click", function (e) {
      var card = e.target.closest(".mushroom-card");
      if (card) openModal(card.getAttribute("data-id"));
    });
    grid.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        var card = e.target.closest(".mushroom-card");
        if (card) { e.preventDefault(); openModal(card.getAttribute("data-id")); }
      }
    });
  }

  /* ------------------------------------------------------------------
   * 详情弹窗
   * ------------------------------------------------------------------ */
  var modalBackdrop = $("#modalBackdrop");
  var modalBody = $("#modalBody");

  function openModal(id) {
    var m = MUSHROOMS.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var c = CATEGORY[m.category];
    var f = m.features || {};
    var yesNo = function (b) { return b ? "有" : "无"; };
    var cautionCls = m.category === "toxic" ? "" : m.category === "caution" ? "caution-amber" : "caution-safe";
    var cautionTitle = m.category === "toxic" ? "⚠️ 毒性警示" : m.category === "caution" ? "⚠️ 食用注意" : "✅ 食用安全";

    modalBody.innerHTML =
      '<div class="modal-top">' +
        '<div class="modal-art">' + artInner(m) + "</div>" +
        '<div class="modal-head">' +
          '<h2 id="modalName">' + esc(m.name) + "</h2>" +
          '<p class="latin">' + esc(m.latin) + "</p>" +
          '<p class="aliases">别名：' + esc((m.aliases || []).join("、")) + "</p>" +
          '<div class="modal-badges">' +
            '<span class="badge ' + c.cls + '">' + c.label + "</span>" +
            '<span class="card-tag">' + esc(m.season) + "</span>" +
            '<span class="card-tag">' + esc(m.habitat) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="detail-block"><h4>识别要点</h4><p>' + esc(m.description) + "</p></div>" +
      '<div class="detail-block"><h4>关键特征</h4><div class="feature-grid">' +
        fItem("菌盖颜色", f.capColor) +
        fItem("菌盖下方", f.hymeniumType + " · " + f.hymenium) +
        fItem("菌柄", f.stem) +
        fItem("菌环", yesNo(f.ring)) +
        fItem("菌托", yesNo(f.volva)) +
        fItem("受伤变色", f.bruise) +
      "</div></div>" +
      '<div class="detail-block"><div class="caution-box ' + cautionCls + '"><strong>' + cautionTitle + "：</strong>" + esc(m.caution) + "</div></div>" +
      '<div class="detail-block"><h4>易混淆种</h4><ul>' + (m.similar || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";

    modalBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function fItem(k, v) {
    return '<div class="f-item"><b>' + esc(k) + "</b>" + esc(v) + "</div>";
  }
  function closeModal() {
    modalBackdrop.hidden = true;
    document.body.style.overflow = "";
  }
  function bindModal() {
    $("#modalClose").addEventListener("click", closeModal);
    modalBackdrop.addEventListener("click", function (e) { if (e.target === modalBackdrop) closeModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalBackdrop.hidden) closeModal();
    });
  }

  /* ------------------------------------------------------------------
   * 首页：统计 + 装饰菌
   * ------------------------------------------------------------------ */
  function renderHero() {
    var stats = { total: MUSHROOMS.length, edible: 0, caution: 0, toxic: 0 };
    MUSHROOMS.forEach(function (m) { stats[m.category]++; });
    $("#heroStats").innerHTML =
      "<span><b>" + stats.total + "</b>种常见菌</span>" +
      "<span><b>" + stats.edible + "</b>种可食用</span>" +
      "<span><b>" + stats.caution + "</b>种慎食</span>" +
      "<span><b>" + stats.toxic + "</b>种有毒/剧毒</span>";

    var picks = ["songrong", "qingtoujun", "jianshouqing", "jizong", "duying-san"];
    var dy = [0, 18, 40, 8, 26];
    $("#heroMushrooms").innerHTML = picks.map(function (id, i) {
      var m = MUSHROOMS.filter(function (x) { return x.id === id; })[0];
      var bob = (i * 0.65 + 0.4).toFixed(2);
      return '<div class="mini" style="--dy:' + dy[i] + 'px;--bob-delay:' + bob + 's">' + artInner(m) + "<span>" + esc(m.name) + "</span></div>";
    }).join("");
  }

  /* ------------------------------------------------------------------
   * 漂浮孢子 + 每日菌语（氛围点缀）
   * ------------------------------------------------------------------ */
  var SPORE_CHARS = ["·", "✦", "❋", "·", "✦", "🍄", "☘", "·", "✦", "❀"];
  var SPORE_COLORS = ["rgba(140,195,150,", "rgba(238,182,150,", "rgba(150,200,190,", "rgba(238,186,120,", "rgba(190,180,228,"];

  function renderSpores() {
    var field = $("#sporeField");
    if (!field) return;
    var html = "";
    var n = 26;
    for (var i = 0; i < n; i++) {
      var ch = SPORE_CHARS[Math.floor(Math.random() * SPORE_CHARS.length)];
      var isEmoji = ch === "🍄" || ch === "☘" || ch === "❀";
      var size = isEmoji ? Math.round(12 + Math.random() * 14) : Math.round(4 + Math.random() * 7);
      var dur = (14 + Math.random() * 22).toFixed(1);
      var delay = (-Math.random() * dur).toFixed(1);
      var left = (Math.random() * 100).toFixed(1);
      var dx = Math.round(Math.random() * 130 - 65);
      var dx2 = Math.round(Math.random() * 130 - 65);
      var op = (0.16 + Math.random() * 0.38).toFixed(2);
      var color = SPORE_COLORS[Math.floor(Math.random() * SPORE_COLORS.length)] + op + ")";
      var body = isEmoji ? ch : "";
      var dotStyle = isEmoji ? "" : "width:" + size + "px;height:" + size + "px;border-radius:50%;background:" + color + ";box-shadow:0 0 10px " + color + ";";
      html += '<span class="spore" style="left:' + left + '%;font-size:' + size + 'px;color:' + color + ";--dx:" + dx + "px;--dx2:" + dx2 + "px;--o:" + op + ";animation-duration:" + dur + "s;animation-delay:" + delay + "s;" + dotStyle + '">' + body + "</span>";
    }
    field.innerHTML = html;
  }

  var QUOTES = [
    "菌子不语，山野自明。",
    "一箸菌香，皆是雨后的山野。",
    "识得菌中真味，方知万物有神。",
    "采菌需谨慎，食菌需敬畏。",
    "一朵菌，藏着整片森林的故事。",
    "白伞可致命，鲜红未必毒。",
    "不认识的菌子，就让它继续长在山里。"
  ];

  function startQuoteRotator() {
    var el = $("#heroQuote");
    if (!el) return;
    var i = Math.floor(Math.random() * QUOTES.length);
    el.textContent = QUOTES[i];
    setInterval(function () {
      el.style.opacity = "0";
      setTimeout(function () {
        i = (i + 1) % QUOTES.length;
        el.textContent = QUOTES[i];
        el.style.opacity = "1";
      }, 520);
    }, 6200);
  }

  /* ------------------------------------------------------------------
   * 背景音乐（Web Audio 生成的森系环境音，无需音频文件）
   * ------------------------------------------------------------------ */
  var AmbientMusic = (function () {
    var ctx = null, master = null, timer = null, running = false, drones = [];
    // A 小调五声音阶（近似），听感柔和、似风铃
    var PENTA = [220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99];

    function ensureCtx() {
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      // 低音铺底（双振荡器轻微失谐，营造林间低鸣）
      var droneGain = ctx.createGain();
      droneGain.gain.value = 0.045;
      droneGain.connect(master);
      [[55, 'sine'], [110, 'sine'], [164.8, 'triangle']].forEach(function (pair) {
        var o = ctx.createOscillator();
        o.type = pair[1];
        o.frequency.value = pair[0];
        o.detune.value = Math.random() * 8 - 4;
        var g = ctx.createGain();
        g.gain.value = 0.5;
        o.connect(g); g.connect(droneGain);
        o.start();
        drones.push(o);
      });
      return true;
    }

    function pluck() {
      if (!running || !ctx) return;
      var now = ctx.currentTime;
      var f = PENTA[Math.floor(Math.random() * PENTA.length)];
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      var g = ctx.createGain();
      var peak = 0.10 + Math.random() * 0.09;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
      var delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.34;
      var fb = ctx.createGain(); fb.gain.value = 0.32;
      var wet = ctx.createGain(); wet.gain.value = 0.3;
      o.connect(g); g.connect(master);
      g.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
      o.start(now); o.stop(now + 1.8);
    }

    function start() {
      if (running) return;
      if (!ensureCtx()) return;
      if (ctx.state === 'suspended') ctx.resume();
      running = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.9);
      if (timer) clearInterval(timer);
      timer = setInterval(pluck, 640);
      pluck();
    }

    function stop() {
      if (!running || !ctx) return;
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      setTimeout(function () { if (ctx && ctx.state === 'running') ctx.suspend(); }, 500);
    }

    return { start: start, stop: stop, isRunning: function () { return running; } };
  })();

  function bindMusic() {
    var btn = $("#musicToggle");
    var icon = $("#musicIcon");
    if (!btn || !icon) return;
    function setUI(on) {
      icon.textContent = on ? "🎵" : "🔇";
      btn.classList.toggle("playing", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.title = on ? "关闭背景音乐" : "开启背景音乐";
    }
    btn.addEventListener("click", function () {
      var on = !AmbientMusic.isRunning();
      if (on) AmbientMusic.start(); else AmbientMusic.stop();
      setUI(on);
    });
    setUI(false);
  }

  /* ------------------------------------------------------------------
   * 光标跟随孢子特效
   * ------------------------------------------------------------------ */
  function bindCursorSpores() {
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
    var layer = document.createElement("div");
    layer.className = "cursor-layer";
    document.body.appendChild(layer);
    var last = 0;
    document.addEventListener("mousemove", function (e) {
      var now = Date.now();
      if (now - last < 46) return;
      last = now;
      spawnCursorSpore(layer, e.clientX, e.clientY);
    });
  }

  function spawnCursorSpore(layer, x, y) {
    var s = document.createElement("span");
    s.className = "cursor-spore";
    var r = Math.random();
    var isEmoji = r < 0.13;
    var size, dx, dy, op, t;
    var c = ["140,195,150", "238,182,150", "150,200,190", "238,186,120"][Math.floor(Math.random() * 4)];
    if (isEmoji) {
      var em = ["✦", "❋", "·", "🍄"];
      s.textContent = em[Math.floor(Math.random() * em.length)];
      size = Math.round(11 + Math.random() * 8);
      op = (0.5 + Math.random() * 0.4).toFixed(2);
      s.style.color = "rgba(238,186,120," + op + ")";
      s.style.textShadow = "0 0 8px rgba(238,186,120,0.8)";
    } else {
      size = Math.round(4 + Math.random() * 5);
      op = (0.55 + Math.random() * 0.4).toFixed(2);
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.borderRadius = "50%";
      s.style.background = "rgba(" + c + "," + op + ")";
      s.style.boxShadow = "0 0 10px rgba(" + c + ",0.85)";
    }
    dx = Math.round(Math.random() * 70 - 35);
    dy = Math.round(16 + Math.random() * 34);
    t = (0.6 + Math.random() * 0.55).toFixed(2);
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.fontSize = size + "px";
    s.style.setProperty("--dx", dx + "px");
    s.style.setProperty("--dy", dy + "px");
    s.style.setProperty("--o", op);
    s.style.setProperty("--t", t + "s");
    layer.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 1600);
  }

  /* ------------------------------------------------------------------
   * 主题切换 + 移动端导航
   * ------------------------------------------------------------------ */
  function bindThemeSwitcher() {
    var switcher = $("#themeSwitcher");
    if (!switcher) return;
    var btns = Array.prototype.slice.call(switcher.querySelectorAll(".theme-btn"));
    function apply(theme) {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem("junjun_theme", theme); } catch (e) {}
      btns.forEach(function (b) {
        var on = b.getAttribute("data-theme") === theme;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
    switcher.addEventListener("click", function (e) {
      var b = e.target.closest(".theme-btn");
      if (b) apply(b.getAttribute("data-theme"));
    });
    apply(document.documentElement.dataset.theme || "forest");
  }

  function bindMobileNav() {
    var btn = $("#navToggle");
    var nav = $("#mainNav");
    if (!btn || !nav) return;
    function close() {
      btn.classList.remove("open");
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !btn.contains(e.target) && nav.classList.contains("open")) close();
    });
  }

  /* ------------------------------------------------------------------
   * 特征识别：逐步问答
   * ------------------------------------------------------------------ */
  var QUESTIONS = [
    {
      title: "它生长在什么环境？",
      options: [
        { label: "林地 / 林下地面", icon: "🌲", match: function (m) { return m.habitats.indexOf("林地") !== -1; } },
        { label: "草坪 / 草地", icon: "🌱", match: function (m) { return m.habitats.indexOf("草地") !== -1; } },
        { label: "腐木 / 枯木上", icon: "🪵", match: function (m) { return m.habitats.indexOf("腐木") !== -1; } }
      ]
    },
    {
      title: "菌盖主要是什么颜色？",
      options: [
        { label: "白色 / 米白", swatch: "#f2efe6", match: colorMatcher("白") },
        { label: "灰色", swatch: "#9aa0a3", match: colorMatcher("灰") },
        { label: "褐色 / 棕色", swatch: "#8b5e34", match: colorMatcher("褐") },
        { label: "红色", swatch: "#c0392b", match: colorMatcher("红") },
        { label: "绿色", swatch: "#6fae7a", match: colorMatcher("绿") },
        { label: "黄色", swatch: "#e8c84e", match: colorMatcher("黄") },
        { label: "橙色 / 橙褐", swatch: "#d28a4e", match: colorMatcher("橙") },
        { label: "黑色", swatch: "#3a3a38", match: colorMatcher("黑") },
        { label: "紫色", swatch: "#8a6fa8", match: colorMatcher("紫") }
      ]
    },
    {
      title: "菌盖下方是什么结构？",
      options: [
        { label: "菌褶（片状）", icon: "🥂", match: function (m) { return m.features.hymeniumType === "菌褶"; } },
        { label: "菌管（海绵状细孔）", icon: "🧽", match: function (m) { return m.features.hymeniumType === "菌管"; } },
        { label: "齿状菌刺", icon: "🦷", match: function (m) { return m.features.hymeniumType === "齿状菌刺"; } },
        { label: "珊瑚状 / 网状等特殊形态", icon: "🪸", match: function (m) { return m.features.hymeniumType === "珊瑚状" || m.features.hymeniumType === "网状菌裙"; } }
      ]
    },
    {
      title: "菌柄上是否有菌环（膜状裙边）？",
      options: [
        { label: "有菌环", icon: "💍", match: function (m) { return m.features.ring === true; } },
        { label: "无菌环", icon: "🚫", match: function (m) { return m.features.ring !== true; } }
      ]
    },
    {
      title: "菌柄基部是否有杯状/袋状菌托？",
      options: [
        { label: "有菌托", icon: "🥚", match: function (m) { return m.features.volva === true; } },
        { label: "无菌托", icon: "🚫", match: function (m) { return m.features.volva !== true; } }
      ]
    },
    {
      title: "菌肉受伤后是否变色 / 有特殊表现？",
      options: [
        { label: "迅速变蓝", swatch: "#3f6fb0", match: function (m) { return m.features.bruise === "变蓝"; } },
        { label: "变红至变黑", swatch: "#7a2b1c", match: function (m) { return m.features.bruise === "变红至黑"; } },
        { label: "流出白色乳汁", swatch: "#f2e2c4", match: function (m) { return m.features.bruise === "出白色乳汁"; } },
        { label: "基本不变", swatch: "#c8c4b6", match: function (m) { return m.features.bruise === "不变"; } }
      ]
    },
    {
      title: "大致在什么季节发现？",
      options: [
        { label: "春季", icon: "🌸", match: function (m) { return m.features.seasons.indexOf("春") !== -1; } },
        { label: "夏季", icon: "☀️", match: function (m) { return m.features.seasons.indexOf("夏") !== -1; } },
        { label: "秋季", icon: "🍂", match: function (m) { return m.features.seasons.indexOf("秋") !== -1; } }
      ]
    }
  ];

  function colorMatcher(color) {
    return function (m) { return colorOf(m).indexOf(color) !== -1; };
  }

  var wizard = {
    history: [], // 每个元素为 { matcher: fn|null, label: string }
    el: {
      bar: $("#progressBar"),
      text: $("#progressText"),
      label: $("#questionLabel"),
      title: $("#questionTitle"),
      options: $("#questionOptions"),
      list: $("#matchList"),
      count: $("#matchCount"),
      note: $("#matchNote"),
      skip: $("#btnSkip"),
      prev: $("#btnPrev"),
      reset: $("#btnReset")
    }
  };

  function currentMatches() {
    return MUSHROOMS.filter(function (m) {
      return wizard.history.every(function (h) { return !h.matcher || h.matcher(m); });
    });
  }

  function renderWizard() {
    var total = QUESTIONS.length;
    var step = wizard.history.length;
    var done = step >= total;

    wizard.el.bar.style.width = (step / total * 100) + "%";
    wizard.el.text.textContent = done ? "已完成" : "第 " + (step + 1) + " / " + total + " 步";
    wizard.el.prev.disabled = step === 0;

    if (done) {
      wizard.el.label.textContent = "识别完成";
      wizard.el.title.textContent = "请核对下方候选菌种";
      wizard.el.options.innerHTML = "";
      wizard.el.skip.hidden = true;
      wizard.el.prev.hidden = true;
      wizard.el.reset.textContent = "重新识别";
      renderMatchPanel(true);
      return;
    }

    var q = QUESTIONS[step];
    wizard.el.label.textContent = "第 " + (step + 1) + " 步";
    wizard.el.title.textContent = q.title;
    wizard.el.skip.hidden = false;
    wizard.el.prev.hidden = false;
    wizard.el.reset.textContent = "重新开始";

    var matches = currentMatches();
    wizard.el.options.innerHTML = q.options.map(function (opt) {
      var visual = opt.swatch
        ? '<span class="swatch" style="background:' + opt.swatch + '"></span>'
        : '<span class="q-icon">' + opt.icon + "</span>";
      var after = matches.filter(opt.match).length;
      return '<button class="q-option" type="button">' + visual +
        '<span class="q-text">' + esc(opt.label) + "</span>" +
        '<span class="q-remain">' + (after > 0 ? "约 " + after + " 种" : "无匹配") + "</span></button>";
    }).join("");

    renderMatchPanel(false);
  }

  function renderMatchPanel(isFinal) {
    var matches = currentMatches();
    wizard.el.count.textContent = matches.length + " 种";
    if (matches.length === 0) {
      wizard.el.list.innerHTML = "";
      wizard.el.note.textContent = "没有符合全部特征的菌种，可能某一特征观察有误，或该菌尚未收录。请点「上一步」调整。";
      return;
    }
    wizard.el.list.innerHTML = matches.map(function (m) {
      var c = CATEGORY[m.category];
      return '<div class="match-item" data-id="' + esc(m.id) + '" tabindex="0">' + artInner(m) +
        '<div><div class="m-name">' + esc(m.name) + ' <span class="badge ' + c.cls + '">' + c.label + "</span></div>" +
        '<div class="m-latin">' + esc(m.latin) + "</div></div></div>";
    }).join("");
    wizard.el.note.textContent = isFinal
      ? "⚠️ 请结合菌盖、菌褶/菌管、菌环、菌托、生境等多重特征并请专业人员复核；无法 100% 确认时切勿食用。"
      : "继续回答可进一步缩小范围；不确定的项可跳过。";
  }

  function bindWizard() {
    wizard.el.options.addEventListener("click", function (e) {
      var btn = e.target.closest(".q-option");
      if (!btn) return;
      var step = wizard.history.length;
      var opt = QUESTIONS[step].options[$all(".q-option").indexOf(btn)];
      wizard.history.push({ matcher: opt.match, label: opt.label });
      renderWizard();
    });
    wizard.el.skip.addEventListener("click", function () {
      if (wizard.history.length >= QUESTIONS.length) return;
      wizard.history.push({ matcher: null, label: "跳过" });
      renderWizard();
    });
    wizard.el.prev.addEventListener("click", function () {
      wizard.history.pop();
      renderWizard();
    });
    wizard.el.reset.addEventListener("click", function () {
      wizard.history = [];
      renderWizard();
    });
    wizard.el.list.addEventListener("click", function (e) {
      var item = e.target.closest(".match-item");
      if (item) openModal(item.getAttribute("data-id"));
    });
  }

  /* ------------------------------------------------------------------
   * 拍照识别：本地神经网络（默认）+ 云端 API 升级
   * ------------------------------------------------------------------ */
  var dropzone = $("#dropzone");
  var fileInput = $("#fileInput");
  var photoResult = $("#photoResult");
  var photoPreview = $("#photoPreview");
  var photoReportBody = $("#photoReportBody");
  var engineBadge = $("#engineBadge");
  var photoLoading = $("#photoLoading");
  var photoLoadingText = $("#photoLoadingText");
  var aiProviderEl = $("#aiProvider");
  var aiKeyEl = $("#aiKey");
  var apiKeyRow = $("#apiKeyRow");
  var aiEngineStatus = $("#aiEngineStatus");

  var TFJS_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
  var MOBILENET_URL = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js";

  var aiState = {
    provider: localStorage.getItem("junjun_provider") || "tf",
    key: localStorage.getItem("junjun_key") || "",
    model: null,
    modelPromise: null,
    refs: null,
    refsPromise: null
  };

  function mushroomById(id) {
    for (var i = 0; i < MUSHROOMS.length; i++) if (MUSHROOMS[i].id === id) return MUSHROOMS[i];
    return null;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("无法加载 " + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureMobileNet() {
    if (aiState.model) return Promise.resolve(aiState.model);
    if (aiState.modelPromise) return aiState.modelPromise;
    aiState.modelPromise = loadScript(TFJS_URL)
      .then(function () { return loadScript(MOBILENET_URL); })
      .then(function () {
        if (!window.mobilenet) throw new Error("模型脚本加载失败");
        return window.mobilenet.load({ version: 2, alpha: 0.5 });
      })
      .then(function (model) { aiState.model = model; return model; });
    return aiState.modelPromise;
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("图片加载失败：" + src)); };
      img.src = src;
    });
  }

  function refPathsFor(m) {
    var paths = [imageOf(m)];
    for (var i = 1; i <= 3; i++) paths.push("images/refs/" + m.id + "/" + i + ".jpg");
    return paths;
  }

  function makeSquareCanvas(img, zoom, ox, oy, flip) {
    var S = 256;
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    var minDim = Math.min(w, h);
    var sx = (w - minDim) / 2;
    var sy = (h - minDim) / 2;
    var crop = minDim * zoom;
    var slack = minDim - crop;
    var cx = sx + slack / 2 + (ox * slack / 2);
    var cy = sy + slack / 2 + (oy * slack / 2);
    var canvas = document.createElement("canvas");
    canvas.width = S; canvas.height = S;
    var ctx = canvas.getContext("2d");
    if (flip) { ctx.translate(S, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, cx, cy, crop, crop, 0, 0, S, S);
    return canvas;
  }

  function getReferences(model, onProgress) {
    if (aiState.refs) return Promise.resolve(aiState.refs);
    if (aiState.refsPromise) return aiState.refsPromise;
    var total = MUSHROOMS.length * 4;
    var done = 0;
    var tasks = [];
    MUSHROOMS.forEach(function (m) {
      refPathsFor(m).forEach(function (path) {
        tasks.push(
          loadImage(path)
            .then(function (img) {
              return model.infer(makeSquareCanvas(img, 1, 0, 0, false), true).data();
            })
            .then(function (emb) { return { id: m.id, emb: emb }; })
            .catch(function () { return null; }) // 缺失的参考图跳过
            .then(function (r) {
              done++;
              if (onProgress) onProgress(done, total);
              return r;
            })
        );
      });
    });
    aiState.refsPromise = Promise.all(tasks).then(function (list) {
      var map = {};
      list.forEach(function (x) {
        if (!x) return;
        (map[x.id] = map[x.id] || []).push(x.emb);
      });
      aiState.refs = map;
      return map;
    });
    return aiState.refsPromise;
  }

  function cosineSimilarity(a, b) {
    var dot = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  var VIEWS = [
    { zoom: 1.0, ox: 0, oy: 0, flip: false },
    { zoom: 1.0, ox: 0, oy: 0, flip: true },
    { zoom: 0.85, ox: 0, oy: 0, flip: false },
    { zoom: 0.85, ox: -1, oy: 0, flip: false },
    { zoom: 0.85, ox: 1, oy: 0, flip: false },
    { zoom: 0.85, ox: 0, oy: -1, flip: false }
  ];

  function recognizeLocal(img, onProgress) {
    return ensureMobileNet().then(function (model) {
      return getReferences(model, onProgress).then(function (refs) {
        var viewCanvases = VIEWS.map(function (v) {
          return makeSquareCanvas(img, v.zoom, v.ox, v.oy, v.flip);
        });
        return Promise.all(viewCanvases.map(function (c) {
          return model.infer(c, true).data();
        })).then(function (viewEmbs) {
          var scored = MUSHROOMS.map(function (m) {
            var refsList = refs[m.id] || [];
            var best = -1;
            refsList.forEach(function (refEmb) {
              viewEmbs.forEach(function (q) {
                var s = cosineSimilarity(q, refEmb);
                if (s > best) best = s;
              });
            });
            return { m: m, sim: best };
          });
          scored.sort(function (a, b) { return b.sim - a.sim; });
          return {
            engine: "本地神经网络 · MobileNet（多参考图 + 数据增强）",
            items: scored.slice(0, 5).map(function (s) {
              return {
                title: s.m.name,
                latin: s.m.latin,
                score: (s.sim + 1) / 2,
                matchedId: s.m.id
              };
            })
          };
        });
      });
    });
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error("读取文件失败")); };
      r.readAsDataURL(file);
    });
  }

  function matchLocal(q) {
    var s = String(q || "").toLowerCase().trim();
    if (!s) return null;
    for (var i = 0; i < MUSHROOMS.length; i++) {
      var m = MUSHROOMS[i];
      var latin = m.latin.toLowerCase();
      var genusSpecies = latin.split(/\s+/).slice(0, 2).join(" ");
      if (s === latin || s === genusSpecies) return m;
      if (m.name === q) return m;
      if ((m.aliases || []).indexOf(q) !== -1) return m;
    }
    return null;
  }

  function recognizePlantId(key, dataUrl) {
    return fetch("https://api.plant.id/v2/identify", {
      method: "POST",
      headers: { "Api-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        images: [dataUrl],
        modifiers: ["crops_fast", "similar_images"],
        plant_language: "zh",
        plant_details: ["common_names", "name_authority"]
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("Plant.id 请求失败（HTTP " + r.status + "）");
      return r.json();
    }).then(function (d) {
      return (d.suggestions || []).map(function (s) {
        var latin = s.plant_name || s.name || "";
        var common = ((s.plant_details && s.plant_details.common_names) || []).join(" / ");
        var m = matchLocal(latin);
        return {
          title: m ? m.name : (common || latin),
          latin: latin,
          common: common,
          score: s.probability || 0,
          matchedId: m ? m.id : null
        };
      });
    });
  }

  function recognizeGcv(key, base64) {
    return fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ image: { content: base64 }, features: [{ type: "LABEL_DETECTION", maxResults: 10 }] }] })
    }).then(function (r) {
      if (!r.ok) throw new Error("Google Vision 请求失败（HTTP " + r.status + "）");
      return r.json();
    }).then(function (d) {
      var labels = (d.responses && d.responses[0] && d.responses[0].labelAnnotations) || [];
      return labels.map(function (l) {
        var m = matchLocal(l.description);
        return {
          title: m ? m.name : l.description,
          latin: m ? m.latin : "",
          score: l.score || 0,
          matchedId: m ? m.id : null
        };
      });
    });
  }

  function recognizeCloud(provider, key, file) {
    return fileToDataUrl(file).then(function (dataUrl) {
      if (provider === "plantid") {
        return recognizePlantId(key, dataUrl).then(function (items) {
          return { engine: "Plant.id 云端识别", items: items };
        });
      }
      if (provider === "gcv") {
        return recognizeGcv(key, dataUrl.split(",")[1]).then(function (items) {
          return { engine: "Google Vision 云端识别", items: items };
        });
      }
      throw new Error("未知的识别引擎");
    });
  }

  function bindPhoto() {
    dropzone.addEventListener("click", function () { fileInput.click(); });
    dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
    });
    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files[0]) handlePhoto(fileInput.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.add("dragover"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); dropzone.classList.remove("dragover"); });
    });
    dropzone.addEventListener("drop", function (e) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handlePhoto(e.dataTransfer.files[0]);
    });
  }

  function handlePhoto(file) {
    if (!/^image\//.test(file.type)) {
      alert("请上传图片文件（JPG / PNG）");
      return;
    }
    var url = URL.createObjectURL(file);
    photoPreview.onload = function () {
      URL.revokeObjectURL(url);
      runRecognition(file);
    };
    photoPreview.src = url;
    photoResult.hidden = false;
    showLoading("正在识别…");
  }

  function runRecognition(file) {
    var provider = aiState.provider;
    var key = aiState.key.trim();

    function doLocal(note) {
      var total = MUSHROOMS.length * 4;
      showLoading(
        !aiState.model ? "正在加载模型（首次需下载，约 10~20 秒）…" :
        !aiState.refs ? "正在建立参考图库 0/" + total + "…" :
        "正在识别…"
      );
      recognizeLocal(photoPreview, function (done, all) {
        showLoading("正在建立参考图库 " + done + "/" + all + "…");
      }).then(function (res) {
        if (note) res.warning = note;
        hideLoading();
        renderReport(res);
      }).catch(function (err) {
        hideLoading();
        renderReport({ engine: "", error: err && err.message ? err.message : "识别失败" });
      });
    }

    if (provider !== "tf" && key) {
      showLoading("正在调用云端识别…");
      recognizeCloud(provider, key, file).then(function (res) {
        hideLoading();
        renderReport(res);
      }).catch(function (err) {
        doLocal("云端识别失败（" + (err && err.message ? err.message : "未知错误") + "），已回退本地识别。");
      });
    } else if (provider !== "tf" && !key) {
      doLocal("未配置 API Key，本次使用本地神经网络识别。");
    } else {
      doLocal(null);
    }
  }

  function showLoading(text) {
    photoLoading.hidden = false;
    photoLoadingText.textContent = text;
    photoReportBody.innerHTML = "";
  }
  function hideLoading() { photoLoading.hidden = true; }

  function renderReport(res) {
    engineBadge.textContent = res.engine || "";
    var html = "";
    if (res.warning) html += '<div class="report-warn">' + esc(res.warning) + "</div>";
    if (res.error) {
      html += '<div class="report-warn">⚠️ ' + esc(res.error) + "，请检查网络后重试。</div>";
    } else if (res.items && res.items.length) {
      html += res.items.map(reportItemHTML).join("");
    } else {
      html += '<p class="report-guess">未获得识别结果。</p>';
    }
    html += '<div class="report-warn">⚠️ AI 识别结果<b>仅供参考，不构成任何鉴定或食用依据</b>。野生菌请结合菌盖、菌褶/菌管、菌环、菌托、生境等多重特征并请专业人员复核。</div>';
    photoReportBody.innerHTML = html;
    photoReportBody.querySelectorAll(".result-item").forEach(function (item) {
      item.addEventListener("click", function () {
        var id = item.getAttribute("data-id");
        if (id) openModal(id);
      });
    });
  }

  function reportItemHTML(it) {
    var m = it.matchedId ? mushroomById(it.matchedId) : null;
    var badge = m
      ? '<span class="badge ' + CATEGORY[m.category].cls + '">' + CATEGORY[m.category].label + "</span>"
      : '<span class="badge badge-unknown">未收录</span>';
    var pct = Math.round(Math.max(0, Math.min(1, it.score || 0)) * 100);
    var sub = it.latin
      ? (it.common && it.common !== it.latin ? esc(it.common) + " · " : "") + esc(it.latin)
      : "";
    var dataAttr = m ? ' data-id="' + esc(m.id) + '" tabindex="0"' : "";
    return '<div class="result-item"' + dataAttr + ">" +
      '<div class="result-head">' +
        '<span class="result-name">' + esc(it.title) + " " + badge + "</span>" +
        '<span class="result-score">' + pct + "%</span>" +
      "</div>" +
      (sub ? '<div class="result-sub">' + sub + "</div>" : "") +
      '<div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div>' +
      (m ? '<div class="result-link">查看识别要点与安全提示 →</div>' : "") +
      "</div>";
  }

  function bindSettings() {
    aiProviderEl.value = aiState.provider;
    aiKeyEl.value = aiState.key;
    syncSettingsUI();
    aiProviderEl.addEventListener("change", function () {
      aiState.provider = aiProviderEl.value;
      localStorage.setItem("junjun_provider", aiState.provider);
      syncSettingsUI();
    });
    aiKeyEl.addEventListener("input", function () {
      aiState.key = aiKeyEl.value;
      localStorage.setItem("junjun_key", aiState.key);
      syncSettingsUI();
    });
  }

  function syncSettingsUI() {
    var isCloud = aiState.provider !== "tf";
    apiKeyRow.hidden = !isCloud;
    if (!isCloud) {
      aiEngineStatus.textContent = "免费 · 本地运行，无需密钥；首次使用需联网加载模型。";
    } else {
      aiEngineStatus.textContent = aiState.key.trim()
        ? "已配置密钥 ✓ 将使用云端高精度识别（密钥仅保存在本机浏览器）。"
        : "未配置密钥，将自动回退到本地识别。";
    }
  }

  /* ------------------------------------------------------------------
   * 初始化
   * ------------------------------------------------------------------ */
  function init() {
    renderSpores();
    startQuoteRotator();
    bindMusic();
    bindCursorSpores();
    bindThemeSwitcher();
    bindMobileNav();
    renderHero();
    renderGallery();
    renderWizard();
    bindGallery();
    bindModal();
    bindWizard();
    bindPhoto();
    bindSettings();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
