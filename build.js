// Vercel runs this on every deploy: merges content/books/*.json and content/parts/*.json (one file each, edited in the CMS)
// into content/library.json. Part text stays in its own file and is loaded only when someone reads that part.
const fs = require("fs");
const read = dir => fs.readdirSync(dir).filter(f => f.endsWith(".json"))
  .map(f => ({ file: `${dir}/${f}`, ...JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")) }));

const parts = read("content/parts").sort((a, b) => a.order - b.order);
const books = read("content/books")
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
  .map(({ file, date, ...book }) => ({
    ...book,
    parts: parts.filter(p => p.book === book.id).map(p => ({
      file: p.file,
      title: p.title,
      minutes: Math.max(1, Math.round((p.body || "").split(/\s+/).length / 180)),
    })),
  }));

const orphans = parts.filter(p => !books.some(b => b.id === p.book));
if (orphans.length) console.warn(`Not shown, their book doesn't exist: ${orphans.map(p => p.file).join(", ")}`);
fs.writeFileSync("content/library.json", JSON.stringify({ books }));
console.log(`library.json: ${books.length} books, ${parts.length - orphans.length} parts`);
