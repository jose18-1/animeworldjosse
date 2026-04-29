/* script.js
   - Inicializa barras de atributos
   - Crea partículas de fondo con ajuste por pantalla
   - Activa carruseles automáticos y soporte táctil (swipe)
   - Control de menú móvil
*/

document.addEventListener('DOMContentLoaded', () => {
  // Animar barras de atributos según data-width
  document.querySelectorAll('.fill').forEach(el => {
    const w = el.getAttribute('data-width') || '70%';
    setTimeout(() => el.style.width = w, 120);
  });

  // Inicializar carruseles (cada .carousel independiente)
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const slides = carousel.querySelectorAll('.slide');
    if (!slides.length) return;
    let current = 0;
    slides.forEach((s,i) => s.classList.toggle('active', i === 0));

    // rotación automática
    const interval = setInterval(() => {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 4000);

    // Soporte táctil: swipe left/right
    let startX = 0;
    let isTouch = false;
    carousel.addEventListener('touchstart', (e) => {
      isTouch = true;
      startX = e.touches[0].clientX;
    }, {passive:true});
    carousel.addEventListener('touchmove', (e) => {
      if (!isTouch) return;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 40) {
        clearInterval(interval);
        slides[current].classList.remove('active');
        if (dx < 0) current = (current + 1) % slides.length;
        else current = (current - 1 + slides.length) % slides.length;
        slides[current].classList.add('active');
        isTouch = false;
      }
    }, {passive:true});
    carousel.addEventListener('touchend', () => { isTouch = false; });
  });

  // Menu móvil toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      const isVisible = menu.style.display === 'flex';
      menu.style.display = isVisible ? 'none' : 'flex';
      menu.style.flexDirection = 'column';
      menu.style.position = 'absolute';
      menu.style.right = '20px';
      menu.style.top = '60px';
      menu.style.background = 'rgba(10,10,10,0.95)';
      menu.style.padding = '12px';
      menu.style.borderRadius = '8px';
      menu.style.boxShadow = '0 8px 30px rgba(0,0,0,0.6)';
    });
    // Close menu on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) menu.style.display = '';
    });
  }
});

