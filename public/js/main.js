// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  // Sticky navbar: add a deeper shadow once the page has scrolled
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const updateHeaderScrollState = () => {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    updateHeaderScrollState();
    window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
  }

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const navClose = document.getElementById('navClose');
  const navOverlay = document.getElementById('navOverlay');

  if (navToggle && mainNav) {
    const openNav = () => {
      mainNav.classList.add('open');
      navToggle.classList.add('active');
      if (navOverlay) navOverlay.classList.add('open');
      document.body.classList.add('nav-locked');
    };
    const closeNav = () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('active');
      if (navOverlay) navOverlay.classList.remove('open');
      document.body.classList.remove('nav-locked');
    };

    navToggle.addEventListener('click', () => {
      mainNav.classList.contains('open') ? closeNav() : openNav();
    });
    if (navClose) navClose.addEventListener('click', closeNav);
    if (navOverlay) navOverlay.addEventListener('click', closeNav);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });
  }

  // Scroll-triggered fade-in animation
  const faders = document.querySelectorAll('.fade-in-up');
  if ('IntersectionObserver' in window && faders.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    faders.forEach((el) => observer.observe(el));
  } else {
    faders.forEach((el) => el.classList.add('is-visible'));
  }

  // Homepage hero slideshow: auto-rotate through slides every 5s,
  // swapping the heading/text in sync with the background image.
  const heroSlideshow = document.getElementById('heroSlideshow');
  if (heroSlideshow) {
    const slides = heroSlideshow.querySelectorAll('.hero-slide');
    const textSlides = document.querySelectorAll('#heroTextSlides .hero-text-slide');
    if (slides.length > 1) {
      let current = 0;
      setInterval(() => {
        slides[current].classList.remove('active');
        if (textSlides[current]) textSlides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
        if (textSlides[current]) textSlides[current].classList.add('active');
      }, 2000);
    }
  }
});


// Jay Shakti - "Anatomy of Our Product" scroll-scrubbed 3D frame sequence
// As the user scrolls through the pinned section, a canvas draws the
// matching frame from a pre-rendered image sequence — the scroll position
// literally drives which "angle"/moment of the product is shown, which is
// what produces the smooth 3D / cinematic feel (same technique Apple uses
// on product pages).
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('anatomyScrollTrack');
  const canvas = document.getElementById('anatomyCanvas');
  if (!track || !canvas) return;

  const ctx = canvas.getContext('2d');
  const textLayers = document.querySelectorAll('.anatomy-text-layer');
  const dots = document.querySelectorAll('.anatomy-dots .dot');
  const progressBar = document.getElementById('anatomyProgressBar');
  const scrollHint = document.getElementById('anatomyScrollHint');
  const totalSteps = textLayers.length;

  const frameCount = parseInt(track.dataset.frameCount, 10) || 1;
  const frameBase = track.dataset.frameBase || '';
  const framePad = parseInt(track.dataset.framePad, 10) || 3;
  const frameExt = track.dataset.frameExt || '.jpg';

  const frameUrl = (i) => `${frameBase}${String(i).padStart(framePad, '0')}${frameExt}`;

  // Preload the whole sequence (small JPEGs, a few MB total).
  const images = new Array(frameCount);
  let loadedCount = 0;
  let firstFrameReady = false;

  // How far we're allowed to zoom in beyond a full "contain" fit before we
  // stop and let the dark stage background show at the edges instead of
  // cropping further into the photo. 1 = never crop (pure contain),
  // higher = allow more crop to fill more of the screen. Kept modest so
  // ultra-wide screens don't chop the sides off the shot.
  const MAX_ZOOM_BEYOND_CONTAIN = 1.18;

  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }

    // Capped cover: scale up to fill the stage, but never crop further
    // than MAX_ZOOM_BEYOND_CONTAIN beyond a full "contain" fit. Any
    // leftover space is left transparent, showing the dark stage
    // background behind the canvas instead of an aggressive crop.
    const containScale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const coverScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const scale = Math.min(coverScale, containScale * MAX_ZOOM_BEYOND_CONTAIN);

    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offsetX = (canvas.width - drawW) / 2;
    const offsetY = (canvas.height - drawH) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }

  let currentFrame = 0;
  for (let i = 1; i <= frameCount; i++) {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      if (!firstFrameReady && i === 1) {
        firstFrameReady = true;
        drawFrame(0);
      } else if (currentFrame === i - 1) {
        drawFrame(currentFrame);
      }
    };
    img.src = frameUrl(i);
    images[i - 1] = img;
  }

  function nearestLoadedFrame(target) {
    if (images[target] && images[target].complete && images[target].naturalWidth) return target;
    for (let d = 1; d < frameCount; d++) {
      const back = target - d, fwd = target + d;
      if (back >= 0 && images[back] && images[back].complete && images[back].naturalWidth) return back;
      if (fwd < frameCount && images[fwd] && images[fwd].complete && images[fwd].naturalWidth) return fwd;
    }
    return target;
  }

  function updateTextStep(progress) {
    let step = Math.min(totalSteps, Math.floor(progress * totalSteps) + 1);
    if (progress >= 0.999) step = totalSteps;
    if (progress <= 0.001) step = 1;

    textLayers.forEach((layer) => {
      layer.classList.toggle('active', parseInt(layer.dataset.step, 10) === step);
    });
    dots.forEach((dot) => {
      dot.classList.toggle('active', parseInt(dot.dataset.target, 10) === step);
    });
  }

  let ticking = false;

  function onScrollFrame() {
    ticking = false;

    const rect = track.getBoundingClientRect();
    const trackHeight = track.offsetHeight;
    const viewportH = window.innerHeight;
    const scrollableDistance = trackHeight - viewportH;

    // How far we've scrolled into the pinned track, 0 -> 1
    const scrolledIntoTrack = -rect.top;
    let progress = scrollableDistance > 0 ? scrolledIntoTrack / scrollableDistance : 0;
    progress = Math.max(0, Math.min(1, progress));

    const targetFrame = Math.round(progress * (frameCount - 1));
    currentFrame = targetFrame;
    drawFrame(nearestLoadedFrame(targetFrame));

    updateTextStep(progress);

    if (progressBar) progressBar.style.width = `${progress * 100}%`;
    if (scrollHint) scrollHint.classList.toggle('is-hidden', progress > 0.02);
  }

  function requestTick() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick);

  // Initial paint once the layout has settled.
  requestAnimationFrame(() => requestAnimationFrame(onScrollFrame));

  // Clicking a dot jumps the page scroll to that step's position in the track.
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const step = parseInt(dot.dataset.target, 10);
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const scrollableDistance = track.offsetHeight - window.innerHeight;
      const targetProgress = (step - 1) / (totalSteps - 1 || 1);
      window.scrollTo({ top: trackTop + targetProgress * scrollableDistance, behavior: 'smooth' });
    });
  });
});