# Diego Silva — Portfolio

Personal portfolio site showcasing my projects, internship experience, and technical skills. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no bloat.

**Live:** [drsilva9583.github.io/portfolio](https://drsilva9583.github.io/portfolio/)

## Overview

| Page | Description |
|------|-------------|
| **Home** | Hero, featured projects, about, and skills |
| **Experience** | Internship experience (Roku, Intuit) and other work roles |
| **Education** | Academic background, leadership, certifications |
| **Contact** | Contact form via Formspree |

## Tech Stack

- **HTML5 / CSS3 / JavaScript** — semantic markup, custom properties, no preprocessors
- **Google Fonts** — Archivo (variable: width 62–125, weight 100–900)
- **GSAP + ScrollTrigger** — scroll-driven animation, kinetic type, count-ups (CDN)
- **Devicon** — tech stack icons
- **Formspree** — serverless form submissions
- **GitHub Pages** — hosting

## Project Structure

```
portfolio/
├── index.html                # Home — kinetic hero, selected work, about, toolkit
├── experience.html           # Internship & work experience (editorial rows)
├── education.html            # Academics, leadership, certifications
├── contact.html              # Split hero + contact form
├── scripts.js                # Shared — mobile nav, touchline, year, scroll-to-top
├── index-animations.js       # Home-only GSAP (hero canvas, nameplate, pitch ball)
├── page-animations.js        # Inner-page GSAP (reveals, count-ups, magnetic buttons)
├── styles/
│   ├── styles.css            # Global — tokens + shared "Pass Map" primitives, nav, footer
│   ├── index.css             # Home page
│   ├── experience.css        # Experience page
│   ├── education.css         # Education page
│   └── contact.css           # Contact page
├── DESIGN.md                 # Design system ("Pass Map")
├── PRODUCT.md                # Product / brand strategy
├── images/                   # Headshot, favicons, logos
└── README.md
```

## Local Development

```bash
git clone https://github.com/drsilva9583/portfolio.git
cd portfolio
python -m http.server 8000
```

Then open [localhost:8000](http://localhost:8000).

## Contact

- **Email:** [diegos9583@gmail.com](mailto:diegos9583@gmail.com)
- **LinkedIn:** [linkedin.com/in/diego-roman-silva](https://www.linkedin.com/in/diego-roman-silva/)
- **GitHub:** [github.com/drsilva9583](https://github.com/drsilva9583)

## License

MIT