/* Partículas de fondo responsivas */
(function(){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  document.body.appendChild(canvas);

  let W = canvas.width = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  // Ajusta cantidad según tamaño de pantalla para rendimiento móvil
  function particleCount() {
    if (W < 480) return 30;
    if (W < 900) return 50;
    return 90;
  }

  let num = particleCount();
  let particles = [];

  window.addEventListener('resize', () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    num = particleCount();
    initParticles();
  });

  function rand(min,max){ return Math.random()*(max-min)+min; }

  class P {
    constructor(){ this.reset(); }
    reset(){
      this.x = rand(0, W);
      this.y = rand(0, H);
      this.r = rand(0.6, 2.2);
      this.vx = rand(-0.25, 0.25);
      this.vy = rand(-0.25, 0.25);
      this.alpha = rand(0.08, 0.6);
      this.color = `rgba(255,165,0,${this.alpha})`;
    }
    update(){
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -10 || this.x > W+10 || this.y < -10 || this.y > H+10) this.reset();
    }
    draw(){
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function initParticles(){
    particles = [];
    for(let i=0;i<num;i++) particles.push(new P());
  }

  initParticles();

  function loop(){
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
 /* Reproductor ancho: autoplay silenciado + activar audio cuando el contenedor está visible.
   Soporta YouTube y Vimeo (convierte URL a embed con mute/autoplay).
   Reemplaza data-video en HTML por la URL real del video.
*/

(function(){
  // Construye URL embed para YouTube/Vimeo con opción mute
  function buildEmbedUrl(url, muted = true) {
    if (!url) return null;
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const idMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      const id = idMatch ? idMatch[1] : null;
      if (!id) return null;
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=${muted?1:0}&rel=0&modestbranding=1&playsinline=1`;
    }
    // Vimeo
    if (url.includes('vimeo.com')) {
      const idMatch = url.match(/vimeo\.com\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}?autoplay=1&muted=${muted?1:0}&title=0&byline=0&portrait=0`;
    }
    return null;
  }

  // Inicializa cada reproductor en la página
  document.querySelectorAll('.video-wrap').forEach(wrap => {
    const videoUrl = wrap.getAttribute('data-video');
    if (!videoUrl) return;

    const frameContainer = wrap.querySelector('.video-frame');
    const btnPlay = wrap.querySelector('.btn-play');
    const btnMute = wrap.querySelector('.btn-mute');
    const btnFull = wrap.querySelector('.btn-full');

    // Cargar iframe silenciado por defecto (autoplay)
    function loadMutedIframe() {
      const embed = buildEmbedUrl(videoUrl, true);
      if (!embed) return null;
      frameContainer.innerHTML = `<iframe src="${embed}" title="Video" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      return frameContainer.querySelector('iframe');
    }

    // Reemplazar iframe para activar/desactivar mute (algunos navegadores requieren recargar src)
    function replaceIframe(unmute = false) {
      const embed = buildEmbedUrl(videoUrl, !unmute ? true : false);
      if (!embed) return null;
      frameContainer.innerHTML = `<iframe src="${embed}" title="Video" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
      return frameContainer.querySelector('iframe');
    }

    // Inicial load
    let iframe = loadMutedIframe();
    let isPlaying = true;
    let isMuted = true;

    // Play/Pause: usa postMessage para YouTube si es posible, fallback recarga (pausa no siempre posible cross-origin)
    btnPlay.addEventListener('click', () => {
      // Intentar usar postMessage para YouTube player API
      if (iframe && iframe.src.includes('youtube.com/embed/')) {
        iframe.contentWindow.postMessage('{"event":"command","func":"getPlayerState","args":""}', '*');
        // Toggle play/pause via API
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        // Simple toggle UX: recargar con autoplay=1 para play, pauseVideo for pause is best-effort
        // For simplicity toggle by reloading with autoplay param
        if (!isPlaying) {
          iframe.src = iframe.src.replace(/(autoplay=0|autoplay=)/, 'autoplay=1');
          isPlaying = true;
          btnPlay.textContent = '⏸';
        } else {
          iframe.src = iframe.src.replace(/(autoplay=1|autoplay=)/, 'autoplay=0');
          isPlaying = false;
          btnPlay.textContent = '▶';
        }
      } else {
        // Fallback: toggle by reloading src with autoplay param
        if (!iframe) iframe = loadMutedIframe();
        if (!isPlaying) {
          iframe.src = iframe.src.replace(/(autoplay=0|autoplay=)/, 'autoplay=1');
          isPlaying = true;
          btnPlay.textContent = '⏸';
        } else {
          iframe.src = iframe.src.replace(/(autoplay=1|autoplay=)/, 'autoplay=0');
          isPlaying = false;
          btnPlay.textContent = '▶';
        }
      }
    });

    // Mute/Unmute: recarga iframe con mute param cambiado
    btnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      iframe = replaceIframe(!isMuted);
      btnMute.textContent = isMuted ? '🔈' : '🔇';
    });

    // Fullscreen
    btnFull.addEventListener('click', () => {
      const el = wrap.querySelector('.video-frame');
      if (!el) return;
      if (document.fullscreenElement === el) {
        document.exitFullscreen();
        btnFull.textContent = '⤢';
      } else {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        btnFull.textContent = '⤢ Salir';
      }
    });

    // IntersectionObserver: cuando el contenedor esté visible, activar audio automáticamente
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Si está visible al 50% o más, activar audio (reemplazando iframe)
          if (isMuted) {
            iframe = replaceIframe(true); // unmute
            isMuted = false;
            btnMute.textContent = '🔇';
          }
        } else {
          // Si sale de vista, silenciar de nuevo para evitar ruido
          if (!isMuted) {
            iframe = replaceIframe(false); // mute
            isMuted = true;
            btnMute.textContent = '🔈';
          }
        }
      });
    }, { threshold: [0.5] });

    observer.observe(wrap);

    // Mejora: si el navegador bloquea autoplay con sonido, el reemplazo puede no activar audio hasta interacción.
    // Por eso el botón Mute/Unmute está disponible para que el usuario active audio manualmente.
  });
})();
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.video-wrap').forEach(setupLocalPlayer);
});

