document.addEventListener("DOMContentLoaded", () => {
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (navToggle && navLinks) {
        navToggle.setAttribute("aria-expanded", "false");

        navToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            navToggle.classList.toggle("active", isOpen);
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                navToggle.classList.remove("active");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    const yearEl = document.querySelector("[data-year]");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Touchline scroll progress — vanilla, shared across every page.
    // (No GSAP dependency, so the bar fills even where index-animations.js
    // isn't loaded.)
    const touchlineFill = document.querySelector("[data-touchline]");
    if (touchlineFill) {
        let ticking = false;
        const updateTouchline = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
            touchlineFill.style.transform = "scaleX(" + p + ")";
            ticking = false;
        };
        window.addEventListener("scroll", () => {
            if (!ticking) { ticking = true; requestAnimationFrame(updateTouchline); }
        }, { passive: true });
        window.addEventListener("resize", updateTouchline);
        updateTouchline();
    }

    const scrollBtn = document.querySelector("[data-scroll-to-top]");
    if (scrollBtn) {
        const toggle = () =>
            scrollBtn.classList.toggle("scroll-to-top--visible", window.scrollY > 300);
        window.addEventListener("scroll", toggle, { passive: true });
        scrollBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    const reveals = document.querySelectorAll(".reveal");
    if (reveals.length && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("reveal--visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );

        reveals.forEach((el) => observer.observe(el));
    }
});
