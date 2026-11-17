// Basic anti-inspect deterrent for browser UI only.
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("keydown", (event) => {
  if (
    (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "i") ||
    (event.ctrlKey && event.key.toLowerCase() === "u") ||
    (event.ctrlKey && event.key.toLowerCase() === "s") ||
    (event.metaKey && event.altKey && event.key.toLowerCase() === "i")
  ) {
    event.preventDefault();
  }
});

const toggle = document.getElementById("menuToggle");
const links = document.getElementById("navLinks");

// Open / close mobile menu
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
  toggle.textContent = open ? "✕" : "☰";
});

// Close mobile menu after clicking a link
links.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
    toggle.textContent = "☰";
  }),
);

const attractionButtons = document.querySelectorAll(".dropdown-link");
const attractionPanels = document.querySelectorAll(".panel");
const panelIds = Array.from(attractionPanels).map((panel) => panel.id);

function showAttraction(targetId) {
  attractionButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.target === targetId);
  });

  attractionPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });
}

attractionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showAttraction(button.dataset.target);
  });
});

document.querySelectorAll(".arrow-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const currentVisible = document.querySelector(".panel.active");
    const currentIndex = panelIds.indexOf(currentVisible.id);
    const direction = button.dataset.direction === "next" ? 1 : -1;
    const nextIndex =
      (currentIndex + direction + panelIds.length) % panelIds.length;
    showAttraction(panelIds[nextIndex]);
  });
});

let activeRestaurantCarousel = null;
let activeRestaurantSlideController = null;
let activeRestaurantPauseController = null;
const restaurantLightbox = document.querySelector(".restaurant-lightbox");
const lightboxImage = restaurantLightbox.querySelector(".lightbox-image");
const lightboxCaption = restaurantLightbox.querySelector(".lightbox-caption");
const lightboxCount = restaurantLightbox.querySelector(".lightbox-count");
const lightboxClose = restaurantLightbox.querySelector(".lightbox-close");

lightboxClose.addEventListener("click", () => restaurantLightbox.close());
restaurantLightbox.querySelectorAll(".lightbox-arrow").forEach((button) => {
  button.addEventListener("click", () => {
    if (!activeRestaurantSlideController) return;
    const direction = button.classList.contains("lightbox-next") ? 1 : -1;
    activeRestaurantSlideController(direction);
  });
});

restaurantLightbox.addEventListener("close", () => {
  if (activeRestaurantPauseController) {
    activeRestaurantPauseController(false);
  }
  activeRestaurantCarousel = null;
  activeRestaurantSlideController = null;
  activeRestaurantPauseController = null;
});
restaurantLightbox.addEventListener("click", (event) => {
  if (event.target === restaurantLightbox) restaurantLightbox.close();
});

let swipeStartX = null;
restaurantLightbox.querySelector(".lightbox-figure").addEventListener(
  "touchstart",
  (event) => {
    swipeStartX = event.changedTouches[0].clientX;
  },
  { passive: true },
);
restaurantLightbox.querySelector(".lightbox-figure").addEventListener(
  "touchend",
  (event) => {
    if (swipeStartX === null || !activeRestaurantSlideController) return;
    const swipeDistance = event.changedTouches[0].clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(swipeDistance) < 45) return;
    activeRestaurantSlideController(swipeDistance < 0 ? 1 : -1);
  },
  { passive: true },
);

document.addEventListener("keydown", (event) => {
  if (!restaurantLightbox.open || !activeRestaurantSlideController) return;
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  activeRestaurantSlideController(event.key === "ArrowRight" ? 1 : -1);
});