function setupLocalPlayer(wrap) {
  const video = wrap.querySelector('video');
  const btnPlay = wrap.querySelector('.btn-play');
  const btnMute = wrap.querySelector('.btn-mute');
  const btnFull = wrap.querySelector('.btn-full');

  if (!video) return;

  // Estado inicial
  let isPlaying = !video.paused;
  let isMuted = video.muted;

  function updateButtons() {
    btnPlay.textContent = isPlaying ? '⏸' : '▶';
    btnMute.textContent = isMuted ? '🔈' : '🔇';
  }

  // Intentar reproducir al cargar (autoplay silenciado)
  video.play().then(() => { isPlaying = true; updateButtons(); }).catch(() => { isPlaying = false; updateButtons(); });

  // Play / Pause
  btnPlay.addEventListener('click', () => {
    if (video.paused) {
      video.play().catch(()=>{});
      isPlaying = true;
    } else {
      video.pause();
      isPlaying = false;
    }
    updateButtons();
  });

  // Mute / Unmute
  btnMute.addEventListener('click', () => {
    isMuted = !isMuted;
    video.muted = isMuted;
    updateButtons();
  });

  // Fullscreen
  btnFull.addEventListener('click', () => {
    const el = wrap.querySelector('.video-frame');
    if (!el) return;
    if (document.fullscreenElement === el) {
      document.exitFullscreen();
      btnFull.textContent = '⤢';
    } else {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      btnFull.textContent = '⤢ Salir';
    }
  });

  // Activar audio automáticamente cuando el 50% del contenedor esté visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        // intentar activar audio y reproducir
        if (video.muted) {
          video.muted = false;
          isMuted = false;
        }
        if (video.paused) {
          video.play().catch(()=>{});
          isPlaying = !video.paused;
        }
      } else {
        // silenciar y pausar al salir de vista
        if (!video.muted) {
          video.muted = true;
          isMuted = true;
        }
        if (!video.paused) {
          video.pause();
          isPlaying = false;
        }
      }
      updateButtons();
    });
  }, { threshold: [0.5] });

  observer.observe(wrap);

  // Limpieza al salir de la página
  window.addEventListener('beforeunload', () => {
    try { video.pause(); } catch(e){}
  });

  // Tecla Escape sale de fullscreen si aplica
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
  });

  updateButtons();
}
// Scroll progress and animated scrollbar thumb
(function(){
  const progressWrap = document.getElementById('scroll-progress');
  const progressBar = document.getElementById('scroll-progress-bar');
  if (!progressWrap || !progressBar) return;

  let ticking = false;
  let lastScroll = window.scrollY;
  let scrollTimeout = null;

  function updateProgress() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || window.pageYOffset;
    const height = doc.scrollHeight - window.innerHeight;
    const pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
    progressBar.style.width = pct + '%';

    // hide progress at very top
    if (scrollTop < 8) progressWrap.classList.add('hidden');
    else progressWrap.classList.remove('hidden');

    // detect scroll stop to trigger thumb pulse
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // add class to body to trigger CSS pulse animation on webkit thumb
      document.documentElement.classList.add('scroll-thumb-pulse');
      setTimeout(() => document.documentElement.classList.remove('scroll-thumb-pulse'), 1000);
    }, 180);

    lastScroll = scrollTop;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }

  // initial update
  updateProgress();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // Optional: smooth show on load after small delay
  window.addEventListener('load', () => {
    setTimeout(() => progressWrap.classList.remove('hidden'), 300);
  });
})();

})();
