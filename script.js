const cameraFilm = document.querySelector("#cameraFilm");
const root = document.documentElement;
const revealItems = document.querySelectorAll(".reveal");
const tiltCards = document.querySelectorAll(".tilt-card");
const filmTriggers = document.querySelectorAll(".work-card, .founder-film");
const previewVideos = document.querySelectorAll(".work-card video, .founder-film video");
const modal = document.querySelector("#workModal");
const modalPanel = document.querySelector(".modal-panel");
const modalVideo = document.querySelector("#modalVideo");
const modalTitle = document.querySelector("#modalTitle");
const modalMeta = document.querySelector("#modalMeta");

let ticking = false;

function scrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable > 0 ? window.scrollY / scrollable : 0;
}

function updateScene() {
  ticking = false;
  const progress = scrollProgress();
  const scan = -35 + progress * 112;

  root.style.setProperty("--scan-y", `${scan}vh`);
}

function requestSceneUpdate() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateScene);
  }
}

function startBackgroundVideo() {
  if (!cameraFilm) return;

  cameraFilm.playbackRate = 1;
  const playPromise = cameraFilm.play();
  if (playPromise) {
    playPromise.catch(() => {
      cameraFilm.controls = false;
    });
  }
}

if (cameraFilm) {
  cameraFilm.addEventListener("loadedmetadata", updateScene);
  startBackgroundVideo();
}

window.addEventListener("scroll", requestSceneUpdate, { passive: true });
window.addEventListener("resize", requestSceneUpdate);
requestSceneUpdate();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => observer.observe(item));

previewVideos.forEach((video) => {
  const trigger = video.closest(".work-card, .founder-film");
  const previewTime = Number(trigger?.dataset.previewTime || 1);

  video.addEventListener(
    "loadedmetadata",
    () => {
      if (Number.isFinite(video.duration) && video.duration > 0.5) {
        video.currentTime = Math.min(previewTime, Math.max(0.1, video.duration - 0.2));
      }
    },
    { once: true }
  );

  video.addEventListener(
    "seeked",
    () => {
      video.pause();
      video.classList.add("has-preview");
    },
    { once: true }
  );
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${y * -7}deg`);
    card.style.setProperty("--tilt-y", `${x * 8}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

filmTriggers.forEach((card) => {
  card.addEventListener("click", () => {
    openModal(card.dataset.video, card.dataset.title, card.dataset.meta, card.dataset.format);
  });
});

function openModal(videoSrc, title, meta, format) {
  modalVideo.src = videoSrc;
  modalTitle.textContent = title;
  modalMeta.textContent = meta;
  modalPanel.classList.toggle("is-wide", format === "wide");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modalVideo.currentTime = 0;
  modalVideo.muted = false;
  modalVideo.play().catch(() => {});
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  modalVideo.pause();
  modalPanel.classList.remove("is-wide");
  modalVideo.removeAttribute("src");
  modalVideo.load();
}

modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close]")) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});
