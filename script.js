(() => {
  'use strict';

  /* ----------------------------------------------------------
     THEME (dark / light, persisted)
  ---------------------------------------------------------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('thinkhardik-theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === `dark` ? 'dark' : 'light';
    const next = current === `dark` ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('thinkhardik-theme', next);
  });

  /* ----------------------------------------------------------
     FULLSCREEN NAV
  ---------------------------------------------------------- */
  const navTrigger = document.getElementById('navTrigger');
  const fullnav = document.getElementById('fullnav');

  function closeNav(){
    fullnav.classList.remove('is-open');
    navTrigger.classList.remove('is-open');
    navTrigger.setAttribute('aria-expanded', 'false');
    fullnav.setAttribute('aria-hidden', 'true');
  }
  function toggleNav(){
    const open = fullnav.classList.toggle('is-open');
    navTrigger.classList.toggle('is-open', open);
    navTrigger.setAttribute('aria-expanded', String(open));
    fullnav.setAttribute('aria-hidden', String(!open));
  }
  navTrigger.addEventListener('click', toggleNav);
  fullnav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  /* ----------------------------------------------------------
     CUSTOM CURSOR
  ---------------------------------------------------------- */
  const cursorDot = document.querySelector('.cursor-dot');
  const cursorRing = document.querySelector('.cursor-ring');
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (!isTouch) {
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

    window.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    });

    function animateRing(){
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const interactiveEls = document.querySelectorAll('a, button, input, textarea, .skill-card, .cert-card');
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-link'));
    });
  }

  /* ----------------------------------------------------------
     VIEWFINDER: 3D tilt, light follow, particles
  ---------------------------------------------------------- */
  const viewfinder = document.getElementById('viewfinder');
  const tiltWrap = document.getElementById('tiltWrap');
  const glow = document.getElementById('viewfinderGlow');
  const particlesHost = document.getElementById('particles');
  let particleTimer = null;

  function spawnParticle(x, y){
    const p = document.createElement('span');
    p.className = 'particle';
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 30;
    p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    particlesHost.appendChild(p);
    setTimeout(() => p.remove(), 1700);
  }

  if (viewfinder && !isTouch) {
    viewfinder.addEventListener('mouseenter', () => {
      viewfinder.classList.add('is-active');
      particleTimer = setInterval(() => {
        const rect = viewfinder.getBoundingClientRect();
        spawnParticle(Math.random() * rect.width, Math.random() * rect.height);
      }, 220);
    });

    viewfinder.addEventListener('mousemove', e => {
      const rect = viewfinder.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;

      const rotateY = px * 16;
      const rotateX = -py * 16;
      tiltWrap.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(10px)`;

      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    });

    viewfinder.addEventListener('mouseleave', () => {
      viewfinder.classList.remove('is-active');
      tiltWrap.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
      clearInterval(particleTimer);
    });
  }

  /* ----------------------------------------------------------
     VIEWFINDER (touch): same tilt / glow / particle effect,
     driven by a finger acting as the cursor
  ---------------------------------------------------------- */
  if (viewfinder && isTouch) {
    function updateViewfinderFromPoint(clientX, clientY){
      const rect = viewfinder.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;

      const rotateY = px * 16;
      const rotateX = -py * 16;
      tiltWrap.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(10px)`;

      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;

      return { x, y };
    }

    viewfinder.addEventListener('touchstart', e => {
      viewfinder.classList.add('is-active');
      const touch = e.touches[0];
      if (touch) updateViewfinderFromPoint(touch.clientX, touch.clientY);

      particleTimer = setInterval(() => {
        const rect = viewfinder.getBoundingClientRect();
        spawnParticle(Math.random() * rect.width, Math.random() * rect.height);
      }, 220);
    }, { passive: true });

    viewfinder.addEventListener('touchmove', e => {
      const touch = e.touches[0];
      if (touch) updateViewfinderFromPoint(touch.clientX, touch.clientY);
    }, { passive: true });

    function resetViewfinderTouch(){
      viewfinder.classList.remove('is-active');
      tiltWrap.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0)';
      clearInterval(particleTimer);
    }

    viewfinder.addEventListener('touchend', resetViewfinderTouch);
    viewfinder.addEventListener('touchcancel', resetViewfinderTouch);
  }

  /* ----------------------------------------------------------
     NAME LETTER HOVER
  ---------------------------------------------------------- */
  document.querySelectorAll('.hero__name-line').forEach(line => {
    const text = line.dataset.text || line.textContent;
    line.innerHTML = '';
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.textContent = ch;
      span.style.transitionDelay = `${i * 18}ms`;
      line.appendChild(span);
    });

    line.addEventListener('mouseenter', () => {
      line.querySelectorAll('.letter').forEach((s, i) => {
        s.style.transform = `translateY(${i % 2 === 0 ? -6 : 6}px)`;
        s.style.color = 'var(--amber)';
      });
    });
    line.addEventListener('mouseleave', () => {
      line.querySelectorAll('.letter').forEach(s => {
        s.style.transform = '';
        s.style.color = '';
      });
    });
  });

  /* ----------------------------------------------------------
     SCROLL REVEALS
  ---------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    '.section-heading, .about__content, .skill-card, .timeline__item, .cert-card, .contact__grid'
  );
  revealTargets.forEach(el => el.setAttribute('data-reveal', ''));

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  revealTargets.forEach(el => io.observe(el));

  /* ----------------------------------------------------------
     CONTACT FORM (front-end only demo)
  ---------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.name.value.trim();
      status.textContent = name
        ? `Thanks, ${name.split(' ')[0]} — message captured locally. Wire this form to a backend or form service to receive it by email.`
        : 'Message captured locally — wire this form to a backend or form service to receive it by email.';
      form.reset();
    });
  }
})();
