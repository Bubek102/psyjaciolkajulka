(function () {
  "use strict";

  var CONFIG = window.SITE_CONFIG || {};
  var SERVICES = CONFIG.services || [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  document.documentElement.classList.add("js");

  /* Polska typografia: jednoliterowe spójniki nie zostają na końcu linii */
  var nbsp = function (str) {
    var prev;
    do { prev = str; str = str.replace(/(^|[\s\u00a0(„])([aiouwzAIOUWZ])\s+/g, "$1$2\u00a0"); } while (str !== prev);
    return str.replace(/(\d)\s+(zł|tys\.|min)/g, "$1\u00a0$2").replace(/(\S)\s+–\s/g, "$1\u00a0– ");
  };

  /* ---------- Rok w stopce ---------- */
  $$(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Zdjęcia: zaślepka, gdy pliku jeszcze nie ma ---------- */
  $$(".photo img").forEach(function (img) {
    var box = img.closest(".photo");
    var markEmpty = function () { box.classList.add("is-empty"); };
    if (img.complete && img.naturalWidth === 0) markEmpty();
    img.addEventListener("error", markEmpty);
  });

  /* ---------- Nawigacja ---------- */
  var nav = $(".nav");
  var onScroll = function () { nav.classList.toggle("is-scrolled", window.scrollY > 20); };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var burger = $(".nav__burger");
  var menu = $("#mobile-menu");
  var setMenu = function (open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Zamknij menu" : "Otwórz menu");
    menu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    nav.classList.toggle("is-scrolled", open || window.scrollY > 20);
  };
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  var navLinks = $$(".nav__links a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) { var s = $(a.getAttribute("href")); if (s) spy.observe(s); });
  }

  /* ---------- Animacje wejścia ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Liczniki w hero ---------- */
  $$("[data-count]").forEach(function (el) {
    if (reduceMotion) return;
    var end = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1600, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (end * eased).toFixed(decimals).replace(".", ",") + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    setTimeout(function () { requestAnimationFrame(step); }, 500);
  });

  /* ---------- Ślady łapek w hero ---------- */
  var hero = $("#hero");
  var trail = $(".hero__trail");
  if (hero && trail && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var last = null, left = false;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      if (!last) { last = { x: x, y: y }; return; }
      var dx = x - last.x, dy = y - last.y;
      if (Math.hypot(dx, dy) < 64) return;
      var angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      var off = left ? -12 : 12; left = !left;
      var nx = -dy / Math.hypot(dx, dy) * off, ny = dx / Math.hypot(dx, dy) * off;
      var paw = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      paw.setAttribute("viewBox", "0 0 64 64");
      paw.innerHTML = '<use href="#i-paw"/>';
      paw.style.left = (x + nx - 11) + "px";
      paw.style.top = (y + ny - 11) + "px";
      paw.style.setProperty("--r", angle + "deg");
      trail.appendChild(paw);
      setTimeout(function () { paw.remove(); }, 1700);
      last = { x: x, y: y };
    });
    hero.addEventListener("pointerleave", function () { last = null; });
  }

  /* ---------- Piesek: oczy za kursorem, „Hau!” po kliknięciu ---------- */
  var art = $(".hero__art");
  var pupils = $(".dog__pupils");
  var dogSvg = $(".dog");
  if (art && pupils && dogSvg && !reduceMotion) {
    // oczy podążają za kursorem ze sprężyną (dekoracyjny ruch powinien mieć „pęd”)
    var target = { x: 0, y: 0 }, pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, running = false;
    var STIFF = 0.12, DAMP = 0.72;
    var tick = function () {
      ["x", "y"].forEach(function (k) {
        vel[k] = (vel[k] + (target[k] - pos[k]) * STIFF) * DAMP;
        pos[k] += vel[k];
      });
      pupils.style.transform = "translate(" + pos.x.toFixed(2) + "px," + pos.y.toFixed(2) + "px)";
      if (Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) + Math.abs(vel.x) + Math.abs(vel.y) > 0.02) requestAnimationFrame(tick);
      else running = false;
    };
    window.addEventListener("pointermove", function (e) {
      var r = dogSvg.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var scale = r.width / 400;
      var dx = e.clientX - (r.left + 191 * scale), dy = e.clientY - (r.top + 139 * scale);
      var d = Math.hypot(dx, dy) || 1;
      var k = Math.min(d / 260, 1) * 4;
      target.x = dx / d * k; target.y = dy / d * k;
      if (!running) { running = true; requestAnimationFrame(tick); }
    }, { passive: true });

    var bark = $(".bark");
    var lines = ["Hau!", "Hau, hau!", "Umówisz nas?", "Smaczek?", "Hau, hau, hau!"];
    var n = 0, barkTimer = null;
    art.addEventListener("click", function () {
      bark.textContent = lines[n++ % lines.length];
      art.classList.remove("is-barking"); void art.offsetWidth; art.classList.add("is-barking");
      bark.classList.add("is-on");
      clearTimeout(barkTimer);
      barkTimer = setTimeout(function () { bark.classList.remove("is-on"); }, 1400);
    });
  }

  /* ---------- Sygnały stresu ---------- */
  var SIGNALS = [
    { t: "Otrzepywanie się",
      w: "Pies otrzepuje się jak po kąpieli, choć jest zupełnie suchy. W ten sposób rozładowuje napięcie – często tuż po trudnej sytuacji, np. po spotkaniu z innym psem.",
      d: "Daj mu chwilę przerwy i trochę przestrzeni. To dobry moment, żeby zakończyć interakcję albo odejść kawałek dalej." },
    { t: "Oblizywanie pyska",
      w: "Szybkie oblizanie nosa lub warg, choć w pobliżu nie ma jedzenia. To sygnał lekkiego dyskomfortu i niepewności.",
      d: "Zmniejsz presję: nie pochylaj się nad psem, odsuń się o krok, mów spokojniej i wolniej." },
    { t: "Spięte ciało",
      w: "Sztywne mięśnie, zamknięty pysk, zastygnięcie w bezruchu. Pies intensywnie analizuje sytuację – to może poprzedzać reakcję obronną.",
      d: "Zwiększ dystans od tego, co go niepokoi. Nie popędzaj psa i nie zmuszaj go do kontaktu." },
    { t: "Niska postawa",
      w: "Obniżony tułów, ogon nisko lub pod brzuchem, położone uszy. Pies czuje się niepewnie i próbuje „zrobić się mniejszy”.",
      d: "Pozwól mu się wycofać w bezpieczne miejsce. Nigdy nie wyciągaj psa na siłę z kryjówki." },
    { t: "Odwracanie pyska i wzroku",
      w: "Pies odwraca głowę albo unika kontaktu wzrokowego. To uprzejmy komunikat: „nie szukam konfliktu, zwolnij”.",
      d: "Uszanuj ten sygnał i odpowiedz tym samym: odwróć wzrok, stań bokiem, daj psu czas." },
    { t: "Wysokie pobudzenie",
      w: "Nadmiar emocji: skakanie, szarpanie, brak reakcji na opiekuna. Zwłaszcza w małych przestrzeniach psy nie potrafią dać tym emocjom ujścia.",
      d: "Przenieś spotkanie na otwartą, neutralną przestrzeń i obniż tempo – tam psy mogą regulować emocje i poznać się na niskim pobudzeniu." }
  ];
  var panel = $(".signals__panel");
  var tabs = $$(".signals__list [role=tab]");
  var showSignal = function (i, instant) {
    var s = SIGNALS[i];
    tabs.forEach(function (b, j) {
      b.setAttribute("aria-selected", String(i === j));
      b.tabIndex = i === j ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tabs[i].id);
    $(".signals__index", panel).textContent = String(i + 1).padStart(2, "0") + " / " + String(SIGNALS.length).padStart(2, "0");
    $(".signals__title", panel).textContent = s.t;
    $(".signals__what", panel).textContent = nbsp(s.w);
    $(".signals__do", panel).innerHTML = "<b>Co możesz zrobić?</b> ";
    $(".signals__do", panel).appendChild(document.createTextNode(nbsp(s.d)));
    panel.classList.remove("is-changing");
    // akcji z klawiatury nie animujemy – mają być natychmiastowe
    if (!instant) { void panel.offsetWidth; panel.classList.add("is-changing"); }
  };
  tabs.forEach(function (b, i) {
    b.addEventListener("click", function () { showSignal(i); });
    b.addEventListener("keydown", function (e) {
      var dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      var n = (i + dir + tabs.length) % tabs.length;
      showSignal(n, true); tabs[n].focus();
    });
  });
  if (panel) showSignal(0, true);

  /* ---------- Rezerwacje (Cal.com) ---------- */
  var svcBox = $(".booking__services");
  var embedBox = $("#cal-embed");
  var chosenLabel = $(".booking__chosen");
  var fallback = $(".booking__fallback");
  var loading = $(".booking__loading");
  var current = null;
  var calLoaded = false;
  var calFailed = false;
  var mounted = {};

  var calUrl = function (svc) { return (CONFIG.calOrigin || "https://cal.com") + "/" + svc.calLink; };

  SERVICES.forEach(function (svc) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "svc";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.dataset.id = svc.id;
    b.innerHTML = '<span class="svc__dot"></span><span><span class="svc__name"></span><span class="svc__meta"></span></span><span class="svc__price"></span>';
    $(".svc__name", b).textContent = svc.name;
    $(".svc__meta", b).textContent = svc.meta;
    $(".svc__price", b).textContent = svc.price;
    b.tabIndex = -1;
    b.addEventListener("click", function () { selectService(svc.id); });
    // wzorzec ARIA radiogroup: strzałki przenoszą wybór między usługami
    b.addEventListener("keydown", function (e) {
      var dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      var i = SERVICES.indexOf(svc);
      var next = SERVICES[(i + dir + SERVICES.length) % SERVICES.length];
      selectService(next.id);
      $('.svc[data-id="' + next.id + '"]', svcBox).focus();
    });
    svcBox.appendChild(b);
  });

  var showFallback = function () {
    calFailed = true;
    if (loading) loading.hidden = true;
    embedBox.hidden = true;
    fallback.hidden = false;
  };

  var loadCal = function () {
    if (calLoaded) return;
    calLoaded = true;
    /* Oficjalny snippet osadzania Cal.com */
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal; var ar = arguments;
        if (!cal.loaded) {
          cal.ns = {}; cal.q = cal.q || [];
          var s = d.createElement("script");
          s.src = A;
          s.onerror = showFallback;
          d.head.appendChild(s);
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");
  };

  var mount = function (svc) {
    loadCal();
    $$("[data-ns]", embedBox).forEach(function (el) { el.hidden = el.dataset.ns !== svc.id; });
    if (mounted[svc.id]) return;
    mounted[svc.id] = true;

    var el = document.createElement("div");
    el.dataset.ns = svc.id;
    el.id = "cal-inline-" + svc.id;
    embedBox.appendChild(el);

    var ns = "psy_" + svc.id;
    window.Cal("init", ns, { origin: CONFIG.calOrigin || "https://cal.com" });
    window.Cal.ns[ns]("inline", {
      elementOrSelector: "#" + el.id,
      calLink: svc.calLink,
      config: { layout: "month_view", theme: "light" }
    });
    window.Cal.ns[ns]("ui", {
      theme: "light",
      hideEventTypeDetails: false,
      layout: "month_view",
      cssVarsPerTheme: { light: { "cal-brand": CONFIG.brandColor || "#2f5d50" } }
    });
    window.Cal.ns[ns]("on", {
      action: "linkReady",
      callback: function () {
        calFailed = false;
        if (loading) loading.hidden = true;
        embedBox.hidden = false;
        fallback.hidden = true;
      }
    });
    window.Cal.ns[ns]("on", { action: "linkFailed", callback: showFallback });

    setTimeout(function () {
      if (loading && !loading.hidden && !calFailed) showFallback();
    }, 15000);
  };

  var selectService = function (id, opts) {
    var svc = SERVICES.filter(function (s) { return s.id === id; })[0] || SERVICES[0];
    if (!svc) return;
    current = svc;
    $$(".svc", svcBox).forEach(function (b) {
      var on = b.dataset.id === svc.id;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    chosenLabel.textContent = svc.name + " · " + svc.price;
    $$(".booking__direct").forEach(function (a) { a.href = calUrl(svc); });
    $(".booking__mail").href = "mailto:" + (CONFIG.email || "psyjaciolkajulka@gmail.com") +
      "?subject=" + encodeURIComponent("Rezerwacja: " + svc.name);
    if (!opts || !opts.lazy) mount(svc);
  };

  if (SERVICES.length) selectService(SERVICES[0].id, { lazy: true });

  // Kalendarz ładujemy dopiero, gdy użytkownik zbliża się do sekcji – strona startuje szybciej.
  var bookingSection = $("#kalendarz");
  if ("IntersectionObserver" in window) {
    var calIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { mount(current); calIO.disconnect(); }
    }, { rootMargin: "600px 0px" });
    calIO.observe(bookingSection);
  } else if (current) {
    mount(current);
  }

  var goBook = function (id) {
    selectService(id);
    bookingSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    // po dojechaniu do kalendarza jednorazowo wskaż wybraną usługę
    var chosen = $('.svc[data-id="' + id + '"]', svcBox);
    if (!chosen) return;
    var flash = function () {
      chosen.classList.remove("is-flash"); void chosen.offsetWidth; chosen.classList.add("is-flash");
      setTimeout(function () { chosen.classList.remove("is-flash"); }, 700);
    };
    // scrollend, a gdy przewijania nie było (już jesteśmy przy kalendarzu) – zapasowy timeout
    var done = false;
    var once = function () {
      if (done) return;
      done = true;
      window.removeEventListener("scrollend", once);
      flash();
    };
    if ("onscrollend" in window && !reduceMotion) window.addEventListener("scrollend", once);
    setTimeout(once, reduceMotion ? 0 : 1200);
  };
  $$("[data-book]").forEach(function (b) {
    b.addEventListener("click", function () { goBook(b.getAttribute("data-book")); });
  });

  /* ---------- Dopasowanie usługi ---------- */
  var RECS = {
    "problem-home": { id: "pierwsza", why: "Trudne zachowania najlepiej zrozumieć tam, gdzie się pojawiają. Zobaczę rutynę, przestrzeń i relacje w domu." },
    "problem-remote": { id: "online", why: "Przygotuj nagrania sytuacji, w których pojawia się problem – razem przeanalizujemy je na wideorozmowie." },
    "puppy-home": { id: "pierwsza", why: "Przyjadę do Was i pomogę mądrze zaplanować pierwsze tygodnie szczeniaka – albo przygotować dom przed adopcją." },
    "puppy-remote": { id: "online", why: "Omówimy przygotowanie do adopcji lub pierwsze tygodnie malucha – bez wychodzenia z domu." },
    "training-home": { id: "telefon", label: "Trening indywidualny", why: "Zacznijmy od krótkiej rozmowy – ustalimy cele, a ja przygotuję plan i wycenę treningu." },
    "training-remote": { id: "online", why: "Ustalimy cele i plan ćwiczeń, które zrobisz z psem samodzielnie, a ja będę Was wspierać." },
    "question": { id: "telefon", why: "25 minut wystarczy, żeby rozwiać wątpliwości i wskazać kierunek." }
  };
  var form = $(".matcher__form");
  var result = $(".matcher__result");
  if (form) form.addEventListener("change", function () {
    var need = (form.querySelector("[name=need]:checked") || {}).value;
    var where = (form.querySelector("[name=where]:checked") || {}).value;
    var key = need === "question" ? "question" : (need && where ? need + "-" + where : null);
    if (!key) return;
    var rec = RECS[key];
    var svc = SERVICES.filter(function (s) { return s.id === rec.id; })[0];
    result.classList.remove("is-ready"); void result.offsetWidth;
    result.classList.add("is-ready");
    result.innerHTML = "<small>Polecam</small><h4></h4><p></p>";
    $("h4", result).textContent = (rec.label || svc.name) + " · " + svc.price;
    $("p", result).textContent = nbsp(rec.why);
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "btn"; btn.textContent = "Wybierz termin →";
    btn.addEventListener("click", function () { goBook(svc.id); });
    result.appendChild(btn);
  });

  /* ---------- Mobilny przycisk „Umów się” ---------- */
  var fab = $(".fab");
  if (fab && "IntersectionObserver" in window) {
    var hidden = { hero: true, booking: false };
    var update = function () { fab.classList.toggle("is-hidden", hidden.hero || hidden.booking); };
    new IntersectionObserver(function (e) { hidden.hero = e[0].isIntersecting; update(); }, { threshold: .3 }).observe(hero);
    new IntersectionObserver(function (e) { hidden.booking = e[0].isIntersecting; update(); }).observe(bookingSection);
    update();
  }
})();
