/* =====================================================================
 * 菌物志 · 3D 菌菇查看器
 * 按菌种特征（菌盖形状/颜色、子实层类型、菌环、菌托、受伤变色）
 * 程序化生成交互式 3D 示意模型（非实物扫描）。
 * 依赖：three.js（按需从 CDN 加载），全局暴露 window.Mushroom3D。
 * ===================================================================== */
(function (global) {
  "use strict";

  var THREE_CDN = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
  var _threePromise = null;

  function loadThree() {
    if (global.THREE) return Promise.resolve(global.THREE);
    if (_threePromise) return _threePromise;
    _threePromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = THREE_CDN;
      s.async = true;
      s.onload = function () { resolve(global.THREE); };
      s.onerror = function () { reject(new Error("3D 引擎加载失败")); };
      document.head.appendChild(s);
    });
    return _threePromise;
  }

  /* 颜色：由特征色字符串映射（与 app.js 一致） */
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
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * k));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * k));
    var b = Math.min(255, Math.round((n & 255) * k));
    var h = function (v) { return ("0" + v.toString(16)).slice(-2); };
    return "#" + h(r) + h(g) + h(b);
  }
  function hexToColor(h) { return new global.THREE.Color(h); }

  /* ---------------- 模型构建 ---------------- */
  function capProfile(shape) {
    var P = global.THREE.Vector2;
    switch (shape) {
      case "funnel": return [new P(0, 0.25), new P(0.35, 0.32), new P(0.7, 0.5), new P(1.0, 0.82), new P(1.08, 1.0)];
      case "flat":   return [new P(0, 0.7), new P(0.4, 0.66), new P(0.85, 0.55), new P(1.05, 0.4)];
      case "bell":   return [new P(0, 1.6), new P(0.3, 1.55), new P(0.7, 1.2), new P(0.95, 0.5), new P(1.05, 0.3)];
      case "conical":return [new P(0, 1.95), new P(0.25, 1.5), new P(0.6, 0.9), new P(0.95, 0.42), new P(1.05, 0.3)];
      default:       return [new P(0, 1.25), new P(0.35, 1.18), new P(0.7, 0.95), new P(0.95, 0.55), new P(1.05, 0.32)];
    }
  }

  function detectShape(m) {
    var cf = (m.features && m.features.capForm) || "";
    if (/漏斗/.test(cf)) return "funnel";
    if (/钟形|圆锥|尖凸|斗笠/.test(cf)) return "conical";
    if (/平展|凹陷/.test(cf)) return "flat";
    return "convex";
  }

  function mesh(geo, color, opts) {
    var o = opts || {};
    var mat = new global.THREE.MeshPhongMaterial({ color: color, transparent: !!o.transparent, opacity: o.opacity || 1 });
    var m = new global.THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  }

  function buildAgaric(m) {
    var T = global.THREE;
    var g = new T.Group();
    var f = m.features || {};
    var capCol = capHex(f.capColor);
    var stemCol = shade(capCol, 0.72);
    var gillCol = /黄/.test(f.hymenium || "") ? "#e0c060" : "#f4ead8";
    var shape = detectShape(m);

    // 菌柄
    var bulb = !!f.volva;
    var stemH = bulb ? 2.6 : 2.2;
    var stemGeo = new T.CylinderGeometry(0.18, bulb ? 0.5 : 0.24, stemH, 16);
    var stem = mesh(stemGeo, stemCol);
    stem.position.y = stemH / 2 - 0.15;
    g.add(stem);

    // 菌托
    if (f.volva) {
      var volva = mesh(new T.SphereGeometry(0.55, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), "#efe7d6");
      volva.position.y = -0.05;
      g.add(volva);
    }
    // 菌环
    if (f.ring) {
      var ring = mesh(new T.TorusGeometry(0.24, 0.05, 10, 24), gillCol);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.35;
      g.add(ring);
    }
    // 菌盖
    var cap = mesh(new T.LatheGeometry(capProfile(shape), 40), capCol);
    cap.position.y = stemH - 0.15;
    g.add(cap);
    // 菌褶
    for (var i = 0; i < 26; i++) {
      var a = (i / 26) * Math.PI * 2;
      var fin = mesh(new T.BoxGeometry(1.05, 0.24, 0.03), gillCol);
      fin.position.set(Math.cos(a) * 0.5, stemH + 0.1, Math.sin(a) * 0.5);
      fin.rotation.y = -a;
      g.add(fin);
    }
    // 受伤变蓝斑点（见手青类）
    if (/蓝/.test(f.bruise || "")) {
      [[0.35, 0.55, 0.25], [-0.5, 0.4, -0.1], [0.6, 0.75, -0.35]].forEach(function (p) {
        var spot = mesh(new T.SphereGeometry(0.07, 8, 8), "#3f6fb0");
        spot.position.set(p[0], stemH + p[1], p[2]);
        g.add(spot);
      });
    }
    return g;
  }

  function buildBolete(m) {
    var T = global.THREE;
    var g = new T.Group();
    var f = m.features || {};
    var capCol = capHex(f.capColor);
    var poreCol = /黄/.test(f.hymenium || "") ? "#e0c060" : "#e8dcc0";
    var stem = mesh(new T.CylinderGeometry(0.22, 0.3, 2.0, 16), shade(capCol, 0.75));
    stem.position.y = 0.85;
    g.add(stem);
    // 菌管层
    var pores = mesh(new T.CylinderGeometry(1.02, 1.0, 0.18, 16), poreCol);
    pores.position.y = 1.95;
    g.add(pores);
    var cap = mesh(new T.LatheGeometry(capProfile("convex"), 40), capCol);
    cap.position.y = 2.05;
    g.add(cap);
    if (/蓝/.test(f.bruise || "")) {
      var spot = mesh(new T.SphereGeometry(0.08, 8, 8), "#3f6fb0");
      spot.position.set(0.4, 2.6, 0.3);
      g.add(spot);
    }
    return g;
  }

  function buildShelf(m) {
    var T = global.THREE;
    var g = new T.Group();
    var f = m.features || {};
    var capCol = capHex(f.capColor);
    var shelf = mesh(new T.CylinderGeometry(1.1, 1.1, 0.4, 24, 1, false, 0, Math.PI), capCol);
    shelf.rotation.z = Math.PI / 2;
    shelf.rotation.y = Math.PI / 6;
    shelf.position.set(0, 1.1, 0);
    g.add(shelf);
    var under = mesh(new T.CylinderGeometry(1.06, 1.06, 0.2, 24, 1, false, 0, Math.PI), "#e8dcc0");
    under.rotation.z = Math.PI / 2;
    under.rotation.y = Math.PI / 6;
    under.position.set(0, 0.92, 0);
    g.add(under);
    return g;
  }

  function buildCoral(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var branches = [
      [0, 0, 0, 1.6, 0], [0.4, 0.2, 0.2, 1.1, 0.4], [-0.4, 0.2, -0.2, 1.1, -0.4],
      [0.3, -0.2, -0.3, 1.0, 0.8], [-0.3, -0.2, 0.3, 1.0, -0.8], [0, 0.3, -0.3, 1.2, 0.2], [0, -0.3, 0.3, 1.2, -0.2]
    ];
    branches.forEach(function (b) {
      var br = mesh(new T.CylinderGeometry(0.05, 0.12, b[3], 8), capCol);
      br.position.set(b[0], b[3] / 2 + 0.2, b[2]);
      br.rotation.z = b[4];
      g.add(br);
      var tip = mesh(new T.SphereGeometry(0.07, 8, 8), capCol);
      tip.position.set(b[0], b[3] + 0.2, b[2]);
      g.add(tip);
    });
    return g;
  }

  function buildToothed(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var stem = mesh(new T.CylinderGeometry(0.2, 0.26, 1.8, 14), shade(capCol, 0.7));
    stem.position.y = 0.75;
    g.add(stem);
    var cap = mesh(new T.LatheGeometry(capProfile("convex"), 36), capCol);
    cap.position.y = 1.85;
    g.add(cap);
    for (var i = 0; i < 22; i++) {
      var a = (i / 22) * Math.PI * 2;
      var r = 0.35 + (i % 5) * 0.15;
      var tooth = mesh(new T.ConeGeometry(0.035, 0.3, 5), "#d8c8a8");
      tooth.position.set(Math.cos(a) * r, 1.7, Math.sin(a) * r);
      tooth.rotation.x = Math.PI;
      g.add(tooth);
    }
    return g;
  }

  function buildVeiled(m) {
    var T = global.THREE;
    var g = new T.Group();
    var stem = mesh(new T.CylinderGeometry(0.16, 0.18, 2.6, 14), "#f2ecdd");
    stem.position.y = 1.2;
    g.add(stem);
    // 菌裙（白色网状圆锥）
    var skirt = mesh(new T.ConeGeometry(0.85, 1.2, 18, 1, true), "#f7f2e6", { transparent: true, opacity: 0.75 });
    skirt.position.y = 2.0;
    g.add(skirt);
    // 顶部菌盖（带孢子黏液）
    var cap = mesh(new T.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), "#6b5b3a");
    cap.position.y = 2.95;
    g.add(cap);
    return g;
  }

  function buildPuffball(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var body = mesh(new T.SphereGeometry(1.0, 24, 18), capCol);
    body.scale.set(1, 1.05, 1);
    body.position.y = 1.1;
    g.add(body);
    return g;
  }

  function buildJelly(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var blob = mesh(new T.SphereGeometry(0.9, 24, 18), capCol, { transparent: true, opacity: 0.85 });
    blob.scale.set(1, 0.6, 1);
    blob.position.y = 0.7;
    g.add(blob);
    [[0.6, 0.4, 0.2], [-0.5, 0.5, -0.3]].forEach(function (p) {
      var b = mesh(new T.SphereGeometry(0.35, 16, 12), capCol, { transparent: true, opacity: 0.8 });
      b.scale.set(1, 0.7, 1);
      b.position.set(p[0], p[1], p[2]);
      g.add(b);
    });
    return g;
  }

  function buildLichen(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var disc = mesh(new T.CylinderGeometry(1.2, 1.2, 0.08, 36), capCol);
    disc.position.y = 0.06;
    g.add(disc);
    [[0.7, 0.05, 0.3], [-0.6, 0.05, -0.4], [0.2, 0.05, 0.8]].forEach(function (p) {
      var lobe = mesh(new T.SphereGeometry(0.28, 12, 10), shade(capCol, 1.08));
      lobe.scale.set(1, 0.35, 1);
      lobe.position.set(p[0], p[1], p[2]);
      g.add(lobe);
    });
    return g;
  }

  function buildGeneric(m) {
    var T = global.THREE;
    var g = new T.Group();
    var capCol = capHex(m.features.capColor);
    var pillar = mesh(new T.CylinderGeometry(0.3, 0.42, 1.6, 14), capCol);
    pillar.position.y = 0.8;
    g.add(pillar);
    var top = mesh(new T.SphereGeometry(0.34, 14, 12), shade(capCol, 0.9));
    top.position.y = 1.7;
    g.add(top);
    return g;
  }

  function buildMushroom(m) {
    var f = m.features || {};
    var form = f.hymeniumType || "菌褶";
    var cf = f.capForm || "";
    if (/珊瑚/.test(form)) return buildCoral(m);
    if (/网状菌裙/.test(form)) return buildVeiled(m);
    if (/齿状菌刺/.test(form)) return buildToothed(m);
    if (/马勃/.test(form)) return buildPuffball(m);
    if (/胶质/.test(form)) return buildJelly(m);
    if (/地衣/.test(form)) return buildLichen(m);
    if (/菌管/.test(form)) {
      if (/扇形|半圆形|马蹄|覆瓦|无柄|平贴/.test(cf)) return buildShelf(m);
      return buildBolete(m);
    }
    if (/菌核|子座|棒状|盘状|蜂窝|脑状|孢梗束|鬼笔/.test(form)) return buildGeneric(m);
    return buildAgaric(m);
  }

  /* ---------------- 查看器 ---------------- */
  function open3DViewer(m) {
    // 有实物扫描数据（mushroom.iflora.cn / Get3D）→ 嵌入实物扫描查看器
    if (m.model3d) { showScanViewer(m); return; }
    loadThree().then(function (THREE) {
      // 遮罩容器
      var wrap = document.createElement("div");
      wrap.className = "viewer3d";
      wrap.innerHTML =
        '<div class="viewer3d-head">' +
          '<span class="viewer3d-title">🧊 ' + esc3(m.name) + ' · 3D 示意</span>' +
          '<div class="viewer3d-headbtns">' +
            '<button class="viewer3d-secbtn" id="viewer3dSecBtn" type="button">🔪 截面</button>' +
            '<button class="viewer3d-close" aria-label="关闭">×</button>' +
          "</div>" +
        "</div>" +
        '<div class="viewer3d-canvas"></div>' +
        '<div class="viewer3d-hint" id="viewer3dHint">拖拽旋转 · 滚轮缩放 · 自动缓慢旋转</div>' +
        '<div class="viewer3d-note">该物种暂无实物扫描数据，显示按特征（菌盖形状/颜色、菌褶/菌管、菌环/菌托）程序化生成的示意模型，非实物扫描。</div>';
      document.body.appendChild(wrap);
      document.body.style.overflow = "hidden";

      var canvasHost = wrap.querySelector(".viewer3d-canvas");
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.localClippingEnabled = true; // 支持截面裁剪
      canvasHost.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      var sun = new THREE.DirectionalLight(0xffffff, 0.9);
      sun.position.set(3, 5, 2);
      scene.add(sun);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.35));

      var model = buildMushroom(m);
      scene.add(model);

      // 截面视图：用裁剪平面切掉右半，露出内部（菌褶/菌管/菌肉）
      var sectionOn = false;
      var clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
      function applySection(on) {
        sectionOn = on;
        model.traverse(function (o) {
          if (!o.isMesh || !o.material) return;
          var mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(function (mat) {
            mat.clippingPlanes = on ? [clipPlane] : [];
            mat.side = on ? THREE.DoubleSide : THREE.FrontSide;
            mat.needsUpdate = true;
          });
        });
        var btn = wrap.querySelector("#viewer3dSecBtn");
        var hint = wrap.querySelector("#viewer3dHint");
        if (btn) btn.classList.toggle("on", on);
        if (hint) hint.textContent = on ? "截面视图：拖拽旋转查看菌褶/菌管/菌肉内部" : "拖拽旋转 · 滚轮缩放 · 自动缓慢旋转";
      }

      // 地面
      var ground = new THREE.Mesh(
        new THREE.CircleGeometry(2.4, 36),
        new THREE.MeshPhongMaterial({ color: 0x2f5d3f, transparent: true, opacity: 0.55 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.01;
      scene.add(ground);

      // 相机轨道
      var az = 0.7, pol = 1.05, dist = 5.5, target = new THREE.Vector3(0, 1.1, 0);
      function updateCam() {
        camera.position.set(
          target.x + dist * Math.sin(pol) * Math.cos(az),
          target.y + dist * Math.cos(pol),
          target.z + dist * Math.sin(pol) * Math.sin(az)
        );
        camera.lookAt(target);
      }
      updateCam();

      function resize() {
        var w = canvasHost.clientWidth, h = canvasHost.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();

      // 交互
      var dragging = false, px = 0, py = 0;
      var onDown = function (e) { dragging = true; px = e.clientX; py = e.clientY; };
      var onMove = function (e) {
        if (!dragging) return;
        az += (e.clientX - px) * 0.008;
        pol += (e.clientY - py) * 0.008;
        pol = Math.max(0.25, Math.min(Math.PI - 0.25, pol));
        px = e.clientX; py = e.clientY;
      };
      var onUp = function () { dragging = false; };
      var onWheel = function (e) {
        e.preventDefault();
        dist *= 1 + (e.deltaY > 0 ? 0.12 : -0.12);
        dist = Math.max(2.2, Math.min(12, dist));
      };
      canvasHost.addEventListener("mousedown", onDown);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      canvasHost.addEventListener("wheel", onWheel, { passive: false });
      // 触屏
      var t0 = null;
      canvasHost.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, { passive: true });
      canvasHost.addEventListener("touchmove", function (e) {
        if (!t0 || e.touches.length !== 1) return;
        var t = e.touches[0];
        az += (t.clientX - t0.x) * 0.01; pol += (t.clientY - t0.y) * 0.01;
        pol = Math.max(0.25, Math.min(Math.PI - 0.25, pol));
        t0 = { x: t.clientX, y: t.clientY };
      }, { passive: true });
      canvasHost.addEventListener("touchend", function () { t0 = null; }, { passive: true });

      var raf = null;
      function animate() {
        if (!sectionOn) az += 0.0025; // 截面时暂停自动旋转，便于观察内部
        updateCam();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      }
      animate();

      var onResize = function () { resize(); };
      window.addEventListener("resize", onResize);

      function close() {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("resize", onResize);
        renderer.dispose();
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        document.body.style.overflow = "";
      }
      wrap.querySelector(".viewer3d-close").addEventListener("click", close);
      var secBtn = wrap.querySelector("#viewer3dSecBtn");
      if (secBtn) secBtn.addEventListener("click", function () { applySection(!sectionOn); });
      wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
      document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
      });
    }).catch(function () {
      var t = document.getElementById("toast");
      if (t) t.textContent = "3D 查看器加载失败，请检查网络";
    });
  }

  /* 实物扫描查看器（iframe 嵌入 mushroom.iflora.cn / Get3D 的 3D 查看器） */
  function showScanViewer(m) {
    var wrap = document.createElement("div");
    wrap.className = "viewer3d";
    var src = m.model3d + (m.model3d.indexOf("embed=") < 0 ? "&embed=true" : "");
    wrap.innerHTML =
      '<div class="viewer3d-head">' +
        '<span class="viewer3d-title">🧊 ' + esc3(m.name) + ' · 实物 3D 扫描</span>' +
        '<div class="viewer3d-headbtns">' +
          '<a class="viewer3d-secbtn" href="' + esc3(m.model3d) + '" target="_blank" rel="noopener">↗ 查看原站</a>' +
          '<button class="viewer3d-close" aria-label="关闭">×</button>' +
        "</div>" +
      "</div>" +
      '<div class="viewer3d-canvas"><iframe src="' + esc3(src) + '" allowfullscreen allow="autoplay; fullscreen" frameborder="0" title="实物 3D 扫描"></iframe></div>' +
      '<div class="viewer3d-hint">拖拽旋转 · 滚轮缩放（3D 由 Get3D 平台渲染）</div>' +
      '<div class="viewer3d-note">实物 3D 扫描由 <a href="https://mushroom.iflora.cn" target="_blank" rel="noopener">中国科学院昆明植物研究所 · mushroom.iflora.cn</a> 提供并经 Get3D 平台嵌入，版权归原作者所有；本站仅嵌入引用，不存储其模型数据。</div>';
    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";
    var close = function () {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
      document.body.style.overflow = "";
    };
    wrap.querySelector(".viewer3d-close").addEventListener("click", close);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) close(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); }
    });
  }

  function esc3(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  global.Mushroom3D = { open: open3DViewer };
})(window);
