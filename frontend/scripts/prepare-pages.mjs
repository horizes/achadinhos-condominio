import { readFile, writeFile, readdir, copyFile } from "node:fs/promises";
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const path = "out/manifest.webmanifest";
const manifest = JSON.parse(await readFile(path, "utf8"));
manifest.name = "Achadinhos · prévia de testes";
manifest.start_url = `${base}/`;
manifest.scope = `${base}/`;
manifest.icons = manifest.icons.map(icon => ({ ...icon, src: `${base}${base ? icon.src.replaceAll(base, "") : icon.src}` }));
await writeFile(path, JSON.stringify(manifest, null, 2) + "\n");
await writeFile("out/.nojekyll", "");
await writeFile("out/robots.txt", "User-agent: *\nDisallow: /\n");
console.log("Prévia estática preparada em", base || "/");

// Static RSC segment aliases for hosts without server-side rewrites.
async function aliases(dir, parts = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = [...parts, entry.name];
    if (entry.isDirectory()) { await aliases(`${dir}/${entry.name}`, rel); continue; }
    if (!entry.name.endsWith(".txt")) continue;
    const index = rel.findIndex(part => part.startsWith("__next."));
    if (index < 0 || index === rel.length - 1) continue;
    const alias = [...rel.slice(0, index), rel.slice(index).join(".")].join("/");
    await copyFile(`out/${rel.join("/")}`, `out/${alias}`);
  }
}
await aliases("out");
