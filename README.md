# Jayeds Writing

The website for মো: জায়েদ খান's books, with a built-in editor (CMS) at `/admin`.

## Editing (the CMS)
1. Open `https://<your-site>/admin`.
2. Sign in with GitHub. If asked, use **Sign In Using Access Token** and paste a GitHub token that has access to `Tariq-15/Jayed-Khan`.
3. Edit, then **Save**. Every save is a commit to this repo. Vercel then rebuilds the site, and the change goes live in about a minute.

**Books**: one entry per book.
- Cover, background artwork, accent colour, genre and short description.
- **Status**: `চলমান` shows "চলবে…" after the latest part.
- **Show at the top of the home page**: puts the book at the top of the home page.
- **Web address**: goes in the book's link, so don't change it later.

**Parts**: one entry per part (chapter or পর্ব).
- Pick the book.
- **Order** sets the position, smallest first. Use `1.5` to put a part between 1 and 2.

In the **Text** editor:
- each paragraph is one paragraph on the site
- **H2** makes a scene heading (দুই মাস পর)
- a line of `————` makes a scene break (`* * *`)
- the **image** button inserts a picture between paragraphs; its title, or its description if there's no title, becomes the caption
- uploaded images are saved to `images/` as WebP

## How it fits together
- `content/books/*.json` and `content/parts/*.json` are written by the CMS, one file per book or part.
- `build.js` merges them into `content/library.json`. Vercel runs it on every deploy (`vercel.json`). Part text is loaded only when someone opens that part.
- `index.html`, `app.js` and `style.css` are the site. Routes are `#/`, `#/book/<id>` and `#/read/<id>/<n>`.
- `admin/` is the CMS: Sveltia CMS, with settings in `admin/config.yml`.

## Run locally
```
node build.js
python -m http.server 5173
```
Then open http://localhost:5173. The site loads its content with `fetch`, so opening `index.html` straight from disk won't work.

## Design
The site uses the Mozaic foundations from `DESIGN-adeo-mozaic.md` as plain CSS in `style.css`:
- the 16px magic-unit spacing tokens (`--mu025` … `--mu600`)
- 48px medium and 56px large controls, with a 4px radius
- 14, 16 and 18px body sizes
- the 3px focus ring
- the `mc-button` and `mc-quantity-selector` class names (the reader's font-size control)

The font is Anek Bangla; book titles use its narrow width. The colours come from the তপ্ত প্রলয় cover.
