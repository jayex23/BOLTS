// Basic anti-inspect deterrent for browser UI only.
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', event => {
  if ((event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') ||
      (event.ctrlKey && event.key.toLowerCase() === 'u') ||
      (event.ctrlKey && event.key.toLowerCase() === 's') ||
      (event.metaKey && event.altKey && event.key.toLowerCase() === 'i')) {
    event.preventDefault();
  }
});

const toggle = document.getElementById('menuToggle');
const links = document.getElementById('navLinks');

// Open / close mobile menu
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.textContent = open ? '✕' : '☰';
});

// Close mobile menu after clicking a link
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', false);
  toggle.textContent = '☰';
})); 

const attractionButtons = document.querySelectorAll('.dropdown-link');
const attractionPanels = document.querySelectorAll('.panel');
const panelIds = Array.from(attractionPanels).map(panel => panel.id);

function showAttraction(targetId) {
  attractionButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });

  attractionPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === targetId);
  });
}

attractionButtons.forEach(button => {
  button.addEventListener('click', () => {
    showAttraction(button.dataset.target);
  });
});

document.querySelectorAll('.arrow-btn').forEach(button => {
  button.addEventListener('click', () => {
    const currentVisible = document.querySelector('.panel.active');
    const currentIndex = panelIds.indexOf(currentVisible.id);
    const direction = button.dataset.direction === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + direction + panelIds.length) % panelIds.length;
    showAttraction(panelIds[nextIndex]);
  });
});

// Independent restaurant and promotion photo carousels
document.querySelectorAll('.photo-carousel').forEach(carousel => {
  const slides = Array.from(carousel.querySelectorAll('.restaurant-slide'));
  const count = carousel.querySelector('.restaurant-slide-count');
  let currentIndex = 0;

  const lightbox = document.querySelector('.restaurant-lightbox');
  const lightboxImage = lightbox.querySelector('.lightbox-image');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxCount = lightbox.querySelector('.lightbox-count');

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === currentIndex);
    });
    count.textContent = `${currentIndex + 1} / ${slides.length}`;

    if (activeRestaurantCarousel === carousel) {
      const image = slides[currentIndex].querySelector('img');
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightboxCaption.textContent = slides[currentIndex].querySelector('figcaption').textContent;
      lightboxCount.textContent = `${currentIndex + 1} / ${slides.length}`;
    }
  }

  carousel.querySelectorAll('.restaurant-arrow').forEach(button => {
    button.addEventListener('click', () => {
      const direction = button.dataset.direction === 'next' ? 1 : -1;
      showSlide(currentIndex + direction);
    });
  });

  slides.forEach((slide, index) => {
    const image = slide.querySelector('img');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Open photo ${index + 1} of ${slides.length} in larger view`);

    function openPhoto() {
      currentIndex = index;
      activeRestaurantCarousel = carousel;
      showSlide(currentIndex);
      lightbox.showModal();
      lightbox.querySelector('.lightbox-close').focus();
    }

    image.addEventListener('click', openPhoto);
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPhoto();
      }
    });
  });
});

let activeRestaurantCarousel = null;
const restaurantLightbox = document.querySelector('.restaurant-lightbox');
const lightboxClose = restaurantLightbox.querySelector('.lightbox-close');

lightboxClose.addEventListener('click', () => restaurantLightbox.close());
restaurantLightbox.querySelectorAll('.lightbox-arrow').forEach(button => {
  button.addEventListener('click', () => {
    if (!activeRestaurantCarousel) return;
    const carousel = activeRestaurantCarousel;
    const direction = button.classList.contains('lightbox-next') ? 'next' : 'prev';
    carousel.querySelector(`.restaurant-arrow[data-direction="${direction}"]`).click();
  });
});

restaurantLightbox.addEventListener('click', event => {
  if (event.target === restaurantLightbox) restaurantLightbox.close();
});

let swipeStartX = null;
restaurantLightbox.querySelector('.lightbox-figure').addEventListener('touchstart', event => {
  swipeStartX = event.changedTouches[0].clientX;
}, { passive: true });
restaurantLightbox.querySelector('.lightbox-figure').addEventListener('touchend', event => {
  if (swipeStartX === null || !activeRestaurantCarousel) return;
  const swipeDistance = event.changedTouches[0].clientX - swipeStartX;
  swipeStartX = null;
  if (Math.abs(swipeDistance) < 45) return;
  const direction = swipeDistance < 0 ? 'next' : 'prev';
  activeRestaurantCarousel.querySelector(`.restaurant-arrow[data-direction="${direction}"]`).click();
}, { passive: true });

document.addEventListener('keydown', event => {
  if (!restaurantLightbox.open || !activeRestaurantCarousel) return;
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const direction = event.key === 'ArrowRight' ? 'next' : 'prev';
  activeRestaurantCarousel.querySelector(`.restaurant-arrow[data-direction="${direction}"]`).click();
});

// Highlight the link of the section you are viewing
const sections = document.querySelectorAll('main section[id], footer[id]');
const navAnchors = links.querySelectorAll(':scope > li > a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => observer.observe(s));
