// Hero v3: the city tour loop (starts after the poster paints) + floating cards following the pointer.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hero = document.querySelector(".hero");
  const tour = document.querySelector("video.tour");
  const where = document.querySelector("[data-where]");
  // Places the camera passes, as fractions of the 24 s loop (EnvShots TourKeys).
  const STOPS = [[0, "Central Plaza"], [0.2, "Clock Tower"], [0.33, "City Hall"], [0.47, "The Fountain"], [0.58, "The Avenue"], [0.72, "Downtown"]];

  if (tour && !reduce) {
    const conn = navigator.connection;
    const saveData = conn && (conn.saveData || /(^|-)2g/.test(conn.effectiveType || ""));
    if (!saveData) {
      const start = () => {
        tour.src = innerWidth * (devicePixelRatio || 1) > 1500 ? tour.dataset.srcLarge : tour.dataset.srcSmall;
        tour.play().catch(() => {});
      };
      if (document.readyState === "complete") setTimeout(start, 250); else addEventListener("load", () => setTimeout(start, 250));
      tour.addEventListener("playing", () => tour.classList.add("playing"));
      let last = "";
      tour.addEventListener("timeupdate", () => {
        if (!where || !tour.duration) return;
        const f = tour.currentTime / tour.duration;
        let name = STOPS[0][1];
        for (const [at, n] of STOPS) if (f >= at) name = n;
        if (name === last) return;
        last = name;
        where.classList.add("swap");
        setTimeout(() => { where.textContent = name; where.classList.remove("swap"); }, 260);
      });
      new IntersectionObserver(([e]) => { if (!tour.src) return; e.isIntersecting ? tour.play().catch(() => {}) : tour.pause(); }).observe(tour);
    }
  }
  if (fine && !reduce && hero) {
    hero.addEventListener("pointermove", (e) => {
      root.style.setProperty("--mx", ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty("--my", ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
    });
  }
})();
