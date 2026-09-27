// GSAP + ScrollTrigger narrative for the marketing landing.
// Loaded client-only after idle (dynamic import from page.tsx). Everything
// animates transform/opacity only; prefers-reduced-motion gets the static
// equivalent (module becomes a no-op).
type Cleanup = () => void;

export async function initLandingMotion(root: HTMLElement): Promise<Cleanup> {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);
  gsap.registerPlugin(ScrollTrigger);

  const ctx = gsap.context(() => {
    // 1) Gentle rise-in for section headers and narrative copy.
    gsap.utils.toArray<HTMLElement>('[data-motion="reveal"]').forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 34 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        },
      );
    });

    // 2) Invitation worlds — each world carries its own motion signature,
    //    scrubbed so the feeling is tied to the reader's own scroll.
    const worlds = gsap.utils.toArray<HTMLElement>(".atelier-world");
    worlds.forEach((world, index) => {
      const art = world.querySelector<HTMLElement>(".atelier-world-art");
      const copy = world.querySelector<HTMLElement>(".atelier-world-copy");
      if (art) {
        const drift = index === 0 ? { y: -46 } : index === 1 ? { x: -52 } : { scale: 1.06 };
        gsap.fromTo(
          art,
          { autoAlpha: 0.35, ...drift },
          {
            autoAlpha: 1,
            y: 0,
            x: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: world, start: "top 88%", end: "center 46%", scrub: 0.6 },
          },
        );
      }
      if (copy) {
        gsap.fromTo(
          copy,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            ease: "none",
            scrollTrigger: { trigger: world, start: "top 80%", end: "center 52%", scrub: 0.6 },
          },
        );
      }
    });

    // 3) Template gallery — cards ride the scroll at a measured pace.
    const grid = document.querySelector(".atlas-template-grid");
    if (grid) {
      gsap.fromTo(
        grid.querySelectorAll(".atlas-template"),
        { autoAlpha: 0, y: 42 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: grid, start: "top 85%", once: true },
        },
      );
    }
  }, root);

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };
}
