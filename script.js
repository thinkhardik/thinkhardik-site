/* ===================================================================
   HARDIK JAIN — PORTFOLIO
   script.js
   Powers: custom cursor, HUD clock/mode, theme toggle, particle
   "refocus" canvas, exploding nav overlay, and page routing.
=================================================================== */

(() => {
  "use strict";

  const root      = document.documentElement;
  const body      = document.body;
  const isTouch   = window.matchMedia("(hover: none)").matches;

  /* ============================================================
     1. THEME TOGGLE
  ============================================================ */
  const themeToggle = document.getElementById("themeToggle");
  const toggleLabel = document.getElementById("toggleLabel");
  const hudMode     = document.getElementById("hudMode");

  const STORAGE_KEY = "hj-portfolio-theme";

  function applyTheme(theme) {
    body.setAttribute("data-theme", theme);
    if (toggleLabel) toggleLabel.textContent = theme.toUpperCase();
    if (hudMode) hudMode.textContent = `MODE: ${theme.toUpperCase()}`;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }

  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    if (saved === "dark" || saved === "light") {
      applyTheme(saved);
    } else {
      applyTheme(body.getAttribute("data-theme") || "dark");
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(current);
    });
  }

  initTheme();

  /* ============================================================
     2. HUD CLOCK (elapsed "recording" time since page load)
  ============================================================ */
  const hudClock = document.getElementById("hudClock");
  const startTime = Date.now();

  function pad(n) { return String(n).padStart(2, "0"); }

  function tickClock() {
    if (!hudClock) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const h = pad(Math.floor(elapsed / 3600));
    const m = pad(Math.floor((elapsed % 3600) / 60));
    const s = pad(elapsed % 60);
    hudClock.textContent = `REC ${h}:${m}:${s}`;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ============================================================
     3. CUSTOM CURSOR
  ============================================================ */
  const cursorDot  = document.querySelector(".cursor-dot");
  const cursorRing = document.querySelector(".cursor-ring");

  if (!isTouch && cursorDot && cursorRing) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      // ease the ring toward the pointer for a soft trailing feel
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    // aperture state — hovering the image / photo panel
    const imagePanel = document.getElementById("imagePanel");
    if (imagePanel) {
      imagePanel.addEventListener("mouseenter", () => {
        cursorRing.classList.add("aperture");
        cursorDot.classList.add("aperture");
      });
      imagePanel.addEventListener("mouseleave", () => {
        cursorRing.classList.remove("aperture");
        cursorDot.classList.remove("aperture");
      });
    }

    // focus-pull state — hovering the name title
    const nameTitle = document.getElementById("nameTitle");
    if (nameTitle) {
      nameTitle.addEventListener("mouseenter", () => {
        cursorRing.classList.add("focus");
        cursorDot.classList.add("focus");
        nameTitle.classList.add("pulling");
        requestAnimationFrame(() => nameTitle.classList.add("sharp"));
      });
      nameTitle.addEventListener("mouseleave", () => {
        cursorRing.classList.remove("focus");
        cursorDot.classList.remove("focus");
        nameTitle.classList.remove("pulling", "sharp");
      });
    }

    // shrink ring slightly on clickable elements
    document.querySelectorAll("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursorRing.style.opacity = ".95");
      el.addEventListener("mouseleave", () => cursorRing.style.opacity = "");
    });
  }

  /* ============================================================
     4. PARTICLE "REFOCUS" CANVAS
     A soft field of bokeh-like particles. Particles near the
     pointer sharpen (less blur, more opacity) while the rest
     stay soft — echoing a shallow depth-of-field pull-focus.
  ============================================================ */
  const canvas = document.getElementById("particleCanvas");

  if (canvas) {
    const ctx = canvas.getContext("2d");
    const imagePanel = document.getElementById("imagePanel");

    let particles = [];
    let width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pointer = { x: -9999, y: -9999, active: false };

    function getThemeColors() {
      const styles = getComputedStyle(body);
      return {
        teal:  styles.getPropertyValue("--teal").trim()  || "#3FBFB0",
        amber: styles.getPropertyValue("--amber").trim() || "#F2A65A",
        ink:   styles.getPropertyValue("--ink").trim()   || "#ECEAE6",
      };
    }

    function resize() {
      const rect = imagePanel.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function buildParticles() {
      const colors = getThemeColors();
      const palette = [colors.teal, colors.amber, colors.ink];
      const count = Math.max(28, Math.round((width * height) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 6 + Math.random() * 26,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        baseAlpha: 0.08 + Math.random() * 0.18,
        color: palette[Math.floor(Math.random() * palette.length)],
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // gentle drift
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.008;

        if (p.x < -40) p.x = width + 40;
        if (p.x > width + 40) p.x = -40;
        if (p.y < -40) p.y = height + 40;
        if (p.y > height + 40) p.y = -40;

        let focusAmount = 0; // 0 = fully soft, 1 = fully sharp
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = Math.max(width, height) * 0.35;
          focusAmount = Math.max(0, 1 - dist / radius);
        }

        const wobble = Math.sin(p.phase) * 2;
        const blurPx = 10 - focusAmount * 9;
        const alpha = p.baseAlpha + focusAmount * 0.5;
        const radius = p.r + wobble * 0.4;

        ctx.save();
        ctx.filter = `blur(${blurPx}px)`;
        ctx.globalAlpha = Math.min(alpha, 0.85);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(draw);
    }

    if (imagePanel) {
      imagePanel.addEventListener("mousemove", (e) => {
        const rect = imagePanel.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      });
      imagePanel.addEventListener("mouseleave", () => {
        pointer.active = false;
      });
    }

    window.addEventListener("resize", resize);

    // rebuild palette when the theme changes
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        setTimeout(buildParticles, 60);
      });
    }

    resize();
    requestAnimationFrame(draw);
  }

  /* ============================================================
     5. EXPLODING NAV OVERLAY
  ============================================================ */
  const menuTrigger = document.getElementById("menuTrigger");
  const navOverlay  = document.getElementById("navOverlay");
  const navClose    = document.getElementById("navClose");
  const infoPanel   = document.getElementById("infoPanel");

  function openNav() {
    if (!navOverlay) return;
    navOverlay.classList.add("open");
    navOverlay.setAttribute("aria-hidden", "false");
    if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "true");
  }

  function closeNav() {
    if (!navOverlay) return;
    navOverlay.classList.remove("open");
    navOverlay.setAttribute("aria-hidden", "true");
    if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
  }

  function toggleNav() {
    if (!navOverlay) return;
    navOverlay.classList.contains("open") ? closeNav() : openNav();
  }

  if (menuTrigger) {
    menuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNav();
    });
  }

  if (navClose) {
    navClose.addEventListener("click", closeNav);
  }

  // clicking anywhere on the info panel (but not on interactive
  // children) opens the menu, per the on-screen hint
  if (infoPanel) {
    infoPanel.addEventListener("click", (e) => {
      const interactive = e.target.closest("a, button, .social-link");
      if (interactive) return;
      openNav();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  /* ============================================================
     6. PAGE ROUTING (split-screen home <-> content pages)
  ============================================================ */
  const homeMain   = document.getElementById("home");
  const pageStage  = document.getElementById("pageStage");
  const backHome   = document.getElementById("backHome");
  const contentPages = document.querySelectorAll(".content-page");
  const navLinks   = document.querySelectorAll(".nav-link");

  function showPage(id) {
    if (!id) return;
    contentPages.forEach((section) => {
      section.classList.toggle("active", section.id === id);
    });
    if (homeMain) homeMain.style.display = "none";
    if (pageStage) pageStage.style.display = "block";
    if (backHome) backHome.classList.add("show");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    closeNav();
    history.replaceState(null, "", `#${id}`);
  }

  function showHome() {
    contentPages.forEach((section) => section.classList.remove("active"));
    if (pageStage) pageStage.style.display = "none";
    if (homeMain) homeMain.style.display = "flex";
    if (backHome) backHome.classList.remove("show");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    history.replaceState(null, "", window.location.pathname);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-target");
      showPage(target);
    });
  });

  if (backHome) {
    backHome.addEventListener("click", showHome);
  }

  // initial state: hide page-stage, respect a direct #hash link on load
  if (pageStage) pageStage.style.display = "none";

  const initialHash = window.location.hash.replace("#", "");
  const validIds = Array.from(contentPages).map((s) => s.id);
  if (initialHash && validIds.includes(initialHash)) {
    showPage(initialHash);
  }

})();
