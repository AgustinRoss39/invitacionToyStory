const config = window.INVITATION_CONFIG || {};
const invitation = config.invitation || {};
const characters = config.characters || [];

const $ = (selector) => document.querySelector(selector);
const loader = $("#loader");
const enterButton = $("#enter-button");
const audio = $("#audio");
const musicToggle = $("#music-toggle");
const characterImage = $("#character-image");
const countdown = $("#countdown");
const countdownStatus = $("#countdown-status");

let characterIndex = 0;
let characterInterval = null;
let countdownInterval = null;
let hasEntered = false;

function setText(selector, value) {
  const element = $(selector);
  if (element && value !== undefined && value !== null) {
    element.textContent = value;
  }
}

function populateInvitation() {
  document.title = `Invitación de ${invitation.name || "cumpleaños"}`;

  setText("#loader-title", invitation.name);
  setText("#guest-name", (invitation.name || "").toUpperCase());
  setText("#age-label", invitation.age ? `CUMPLE ${invitation.age} AÑOS` : "");
  setText("#invitation-message", invitation.message);
  setText("#event-date", invitation.dateLabel);
  setText("#event-time", invitation.timeLabel);
  setText("#event-venue", invitation.venue);
  setText("#event-address", invitation.address);

  const portrait = $("#portrait");
  if (portrait) {
    portrait.src = invitation.portraitUrl || "";
    portrait.alt = invitation.name ? `Foto de ${invitation.name}` : "Foto del cumpleañero";
  }

  const ribbon = $("#ribbon");
  if (ribbon) {
    ribbon.src = invitation.ribbonUrl || "";
  }

  if (audio && invitation.audioUrl) {
    audio.src = invitation.audioUrl;
  }

  const mapButton = $("#map-button");
  if (mapButton && invitation.mapUrl) {
    mapButton.href = invitation.mapUrl;
  }

  const whatsappButton = $("#whatsapp-button");
  if (whatsappButton && invitation.whatsappNumber) {
    whatsappButton.href = `https://wa.me/${invitation.whatsappNumber}?text=${encodeURIComponent(invitation.whatsappMessage || "")}`;
  }

  const instagramLink = $("#instagram-link");
  if (instagramLink) {
    if (invitation.instagramUrl) instagramLink.href = invitation.instagramUrl;
    if (invitation.instagramHandle) instagramLink.textContent = invitation.instagramHandle;
  }
}

function showCharacter(index) {
  if (!characterImage || !characters.length) return;

  const character = characters[index];
  characterImage.classList.remove("is-visible");

  window.setTimeout(() => {
    characterImage.src = character.src;
    characterImage.style.width = character.width;
    characterImage.style.top = character.top;
    characterImage.style.transform = `translate3d(${character.translateX}, 18px, 0) scale(1.025)`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        characterImage.style.transform = `translate3d(${character.translateX}, 0, 0) scale(1)`;
        characterImage.classList.add("is-visible");
      });
    });
  }, 330);
}

function startCharacters() {
  if (!characters.length) return;

  showCharacter(characterIndex);

  if (characters.length > 1) {
    characterInterval = window.setInterval(() => {
      characterIndex = (characterIndex + 1) % characters.length;
      showCharacter(characterIndex);
    }, 5800);
  }
}

async function startAudio() {
  if (!audio) return;

  try {
    await audio.play();
  } catch (error) {
    // Algunos navegadores pueden requerir otra interacción.
  }

  updateMusicButton();
}

function updateMusicButton() {
  if (!audio || !musicToggle) return;

  const playing = !audio.paused;
  musicToggle.classList.toggle("is-playing", playing);
  musicToggle.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
  musicToggle.innerHTML = `<span class="music-toggle__icon" aria-hidden="true">${playing ? "♪" : "♫"}</span>`;
}

function enterInvitation() {
  if (hasEntered) return;

  hasEntered = true;
  document.body.classList.remove("is-locked");
  loader?.classList.add("is-leaving");

  if (musicToggle) {
    musicToggle.hidden = false;
  }

  startAudio();

  window.setTimeout(() => {
    if (loader?.isConnected) loader.remove();
  }, 500);
}

function toggleAudio() {
  if (!audio) return;

  if (audio.paused) {
    startAudio();
  } else {
    audio.pause();
    updateMusicButton();
  }
}

function setupRevealAnimations() {
  const elements = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.13,
    rootMargin: "0px 0px -4% 0px"
  });

  elements.forEach((element) => observer.observe(element));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function setCountdownValues(days, hours, minutes, seconds) {
  setText("#countdown-days", pad(days));
  setText("#countdown-hours", pad(hours));
  setText("#countdown-minutes", pad(minutes));
  setText("#countdown-seconds", pad(seconds));
}

function finishCountdown(message, status = "") {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  if (countdown) {
    countdown.classList.add("is-finished");
    countdown.innerHTML = `<p class="countdown__finished-message">${message}</p>`;
  }

  if (countdownStatus) {
    countdownStatus.textContent = status;
  }
}

function updateCountdown() {
  if (!countdown || !countdownStatus) return;

  const start = new Date(invitation.eventDateTime).getTime();
  const end = new Date(invitation.eventEndDateTime).getTime();
  const now = Date.now();

  if (Number.isNaN(start) || Number.isNaN(end)) {
    countdownStatus.textContent = "Revisá la fecha configurada en js/config.js.";
    return;
  }

  if (now >= end) {
    finishCountdown("¡Gracias por sumarte a esta aventura! ⭐");
    return;
  }

  if (now >= start) {
    finishCountdown("¡Hoy comienza la misión! 🚀", "¡La aventura ya empezó!");
    return;
  }

  const totalSeconds = Math.max(0, Math.floor((start - now) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  setCountdownValues(days, hours, minutes, seconds);

  if (days === 0) {
    countdownStatus.textContent = "¡Ya falta menos de un día!";
  } else if (days === 1) {
    countdownStatus.textContent = "¡Falta solo 1 día!";
  } else {
    countdownStatus.textContent = `Faltan ${days} días para la aventura.`;
  }
}

function startCountdown() {
  updateCountdown();

  if (!countdownInterval && !countdown?.classList.contains("is-finished")) {
    countdownInterval = window.setInterval(updateCountdown, 1000);
  }
}

function setupVisibilityAudio() {
  document.addEventListener("visibilitychange", () => {
    if (!hasEntered || !document.hidden || !audio) return;

    audio.pause();
    updateMusicButton();
  });
}

function init() {
  document.body.classList.add("is-locked");
  populateInvitation();
  startCharacters();
  startCountdown();
  setupRevealAnimations();
  setupVisibilityAudio();

  enterButton?.addEventListener("click", enterInvitation);
  musicToggle?.addEventListener("click", toggleAudio);
  audio?.addEventListener("play", updateMusicButton);
  audio?.addEventListener("pause", updateMusicButton);
}

document.addEventListener("DOMContentLoaded", init);