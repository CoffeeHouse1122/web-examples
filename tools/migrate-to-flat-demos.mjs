import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const groupPattern = /^\d{3}-\d{3}$/;

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  const demosRoot = path.join(root, "demos");
  await fs.mkdir(demosRoot, { recursive: true });

  const topItems = await fs.readdir(root, { withFileTypes: true });
  const groups = topItems
    .filter((item) => item.isDirectory() && groupPattern.test(item.name))
    .map((item) => item.name)
    .sort();

  let moved = 0;
  let skipped = 0;

  for (const group of groups) {
    const groupPath = path.join(root, group);
    const demos = await fs.readdir(groupPath, { withFileTypes: true });

    for (const demo of demos) {
      if (!demo.isDirectory()) {
        continue;
      }

      const id = Number(demo.name);
      if (!Number.isInteger(id)) {
        continue;
      }

      const oldPath = path.join(groupPath, demo.name);
      const newPath = path.join(demosRoot, String(id));

      if (await exists(newPath)) {
        skipped += 1;
        continue;
      }

      await fs.rename(oldPath, newPath);
      moved += 1;
    }
  }

  console.log(`moved: ${moved}`);
  console.log(`skipped: ${skipped}`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
