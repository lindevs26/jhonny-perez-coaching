const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function toast(message) {
  const wrap = $('#toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 3400);
}

$$('img').forEach(img => img.addEventListener('error', () => img.classList.add('is-broken')));

$$('[data-demo]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    toast(el.dataset.demo);
  });
});

const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
  }));
}

const reveals = $$('.reveal');

if (reveals.length) {
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in', 'done'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        revealObserver.unobserve(el);
        el.classList.add('in');
        const delay = parseFloat(el.style.transitionDelay) || 0;
        setTimeout(() => {
          el.classList.add('done');
          el.style.transitionDelay = '';
        }, delay * 1000 + 750);
      });
    }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => {
      const siblings = [...el.parentElement.children].filter(c => c.classList && c.classList.contains('reveal'));
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(idx * 90, 360) + 'ms';
      revealObserver.observe(el);
    });
  }
}

const counters = $$('[data-count]');

if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counterObserver.unobserve(el);
      const target = parseFloat(el.dataset.count) || 0;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const t0 = performance.now();
      const tick = now => {
        const k = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .5 });

  counters.forEach(c => counterObserver.observe(c));
}

const progress = $('#progress');
const toTop = $('#toTop');
const spyLinks = $$('#navLinks a[href^="#"]:not(.nav-cta)');
const spySections = spyLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);

const onScroll = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  if (progress) progress.style.width = (max > 0 ? (doc.scrollTop / max) * 100 : 0) + '%';
  if (toTop) toTop.classList.toggle('show', doc.scrollTop > 560);
  if (spySections.length) {
    const pos = doc.scrollTop + 140;
    let current = spySections[0];
    spySections.forEach(s => { if (s.offsetTop <= pos) current = s; });
    spyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  }
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });

onScroll();

if (toTop) {
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
}

const track = $('#carouselTrack');

if (track) {
  const slides = $$('.slide', track);
  const dotsWrap = $('#carouselDots');
  const carousel = $('#carousel');
  let index = 0;
  let timer;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
    dot.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(dot);
  });

  const dots = $$('.dot', dotsWrap);

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, k) => d.classList.toggle('active', k === index));
  }

  function start() { timer = setInterval(() => go(index + 1), 5500); }
  function stop() { clearInterval(timer); }
  function restart() { stop(); start(); }

  $('#prevBtn').addEventListener('click', () => { go(index - 1); restart(); });
  $('#nextBtn').addEventListener('click', () => { go(index + 1); restart(); });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);

  let startX = null;
  carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
    startX = null;
    start();
  }, { passive: true });

  start();
}

const chips = $$('.chip');
const videoCards = $$('.video-card');

if (chips.length && videoCards.length) {
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.toggle('active', c === chip));
    const cat = chip.dataset.filter;
    videoCards.forEach(card => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.hidden = !show;
      if (show) {
        card.classList.remove('pop');
        void card.offsetWidth;
        card.classList.add('pop');
      }
    });
  }));
}

const loginForm = $('#loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    $('#loginView').hidden = true;
    $('#adminView').hidden = false;
    toast('Bienvenido a tu panel, Jhonny (demo).');
  });

  $('#logoutBtn').addEventListener('click', () => {
    $('#loginView').hidden = false;
    $('#adminView').hidden = true;
    loginForm.reset();
    toast('Sesión cerrada (demo).');
  });
}

const input = $('#videoInput');
const dropzone = $('#dropzone');
const list = $('#videoList');

if (input && dropzone && list) {
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const formatSize = bytes => {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return Math.max(1, Math.round(bytes / 1e3)) + ' KB';
  };

  const addVideos = files => {
    const videos = [...files].filter(f => f.type.startsWith('video/'));
    if (!videos.length) {
      toast('Selecciona un archivo de video válido (MP4, MOV o WEBM).');
      return;
    }
    videos.forEach(file => {
      const li = document.createElement('li');
      li.className = 'video-item';
      li.innerHTML = `
        <div class="thumb"><svg class="ic"><use href="#i-play"/></svg></div>
        <div class="info">
          <p class="title">${esc(file.name)}</p>
          <p class="meta"><span class="tag">Nuevo · solo en esta vista</span> ${formatSize(file.size)} · hace un momento</p>
        </div>
        <label class="switch" title="Mostrar en la web">
          <input type="checkbox" checked />
          <span class="slider"></span>
        </label>
        <button class="icon-btn delete" aria-label="Eliminar video"><svg class="ic ic-sm"><use href="#i-trash"/></svg></button>`;
      list.appendChild(li);
    });
    toast(videos.length === 1
      ? 'Video agregado a la lista (maqueta: no se guarda).'
      : `${videos.length} videos agregados (maqueta: no se guardan).`);
  };

  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      input.click();
    }
  });

  ['dragover', 'dragenter'].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.add('drag');
  }));

  ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  }));

  dropzone.addEventListener('drop', e => addVideos(e.dataTransfer.files));
  input.addEventListener('change', () => { addVideos(input.files); input.value = ''; });

  list.addEventListener('click', e => {
    const btn = e.target.closest('.delete');
    if (!btn) return;
    btn.closest('.video-item').remove();
    toast('Video eliminado de la lista (maqueta: no se guarda).');
  });

  list.addEventListener('change', e => {
    if (e.target.matches('.switch input')) {
      toast(e.target.checked
        ? 'El video se mostrará en la web (demo).'
        : 'El video quedará oculto en la web (demo).');
    }
  });
}
