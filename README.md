# Q: portfolio website

The portfolio site for Q. It has a gallery, one page per artwork, an About page, a
Contact page and three legal pages (Privacy, Cookies, Legal). It sells nothing itself: it links out
to Etsy for original works and to the print shop for prints.

It is built with [Astro](https://astro.build) and is designed to be hosted on
[Vercel](https://vercel.com). You do not need to know how to code to add works or fill in the
details: most changes mean editing a small text file and saving it.

**Contents**

1. [Before you start](#1-before-you-start)
2. [Seeing the site on your computer](#2-seeing-the-site-on-your-computer)
3. [Adding a work](#3-adding-a-work)
4. [Changing colours and fonts](#4-changing-colours-and-fonts)
5. [Filling in the placeholders](#5-filling-in-the-placeholders)
6. [The legal pages and the "Template" banner](#6-the-legal-pages-and-the-template-banner)
7. [Putting the site online with Vercel](#7-putting-the-site-online-with-vercel)
8. [Attaching your own domain later](#8-attaching-your-own-domain-later)
9. [Where things are](#9-where-things-are)

---

## 1. Before you start

You need two free programs:

- **Node.js**, version 22.12 or newer. Download the "LTS" version from
  [nodejs.org](https://nodejs.org) and install it.
- **A text editor.** [Visual Studio Code](https://code.visualstudio.com) works well.

Open the project folder in Visual Studio Code, then open a terminal inside it
(menu **Terminal → New Terminal**). The first time only, type this and press Enter:

```bash
npm install
```

This downloads the parts the site is built from. It creates a `node_modules` folder, which you can
ignore.

## 2. Seeing the site on your computer

```bash
npm run dev
```

Then open <http://localhost:4321> in your browser. While this runs, the page updates every time you
save a file. Press `Ctrl + C` in the terminal to stop it. Pages are prepared on request in this
mode, so moving between them is slower than online: judge the smoothness with `npm run preview`
(below) or on the live site.

Before putting changes online, check that everything builds:

```bash
npm run build
```

If something is wrong (a missing image, a typing mistake in a work's details), the build stops and
names the file to fix. `npm run preview` then shows the finished site exactly as it will be online.

## 3. Adding a work

Each work lives in its own folder inside `src/content/works/`.

1. **Create a folder** in `src/content/works/`. Its name becomes the web address of the work, so use
   lower-case letters, numbers and hyphens, for example `src/content/works/example-title/` becomes
   `/works/example-title/`.
2. **Put one image in the folder.** JPG, PNG, WebP, AVIF or TIFF, with any file name. Exactly one
   image per folder. Use your full-resolution file (ideally at least 2,400 pixels on the longest
   side, in the sRGB colour profile): the site makes the smaller versions itself and never crops it,
   whatever its shape.
3. **Create a file called `index.md`** in the same folder, and copy this into it:

   ```md
   ---
   title: "Example title"
   year: 2026
   medium: "Example medium"
   dimensions: "40 × 50 cm"
   featured: false
   order: 7
   status: available
   etsyUrl: "https://www.etsy.com/listing/123456789/example-title"
   printsUrl: "https://example.com/prints/example-title"
   ---
   ```

   Then replace the example values with the real ones. Keep the two `---` lines. Put text values
   between straight double quotes.

What each line does:

| Line | What to write |
| --- | --- |
| `title` | The title. It is also read aloud to blind visitors as the description of the image, so it is required. |
| `year` | A year (`2026`) or text in quotes (`"2025 to 2026"`). |
| `medium` | The medium, in quotes. |
| `dimensions` | Optional. Delete the whole line if the work has no physical size. |
| `featured` | `true` for the one work that opens the gallery full screen, `false` for the others. If several say `true`, the one with the lowest `order` is used. If none does, the first work is used. |
| `order` | A number. Works appear in the gallery, and in Previous / Next on the work pages, from the lowest number to the highest. |
| `status` | `available`, `sold` or `not-for-sale`. Until you know, it can stay as the placeholder, which the work page then shows as written. |
| `etsyUrl` | Optional. The Etsy listing of the original. The **Original on Etsy** button appears while `status` is `available` (or still a placeholder), and disappears once the work is `sold` or `not-for-sale`. |
| `printsUrl` | Optional. The page where prints of this work can be ordered. The **Prints** button appears whenever this line exists, including when the original is sold. |

Web addresses must be complete, starting with `https://`. Leave a line out entirely rather than
leaving it empty.

When `status` is `sold`, the work page shows "Sold" (with a small dot, the gallery convention) and
keeps the Prints button if there is one.

The site deliberately shows no text about a work beyond these details. Anything written below the
second `---` line is ignored.

**To remove a work**, delete its folder.

**The works already on the site** are in `src/content/works/work-01/`, `work-02/` and `work-03/`.
Their title, year, medium, dimensions, availability, Etsy address and prints address are still
placeholders: open each `index.md` and fill them in. You can also rename the folders (the web
address follows the folder name). `work-01` is the featured work.

## 4. Changing colours and fonts

### Colours, type sizes and spacing

All of these live in one file: **`src/styles/tokens.css`**. Every value there is a provisional
proposal. Change the hexadecimal colour codes (such as `#0f0d0b`) and save.

- `--colour-bg`: the warm near-black background.
- `--colour-text`: the bone-coloured text.
- `--colour-text-muted`: labels and secondary text.
- `--colour-accent`: the muted brass used for focus outlines, the current page and hover.

Text must stay readable against the background: check any new pair of colours with a contrast
checker such as the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/). Aim
for at least 4.5:1. The current ratios are noted beside each colour in the file.

More settings in the same file control the atmosphere (`0` turns an effect off):

- `--bleed-opacity`: how strongly the colours at the edges of each work run out onto the page.
- `--bleed-size` and `--bleed-size-vertical`: how far they run sideways, and up and down.
- `--bleed-blur`: how soft they are.
- `--frame-gap`: the empty space kept around each work in the gallery.
- `--parallax`: how far a work glides as the page scrolls.
- `--wall-light`: the faint light falling from the top of the screen.
- `--vignette`: the shadow deepening towards the edges of the screen.
- `--grain-opacity`: the fine, still grain on the background.

None of them ever covers or changes the artwork itself: the bleed is drawn behind the work, from a
tiny copy of it made automatically when the site is built.

### Fonts

The two fonts are **Instrument Serif** (the serif for the name, titles and statement) and its
sister **Instrument Sans** (the sans serif for navigation, labels and body text). Both are free,
open-licence fonts from [Fontsource](https://fontsource.org), and the files are served from your
own site, so visitors' browsers never contact another company.

To use a different font:

1. Find it on [fontsource.org](https://fontsource.org) and note its package name, for example
   `@fontsource/eb-garamond`.
2. Install it from the terminal: `npm install @fontsource/eb-garamond`
3. Open **`astro.config.mjs`**. In the `fonts` section, change the `name` to the new font's name
   and change each `src` line to point at the new package's files. They are in
   `node_modules/@fontsource/<font>/files/`; use the files whose names contain `latin-400-normal`,
   `latin-400-italic` and so on, matching each `weight` and `style`.
4. Save, then run `npm run dev` to check. Nothing in `tokens.css` needs to change.

### The artist name

The name shown in the header, on the gallery and in the footer is set in **`src/site.config.ts`**
(`name: 'Q'`). On the gallery's opening screen, a one-word name sits large at the bottom right of
the featured work; with two or more words, the first sits at the top left and the rest at the
bottom right.

## 5. Filling in the placeholders

Anything the site does not know is written as `[PLACEHOLDER: ...]`. Until it is replaced, it shows
on the site as plain text (web addresses and the email address are not turned into links until they
are real), so nothing breaks in the meantime.

| Where | Placeholder | What to write |
| --- | --- | --- |
| `src/site.config.ts` | `[PLACEHOLDER: one-sentence site description for search engines]` | One sentence shown in search results and link previews. |
| `src/site.config.ts` | `[PLACEHOLDER: contact email]` | The public email address. It becomes a clickable email link. |
| `src/site.config.ts` | `[PLACEHOLDER: Etsy shop URL]` | The full address of the Etsy shop. |
| `src/site.config.ts` | `[PLACEHOLDER: Gelato prints URL]` | The full address where prints can be ordered. |
| `src/site.config.ts` | `[PLACEHOLDER: trading name / legal identity]` | Who operates the site, for the Legal page. |
| `src/site.config.ts` | `[PLACEHOLDER: contact]` | Contact details for the Legal page. |
| `src/site.config.ts` | `[PLACEHOLDER: data controller name / legal identity]` | Who is responsible for personal data, for the Privacy page. |
| `src/site.config.ts` | `[PLACEHOLDER: data controller contact details]` | How to reach them, for the Privacy page. |
| `src/content/about/index.md` | `[PLACEHOLDER: artist statement]` | The statement, below the second `---` line. Separate paragraphs with an empty line. |
| `src/content/about/index.md` | `[PLACEHOLDER: portrait description, read aloud by screen readers]` | Only needed if you add a portrait (see below). |
| `src/pages/privacy.astro` | `[PLACEHOLDER: server log retention period under the Vercel plan in use]` | How long Vercel keeps server logs for your plan. |
| `src/content/works/work-01/`, `work-02/`, `work-03/` (`index.md`) | `[PLACEHOLDER: title]`, `[PLACEHOLDER: year]`, `[PLACEHOLDER: medium]`, `[PLACEHOLDER: dimensions]`, `[PLACEHOLDER: available, sold or not-for-sale]` | The details of each work (see section 3). |
| `src/content/works/work-01/`, `work-02/`, `work-03/` (`index.md`) | `[PLACEHOLDER: Etsy listing URL]`, `[PLACEHOLDER: prints URL for this work]` | The Etsy listing of the original and the page where prints of the work are ordered. They fill the **Original on Etsy** and **Prints** buttons on the work's page. Delete a line to remove its button. |

**The portrait on the About page** is optional and hidden by default, because the artist is
anonymous. To show one, put a single image file in `src/content/about/` and describe it in the
`portraitAlt` line of `src/content/about/index.md`. Remove the image to hide it again.

**To find any placeholder left**, search the whole project for `[PLACEHOLDER` (in Visual Studio
Code: **Edit → Find in Files**).

## 6. The legal pages and the "Template" banner

The Privacy, Cookies and Legal pages are templates written for UK law (the UK GDPR and the Data
Protection Act 2018). They describe exactly what this site does today: no cookies, no analytics, no
forms, no data collected by the site itself, hosting by Vercel (which processes server logs,
including IP addresses), and links to Etsy and Gelato, which have their own policies. Have them
reviewed before publishing. If you later add anything that collects data (analytics, a newsletter,
a form, embedded videos), these pages must be updated.

A banner at the top of each of the three pages reads "Template: to be reviewed before
publication." To remove it once the pages have been reviewed, open **`src/site.config.ts`** and
change:

```ts
showTemplateBanner: true,
```

to:

```ts
showTemplateBanner: false,
```

The wording of the pages themselves is in `src/pages/privacy.astro`, `src/pages/cookies.astro` and
`src/pages/legal.astro`.

## 7. Putting the site online with Vercel

The site is published from GitHub (where the files are stored online) to Vercel (which hosts it).

1. **Put the project on GitHub.** Create a free account at [github.com](https://github.com) and
   install the free GitHub Desktop app. In GitHub Desktop, add the project folder as a repository,
   then publish it (it can stay private). The `node_modules` and `dist` folders are left out
   automatically.
2. **Create the Vercel project.** Sign up at [vercel.com](https://vercel.com) using your GitHub
   account, add a new project and import the repository. Vercel recognises Astro by itself: leave
   the suggested settings as they are (framework preset Astro, output folder `dist`) and click
   **Deploy**.
3. **Visit the site.** When the build finishes, the site is live at an address ending in
   `.vercel.app`, shown on the project page.
4. **Check the address the site uses for itself.** Open `https://<your-address>.vercel.app/robots.txt`.
   The last line must show your `.vercel.app` address. If it shows `localhost` instead, open the
   project's **Settings → Environment Variables**, tick **Enable access to System Environment
   Variables**, then redeploy (see below).

From then on, every change you publish to GitHub (commit, then push, in GitHub Desktop) is built and
put online automatically, usually within a few minutes. To rebuild without changing anything, open the
project's **Deployments** page, open the latest one and choose **Redeploy**.

**A note on Vercel plans.** Vercel's free Hobby plan is for non-commercial, personal use only, and
Vercel's
[fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) count "advertising the
sale of a product or service" as commercial use. As this site links to shops, check those
guidelines and whether you need the paid Pro plan.

## 8. Attaching your own domain later

1. **Get a domain** from any domain registrar, or buy one through Vercel.
2. In Vercel, open the project, then **Settings → Domains → Add Domain**, and type the domain in.
3. Vercel then shows the DNS records to add at your registrar. Add them exactly as shown; the domain
   starts working once they take effect (sometimes within minutes, sometimes a few hours). Vercel
   provides the security certificate (https) itself.
4. **Redeploy once** (Deployments → latest → Redeploy). The site builds its canonical links, sitemap
   and link previews from its address, and after this rebuild it uses your domain instead of the
   `.vercel.app` address. No file needs editing.

If you add both `yourdomain.com` and `www.yourdomain.com`, Vercel hands the site the shorter one.
If you want the `www` version used instead, go to **Settings → Environment Variables**, add a
variable named `SITE_URL` with the value `https://www.yourdomain.com`, and redeploy.

## 9. Where things are

| Path | What it holds |
| --- | --- |
| `src/site.config.ts` | Name, description, contact details, legal details, the banner switch. |
| `src/content/works/` | One folder per work: an image and `index.md`. |
| `src/content/about/index.md` | The artist statement (and the optional portrait). |
| `src/styles/tokens.css` | Colours, type sizes and spacing (provisional design tokens). |
| `astro.config.mjs` | Fonts, image quality and the site address. |
| `src/pages/` | One file per page: `index.astro` (gallery), `works/[slug].astro` (artwork pages), `about.astro`, `contact.astro`, `privacy.astro`, `cookies.astro`, `legal.astro`, `404.astro`, plus the sitemap and robots.txt. |
| `src/components/`, `src/layouts/`, `src/scripts/` | The building blocks of the pages, smooth scrolling and the full-screen viewer. |
| `public/` | The browser-tab icons. |
| `vercel.json` | Tells browsers to keep the site's fingerprinted files cached, so repeat visits are fast. |

**How the site behaves**, for reference: it works fully with JavaScript switched off; it sets no
cookies and loads nothing from other companies; every image keeps its own proportions and is never
cropped; tapping or clicking an artwork opens it full screen, where it can be zoomed. The menu
(Gallery, About, Contact) stays at the top of the screen on every page, phones included; a soft
shade appears behind it only once the page has scrolled, so it never darkens a work at rest.

The gallery opens on the featured work with the name set around it. The colours at the edges of
each work wash softly onto the wall around it. As the page scrolls, each work comes out of the
dark as it reaches the middle of the screen and glides a little faster than the page, as if
hanging in front of the wall. Upright works hang left or right
in turn beside their title and number; wide works take the full width. Each work is sized so that
it fits on screen with its title, below the menu, and it settles gently into place: when scrolling
stops close to a work, the page glides until the work sits in the middle of the screen. Stop
between two works and the page stays where it is.

A work page shows everything on one screen, with nothing to scroll, whatever the screen (phones
held upright or sideways, tablets, computers): the work itself, as large as the space allows, its
number, title, details, shop buttons, the links to the previous and next works and a one-line
footer. On computers the label sits beside the work with Previous / Next under it; on phones it
sits under the work, and the details read like a museum label (year, medium and dimensions on one
line, then availability). A click on the empty background, or the Escape key, returns to the
gallery at the same place; the Gallery link in the menu does the same without JavaScript. Clicking
the work itself opens it full screen, where it can be zoomed.

Moving around the site never reloads the page: each page is fetched shortly before it is needed
(as soon as a link to it has been on screen for a moment) and swapped in while the old one fades
out. In browsers that support page transitions (such as Chrome and Edge), the work you click grows
into its own page and back again, its colour bleed travelling with it; other browsers change page
at once. All movement (smooth scrolling, the pull towards each work, the light and parallax
effects, the page transitions) is switched off for visitors whose device asks for reduced motion.
Browsers that do not support an effect simply show the page without it.
