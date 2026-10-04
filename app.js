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

  /* ---------- Siatka Instagrama: pokaż dopiero, gdy są prawdziwe zdjęcia ---------- */
  var feed = $(".feed");
  if (feed) {
    var srcs = $$("img", feed).map(function (img) { return img.getAttribute("src"); });
    var loaded = 0, settled = 0;
    srcs.forEach(function (src) {
      var probe = new Image();
      probe.onload = function () { loaded++; settled++; done(); };
      probe.onerror = function () { settled++; done(); };
      probe.src = src;
    });
    var done = function () { if (settled === srcs.length && loaded === srcs.length) feed.hidden = false; };
  }

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

  /* ---------- Piesek ----------
     Warstwy ruchu jak w maskotkach (Duolingo/Rive): oddech i ogon w CSS, a tu
     „mózg”: sprężyny dla oczu i głowy, uszy z bezwładem, losowe mrugnięcia,
     rozglądanie się, skok po kliknięciu (przygotowanie, rozciągnięcie, lądowanie)
     i drzemka po dłuższej bezczynności. */
  var art = $(".hero__art");
  var dogSvg = $(".dog");
  if (art && dogSvg) {
    var pupils = $(".dog__pupils"), head = $(".dog__head"), eyes = $(".dog__eyes");
    var jumpRig = $(".dog__jump"), shadow = $(".dog__shadow");
    var flops = $$(".dog__ear-flop"), earF = $(".dog__ear--front"), earB = $(".dog__ear--back");
    var bark = $(".bark");
    var lines = ["Hau!", "Hau, hau!", "Umówisz nas?", "Smaczek?", "Hau, hau, hau!"];
    var n = 0, barkTimer = null, excitedTimer = null, happyTimer = null, petTimer = null;
    var petDist = 0, petLast = null, petting = false;
    var tongue = $(".dog__tongue"), lickTongue = $(".dog__lick");
    var visible = true, sleepy = false, lastActive = Date.now(), lastPointer = 0;
    var canAnimate = !reduceMotion && typeof Element !== "undefined" && "animate" in Element.prototype;

    // prosta sprężyna: stiff = sztywność, damp = tłumienie
    var spring = function (stiff, damp) { return { p: 0, v: 0, t: 0, stiff: stiff, damp: damp }; };
    var step = function (sp) { sp.v = (sp.v + (sp.t - sp.p) * sp.stiff) * sp.damp; sp.p += sp.v; return Math.abs(sp.t - sp.p) + Math.abs(sp.v); };
    var eyeX = spring(0.12, 0.72), eyeY = spring(0.12, 0.72), tilt = spring(0.07, 0.8);
    var running = false;
    var loop = function () {
      var energy = step(eyeX) + step(eyeY) + step(tilt);
      pupils.style.transform = "translate(" + eyeX.p.toFixed(2) + "px," + eyeY.p.toFixed(2) + "px)";
      head.style.transform = "rotate(" + tilt.p.toFixed(2) + "deg)";
      // uszy spóźniają się za ruchem głowy (overlapping action)
      var flop = Math.max(-9, Math.min(9, -tilt.v * 16)).toFixed(2);
      flops.forEach(function (f) { f.style.transform = "rotate(" + flop + "deg)"; });
      if (energy > 0.01) requestAnimationFrame(loop); else running = false;
    };
    var kick = function () { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } };

    var blink = function () {
      if (!canAnimate || sleepy) return;
      eyes.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.08)", offset: 0.45 }, { transform: "scaleY(1)" }],
        { duration: 170, easing: "ease-in-out" });
    };

    var setHappy = function (ms) {
      art.classList.add("is-happy");
      clearTimeout(happyTimer);
      happyTimer = setTimeout(function () { if (!petting) art.classList.remove("is-happy"); }, ms);
    };
    var stopPetting = function () {
      petting = false; petDist = 0; petLast = null;
      art.classList.remove("is-petting", "is-happy");
    };

    var wake = function () {
      lastActive = Date.now();
      if (!sleepy) return;
      sleepy = false;
      art.classList.remove("is-sleepy");
      tilt.t = 0; eyeY.t = 0; kick();
      setTimeout(blink, 280);
      setTimeout(blink, 520);
    };
    ["scroll", "keydown", "pointerdown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, wake, { passive: true });
    });

    // oczy i głowa podążają za kursorem; im bliżej pieska, tym mocniej przechyla głowę z ciekawości
    window.addEventListener("pointermove", function (e) {
      wake();
      if (!visible || e.pointerType === "touch") return;
      lastPointer = Date.now();
      var r = dogSvg.getBoundingClientRect(), sc = r.width / 400;
      var dx = e.clientX - (r.left + 190 * sc), dy = e.clientY - (r.top + 148 * sc);
      var d = Math.hypot(dx, dy) || 1, k = Math.min(d / 260, 1) * 4;
      eyeX.t = dx / d * k; eyeY.t = dy / d * k;
      var near = Math.max(0, 1 - d / (r.width * 1.4));
      tilt.t = Math.max(-8, Math.min(8, dx / r.width * 10)) * (0.35 + 0.65 * near);
      art.classList.toggle("is-attentive", near > 0.45);

      // głaskanie: ruch kursora po głowie pieska
      var vx = (e.clientX - r.left) / sc, vy = (e.clientY - r.top) / sc;
      if (Math.hypot(vx - 190, vy - 150) < 82) {
        if (petLast) petDist += Math.hypot(vx - petLast.x, vy - petLast.y);
        petLast = { x: vx, y: vy };
        if (!petting && petDist > 140) {
          petting = true;
          art.classList.add("is-petting", "is-happy");
        }
        if (petting) tilt.t = Math.max(-7, Math.min(7, (vx - 190) / 10)); // wtula głowę w rękę
        clearTimeout(petTimer);
        petTimer = setTimeout(stopPetting, 650);
      } else if (petLast) {
        petLast = null; petDist = 0;
      }
      kick();
    }, { passive: true });

    // gdy nikt nie rusza kursorem: losowe mrugnięcia (czasem podwójne) i rozglądanie się
    if (!reduceMotion) {
      (function scheduleBlink() {
        setTimeout(function () {
          if (visible && !document.hidden) { blink(); if (Math.random() < 0.25) setTimeout(blink, 240); }
          scheduleBlink();
        }, 2200 + Math.random() * 3800);
      })();
      (function scheduleGlance() {
        setTimeout(function () {
          if (visible && !document.hidden && !sleepy && Date.now() - lastPointer > 2500) {
            var look = Math.random();
            eyeX.t = look < 0.4 ? 0 : (Math.random() * 6 - 3);
            eyeY.t = Math.random() * 3 - 1.5;
            tilt.t = Math.random() < 0.35 ? (Math.random() * 8 - 4) : 0;
            kick();
          }
          scheduleGlance();
        }, 1600 + Math.random() * 2200);
      })();
      // od czasu do czasu oblizuje nos (ruch wtórny w spoczynku)
      (function scheduleLick() {
        setTimeout(function () {
          if (canAnimate && visible && !document.hidden && !sleepy && !petting) {
            lickTongue.animate([
              { opacity: 0, transform: "rotate(0deg) scaleY(.35)" },
              { opacity: 1, transform: "rotate(-16deg) scaleY(1)", offset: 0.35 },
              { opacity: 1, transform: "rotate(8deg) scaleY(1)", offset: 0.62 },
              { opacity: 0, transform: "rotate(0deg) scaleY(.35)" }
            ], { duration: 560, easing: "ease-in-out" });
            tongue.animate([{ opacity: 1 }, { opacity: 0, offset: 0.12 }, { opacity: 0, offset: 0.88 }, { opacity: 1 }], { duration: 560 });
          }
          scheduleLick();
        }, 12000 + Math.random() * 14000);
      })();
      // drzemka po 30 s bez żadnej aktywności
      setInterval(function () {
        if (!sleepy && visible && !document.hidden && Date.now() - lastActive > 30000) {
          sleepy = true;
          art.classList.add("is-sleepy");
          eyeX.t = 0; eyeY.t = 1.5; tilt.t = -5; kick();
        }
      }, 2000);
    }

    // kliknięcie: przygotowanie (przysiad) → skok z rozciągnięciem → lądowanie z ugięciem
    art.addEventListener("click", function () {
      wake();
      bark.textContent = lines[n++ % lines.length];
      bark.classList.add("is-on");
      clearTimeout(barkTimer);
      barkTimer = setTimeout(function () { bark.classList.remove("is-on"); }, 1400);
      setHappy(750);
      if (!canAnimate) return;
      var out = "cubic-bezier(0.23, 1, 0.32, 1)", fall = "cubic-bezier(0.55, 0, 1, 0.45)";
      jumpRig.animate([
        { transform: "translateY(0) scale(1, 1)", easing: "ease-in-out" },
        { transform: "translateY(0) scale(1.05, .93)", offset: 0.18, easing: out },
        { transform: "translateY(-24px) scale(.97, 1.05)", offset: 0.48, easing: fall },
        { transform: "translateY(0) scale(1.05, .94)", offset: 0.72, easing: out },
        { transform: "translateY(0) scale(.99, 1.01)", offset: 0.86 },
        { transform: "translateY(0) scale(1, 1)" }
      ], { duration: 640 });
      shadow.animate([
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.04)", offset: 0.18 },
        { transform: "scale(.78)", opacity: 0.55, offset: 0.48 },
        { transform: "scale(1.05)", opacity: 1, offset: 0.72 },
        { transform: "scale(1)", opacity: 1 }
      ], { duration: 640 });
      [[earF, 1], [earB, -1]].forEach(function (pair) {
        var el = pair[0], d = pair[1];
        el.animate([
          { transform: "rotate(0deg)" },
          { transform: "rotate(" + (-4 * d) + "deg)", offset: 0.18 },
          { transform: "rotate(" + (12 * d) + "deg)", offset: 0.5 },
          { transform: "rotate(" + (-9 * d) + "deg)", offset: 0.76 },
          { transform: "rotate(" + (3 * d) + "deg)", offset: 0.9 },
          { transform: "rotate(0deg)" }
        ], { duration: 780, easing: "ease-out" });
      });
      art.classList.add("is-excited");
      clearTimeout(excitedTimer);
      excitedTimer = setTimeout(function () { art.classList.remove("is-excited"); }, 1800);
    });

    // poza ekranem lub w ukrytej karcie piesek odpoczywa (bez zbędnej pracy procesora)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        art.classList.toggle("is-paused", !visible);
      }).observe(art);
    }
    document.addEventListener("visibilitychange", function () { art.classList.toggle("is-paused", document.hidden || !visible); });
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

  /* ---------- Rezerwacje: przejście do kalendarza Cal.com ---------- */
  var CAL_ORIGIN = CONFIG.calOrigin || "https://cal.com";
  var calUrl = function (id) {
    var svc = id && SERVICES.filter(function (s) { return s.id === id; })[0];
    return CAL_ORIGIN + "/" + (svc ? svc.calLink : (CONFIG.calProfile || "psyjaciolka-julka"));
  };
  // linki w HTML mają adres profilu jako fallback; tu podmieniamy je na konkretne usługi z config.js
  $$("[data-cal]").forEach(function (a) { a.href = calUrl(a.getAttribute("data-cal")); });
  var bookingSection = $("#kalendarz");

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
    var btn = document.createElement("a");
    btn.className = "btn"; btn.href = calUrl(svc.id); btn.textContent = "Wybierz termin →";
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
