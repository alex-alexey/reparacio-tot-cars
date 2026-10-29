(() => {
  document.documentElement.classList.add("js");
  const config = window.TOT_CARS_CONFIG || {};
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector("#main-nav");

  function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Abrir menú");
    menu.classList.remove("is-open");
  }

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    menu.classList.toggle("is-open", open);
  });

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const hero = document.querySelector(".hero");
  if (header && hero && "IntersectionObserver" in window) {
    const headerObserver = new IntersectionObserver(([entry]) => {
      header.classList.toggle("is-solid", !entry.isIntersecting);
    }, { threshold: 0.04 });
    headerObserver.observe(hero);
  }

  const revealItems = document.querySelectorAll(".reveal");
  const journey = document.querySelector(".journey");
  const journeySteps = [...document.querySelectorAll(".journey-step")];
  const journeyProgressLine = document.querySelector(".journey-route-progress");
  let journeyFrame = 0;

  function updateJourneyProgress() {
    journeyFrame = 0;
    if (!journey || !journeySteps.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      journeySteps.forEach((step) => {
        step.classList.remove("is-active", "is-complete");
        step.removeAttribute("aria-current");
      });
      return;
    }

    const bounds = journey.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollRange = Math.max(1, bounds.height - viewportHeight);
    const progress = Math.min(1, Math.max(0, -bounds.top / scrollRange));

    if (journeyProgressLine) journeyProgressLine.style.strokeDashoffset = String(100 * (1 - progress));

    const hasEntered = bounds.top <= 0;
    const activeIndex = Math.min(journeySteps.length - 1, Math.floor(progress * journeySteps.length));
    journeySteps.forEach((step, index) => {
      const complete = hasEntered && index < activeIndex;
      const active = hasEntered && index === activeIndex;
      step.classList.toggle("is-complete", complete);
      step.classList.toggle("is-active", active);
      if (active) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
  }

  function scheduleJourneyProgress() {
    if (journeyFrame) return;
    journeyFrame = window.requestAnimationFrame(updateJourneyProgress);
  }

  if (journey) {
    window.addEventListener("scroll", scheduleJourneyProgress, { passive: true });
    window.addEventListener("resize", scheduleJourneyProgress);
    scheduleJourneyProgress();
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.13, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
    if (journey) revealObserver.observe(journey);
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    document.querySelector(".journey")?.classList.add("is-visible");
  }

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canTilt) {
    document.querySelectorAll("[data-tilt]").forEach((surface) => {
      surface.addEventListener("pointermove", (event) => {
        const bounds = surface.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        surface.style.setProperty("--tilt-x", `${(y * -7).toFixed(2)}deg`);
        surface.style.setProperty("--tilt-y", `${(x * 9).toFixed(2)}deg`);
      });
      surface.addEventListener("pointerleave", () => {
        surface.style.setProperty("--tilt-x", "0deg");
        surface.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  const phone = String(config.phone || "").trim();
  const phoneLink = document.querySelector("[data-phone-link]");
  if (phone && phoneLink) {
    phoneLink.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
    phoneLink.textContent = phone;
    phoneLink.hidden = false;
  }

  const location = String(config.location || "").trim();
  const locationNode = document.querySelector("[data-location]");
  if (location && locationNode) {
    locationNode.textContent = location;
    locationNode.hidden = false;
  }

  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
  const note = document.querySelector(".form-note");
  const pieceSelect = form?.querySelector('[name="pieza"]');

  const componentChoices = [...document.querySelectorAll("[data-component-choice]")];
  const workbench = document.querySelector(".workbench-output");
  const workbenchImage = document.querySelector("[data-component-image]");
  const workbenchTitle = document.querySelector("[data-component-title]");
  const workbenchDescription = document.querySelector("[data-component-description]");
  const workbenchAction = document.querySelector(".workbench-action");
  let componentSwapTimer;

  componentChoices.forEach((choice) => {
    choice.disabled = false;
    choice.addEventListener("click", () => {
      if (choice.getAttribute("aria-pressed") === "true") return;

      componentChoices.forEach((option) => {
        const selected = option === choice;
        option.setAttribute("aria-pressed", String(selected));
        option.classList.toggle("is-selected", selected);
      });

      workbench?.classList.add("is-switching");
      window.clearTimeout(componentSwapTimer);
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      componentSwapTimer = window.setTimeout(() => {
        if (workbenchImage) {
          workbenchImage.src = choice.dataset.image;
          workbenchImage.alt = choice.dataset.imageAlt;
        }
        if (workbenchTitle) workbenchTitle.textContent = choice.dataset.title;
        if (workbenchDescription) workbenchDescription.textContent = choice.dataset.description;
        if (workbenchAction) workbenchAction.dataset.selectPiece = choice.dataset.piece;
        requestAnimationFrame(() => workbench?.classList.remove("is-switching"));
      }, prefersReducedMotion ? 0 : 170);
    });
  });

  document.querySelectorAll("[data-select-piece]").forEach((link) => {
    link.addEventListener("click", () => {
      if (pieceSelect) pieceSelect.value = link.dataset.selectPiece;
    });
  });
  const whatsapp = String(config.whatsapp || "").replace(/\D/g, "");
  const email = String(config.email || "").trim();

  if (note) {
    if (whatsapp) note.textContent = "WhatsApp se abrirá con el mensaje preparado. Lo revisas y decides si lo envías.";
    else if (email) note.textContent = "Se abrirá un correo con la consulta preparada para que la revises antes de enviarla.";
    else note.textContent = "Configura el WhatsApp o el correo del taller en assets/config.js para activar las consultas.";
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const message = [
      `Hola, soy ${data.get("nombre")}.`,
      `Me gustaría consultar una reparación de: ${data.get("pieza")}.`,
      `Mi teléfono es ${data.get("telefono")}.`,
      data.get("provincia") ? `Provincia: ${data.get("provincia")}.` : "",
      data.get("mensaje") ? `Información adicional: ${data.get("mensaje")}` : ""
    ].filter(Boolean).join("\n");

    if (whatsapp) {
      const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      if (status) status.textContent = "WhatsApp se ha abierto con tu consulta. Revísala y envíala cuando quieras.";
      return;
    }

    if (email) {
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Consulta de reparación · Tot Cars")}&body=${encodeURIComponent(message)}`;
      if (status) status.textContent = "Se ha preparado tu correo. Revísalo antes de enviarlo.";
      return;
    }

    if (status) status.textContent = "El formulario está listo, pero aún falta configurar el teléfono o correo del taller en assets/config.js.";
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
