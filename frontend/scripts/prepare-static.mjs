import { readdir, copyFile } from "node:fs/promises";

// Next's client router requests flattened segment paths. Plain static hosts
// (including the Go embed server) need aliases for the nested export files.
async function aliases(dir, parts = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = [...parts, entry.name];
    if (entry.isDirectory()) {
      await aliases(`${dir}/${entry.name}`, rel);
      continue;
    }
    if (!entry.name.endsWith(".txt")) continue;
    const index = rel.findIndex(part => part.startsWith("__next."));
    if (index < 0 || index === rel.length - 1) continue;
    const alias = [...rel.slice(0, index), rel.slice(index).join(".")].join("/");
    await copyFile(`out/${rel.join("/")}`, `out/${alias}`);
  }
}
await aliases("out");