document.querySelectorAll(".feature-carousel").forEach((carousel) => {
  const isRestaurantCarousel = carousel.classList.contains(
    "feature-carousel--restaurant",
  );
  const slidesElement = carousel.querySelector(".feature-carousel-slides");
  const slides = Array.from(slidesElement.children);
  const thumbnailsElement = carousel.querySelector(
    ".feature-carousel-thumbnails",
  );
  const currentElement = carousel.querySelector(".feature-carousel-current");
  const totalElement = carousel.querySelector(".feature-carousel-total");
  const progressBar = carousel.querySelector(".feature-carousel-progress-bar");
  const lightboxArrows = restaurantLightbox.querySelectorAll(".lightbox-arrow");
  const duration = 5000;
  let currentIndex = 0;
  let timer = null;
  let paused = false;
  let touchStartX = null;

  totalElement.textContent = String(slides.length).padStart(2, "0");
  thumbnailsElement.style.setProperty(
    "--feature-slide-count",
    slides.length,
  );

  const thumbnails = slides.map((slide, index) => {
    const image = slide.querySelector("img");
    const title = slide.querySelector(".feature-carousel-title");
    const button = document.createElement("button");
    const thumbnailImage = document.createElement("img");

    button.className = "feature-carousel-thumbnail";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Show ${title.textContent.trim()}`,
    );
    button.setAttribute("aria-pressed", "false");
    thumbnailImage.src = image.getAttribute("src");
    thumbnailImage.alt = "";
    thumbnailImage.loading = "lazy";
    button.append(thumbnailImage);
    button.addEventListener("click", () => showSlide(index));
    thumbnailsElement.append(button);
    return button;
  });

  function updateLightbox() {
    if (activeRestaurantCarousel !== carousel) return;
    const slide = slides[currentIndex];
    const image = slide.querySelector("img");
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = slide
      .querySelector(".feature-carousel-title")
      .textContent.trim();
    lightboxCount.textContent = `${currentIndex + 1} / ${slides.length}`;
  }

  function restartProgress() {
    window.clearTimeout(timer);
    progressBar.classList.remove("running", "paused");
    void progressBar.offsetWidth;
    progressBar.style.setProperty(
      "--feature-carousel-duration",
      `${duration}ms`,
    );
    progressBar.classList.add("running");
    if (paused) {
      progressBar.classList.add("paused");
    } else {
      timer = window.setTimeout(
        () => showSlide(currentIndex + 1),
        duration,
      );
    }
  }

  function showSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    slidesElement.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((slide, slideIndex) => {
      slide.setAttribute(
        "aria-label",
        `${slideIndex + 1} of ${slides.length}`,
      );
      slide.setAttribute(
        "aria-hidden",
        slideIndex === currentIndex ? "false" : "true",
      );
      if (isRestaurantCarousel) {
        const image = slide.querySelector("img");
        image.tabIndex = slideIndex === currentIndex ? 0 : -1;
        if (slideIndex === currentIndex) image.loading = "eager";
      }
    });
    thumbnails.forEach((thumbnail, thumbnailIndex) => {
      thumbnail.classList.toggle("active", thumbnailIndex === currentIndex);
      thumbnail.setAttribute(
        "aria-pressed",
        thumbnailIndex === currentIndex ? "true" : "false",
      );
    });
    currentElement.textContent = String(currentIndex + 1).padStart(2, "0");
    restartProgress();
    updateLightbox();
  }

  function setPaused(shouldPause) {
    if (paused === shouldPause) return;
    paused = shouldPause;
    if (paused) {
      window.clearTimeout(timer);
      progressBar.classList.add("paused");
    } else {
      restartProgress();
    }
  }

  if (isRestaurantCarousel) {
    slides.forEach((slide, index) => {
      const image = slide.querySelector("img");
      image.setAttribute("role", "button");
      image.setAttribute(
        "aria-label",
        `Open photo ${index + 1} of ${slides.length} in larger view`,
      );

      function openPhoto() {
        activeRestaurantCarousel = carousel;
        activeRestaurantSlideController = (direction) =>
          showSlide(currentIndex + direction);
        activeRestaurantPauseController = setPaused;
        lightboxArrows.forEach((button) => {
          button.hidden = slides.length < 2;
        });
        showSlide(index);
        restaurantLightbox.showModal();
        lightboxClose.focus();
      }

      image.addEventListener("click", openPhoto);
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPhoto();
        }
      });
    });
  }

  carousel.addEventListener("mouseenter", () => setPaused(true));
  carousel.addEventListener("mouseleave", () => {
    setPaused(carousel.contains(document.activeElement));
  });
  carousel.addEventListener("focusin", () => setPaused(true));
  carousel.addEventListener("focusout", (event) => {
    if (
      !carousel.contains(event.relatedTarget) &&
      !carousel.matches(":hover") &&
      !(restaurantLightbox.open && activeRestaurantCarousel === carousel)
    ) {
      setPaused(false);
    }
  });
  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showSlide(currentIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  const stage = carousel.querySelector(".feature-carousel-stage");
  stage.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true },
  );
  stage.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 50) {
        showSlide(currentIndex + (distance < 0 ? 1 : -1));
      }
    },
    { passive: true },
  );

  document.addEventListener("visibilitychange", () => {
    setPaused(
      document.hidden ||
        carousel.matches(":hover") ||
        carousel.contains(document.activeElement),
    );
  });

  showSlide(0);
});

document.querySelectorAll(".promotion-deck-carousel").forEach((carousel) => {
  const viewport = carousel.querySelector(".promotion-deck-viewport");
  const cards = Array.from(
    carousel.querySelectorAll(".promotion-deck-card"),
  );
  const dotsElement = carousel.querySelector(".promotion-deck-dots");
  const currentElement = carousel.querySelector(".promotion-deck-current");
  const totalElement = carousel.querySelector(".promotion-deck-total");
  const gapRatio = 0.82;
  let currentIndex = 0;
  let touchStartX = null;

  totalElement.textContent = String(cards.length).padStart(2, "0");

  const dots = cards.map((card, index) => {
    const info = card.querySelector(".promotion-deck-info");
    const imageAlt = card.querySelector("img").alt;
    const label = info.textContent.trim()
      ? info.textContent.trim().replace(/\s+/g, " ")
      : imageAlt;
    const dot = document.createElement("button");

    if (!info.textContent.trim()) info.hidden = true;
    dot.className = "promotion-deck-dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Show ${label} (${index + 1} of ${cards.length})`);
    dot.setAttribute("aria-selected", "false");
    dot.tabIndex = -1;
    dot.addEventListener("click", () => goTo(index));
    dotsElement.append(dot);
    return dot;
  });

  function render() {
    const cardWidth = cards[0].offsetWidth || (viewport.clientHeight * 2) / 3;
    const step = cardWidth * gapRatio;
    const halfLength = cards.length / 2;

    cards.forEach((card, index) => {
      let offset = index - currentIndex;
      if (offset > halfLength) offset -= cards.length;
      if (offset < -halfLength) offset += cards.length;
      const distance = Math.abs(offset);
      const isActive = index === currentIndex;
      const scale = isActive ? 1 : 0.78;
      const opacity = distance > 1 ? 0 : isActive ? 1 : 0.45;

      card.classList.toggle("is-active", isActive);
      card.style.transform = `translateX(calc(-50% + ${
        offset * step
      }px)) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = String(10 - distance);
      card.setAttribute("aria-label", `${index + 1} of ${cards.length}`);
      card.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    dots.forEach((dot, index) => {
      const isActive = index === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", isActive ? "true" : "false");
      dot.tabIndex = isActive ? 0 : -1;
    });
    currentElement.textContent = String(currentIndex + 1).padStart(2, "0");
  }

  function goTo(index) {
    currentIndex = (index + cards.length) % cards.length;
    render();
  }

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (index !== currentIndex) goTo(index);
    });
  });

  carousel.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextIndex = currentIndex + (event.key === "ArrowRight" ? 1 : -1);
    goTo(nextIndex);
    if (event.target.closest(".promotion-deck-dot")) {
      dots[currentIndex].focus();
    }
  });
  viewport.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].screenX;
    },
    { passive: true },
  );
  viewport.addEventListener(
    "touchend",
    (event) => {
      if (touchStartX === null) return;
      const distance = event.changedTouches[0].screenX - touchStartX;
      touchStartX = null;
      if (Math.abs(distance) > 50) {
        goTo(currentIndex + (distance < 0 ? 1 : -1));
      }
    },
    { passive: true },
  );

  window.addEventListener("resize", render);
  render();
});

// Highlight the link of the section you are viewing
const sections = document.querySelectorAll("main section[id], footer[id]");
const navAnchors = links.querySelectorAll(":scope > li > a");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) =>
          a.classList.toggle(
            "active",
            a.getAttribute("href") === "#" + entry.target.id,
          ),
        );
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
sections.forEach((s) => observer.observe(s));
