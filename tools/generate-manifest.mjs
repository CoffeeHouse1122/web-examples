import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function buildReadmeSection(records) {
  const lines = ["## 页面案例集合", ""];
  for (const item of records) {
    const title = String(item.title || "").trim() || `效果 ${item.id}`;
    lines.push(`${item.id}. ${title}`);
  }
  return `${lines.join("\n")}\n`;
}

async function updateReadme(records) {
  const readmePath = path.join(root, "README.md");
  let readme;
  try {
    readme = await fs.readFile(readmePath, "utf8");
  } catch {
    return;
  }

  const sectionHeader = "## 页面案例集合";
  const sectionStart = readme.indexOf(sectionHeader);
  const sectionContent = buildReadmeSection(records);

  if (sectionStart === -1) {
    const content = `${readme.trimEnd()}\n\n---\n\n${sectionContent}`;
    await fs.writeFile(readmePath, content, "utf8");
    return;
  }

  const before = readme.slice(0, sectionStart).trimEnd();
  const merged = `${before}\n\n${sectionContent}`;
  await fs.writeFile(readmePath, merged, "utf8");
}

async function getHtmlTitle(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(/<title>([\s\S]*?)<\/title>/i);
    return (match?.[1] || "").trim();
  } catch {
    return "";
  }
}

async function generateManifest() {
  const demosRoot = path.join(root, "demos");
  await fs.mkdir(demosRoot, { recursive: true });
  const dirs = await fs.readdir(demosRoot, { withFileTypes: true });

  const records = [];

  for (const child of dirs) {
    if (!child.isDirectory()) {
      continue;
    }

    const id = Number(child.name);
    if (!Number.isInteger(id)) {
      continue;
    }

    const htmlPath = path.join(demosRoot, child.name, "index.html");
    try {
      await fs.access(htmlPath);
    } catch {
      continue;
    }

    const title = await getHtmlTitle(htmlPath);
    records.push({
      id,
      title,
      path: normalizePath(path.join("demos", child.name, "index.html"))
    });
  }

  records.sort((a, b) => a.id - b.id);

  const outputFile = path.join(root, "manifest.json");
  await fs.writeFile(outputFile, JSON.stringify(records, null, 2), "utf8");
  await updateReadme(records);
  console.log(`manifest.json generated: ${records.length} items`);
}

generateManifest().catch((error) => {
  console.error(error);
  process.exit(1);
});
