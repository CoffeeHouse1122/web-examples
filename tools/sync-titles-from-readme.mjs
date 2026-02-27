import fs from "node:fs/promises";
import path from "node:path";

function isNumericTitle(value) {
  return /^\d+$/.test(String(value ?? "").trim());
}

function parseReadmeTitleMap(content) {
  const lines = content.split(/\r?\n/);
  const titleMap = new Map();

  let inSection = false;
  for (const line of lines) {
    if (!inSection) {
      if (/^##\s+页面案例集合\s*$/.test(line.trim())) {
        inSection = true;
      }
      continue;
    }

    if (/^##\s+/.test(line.trim())) {
      break;
    }

    const match = line.match(/^(\d+)\.\s+(.+)$/);
    if (!match) {
      continue;
    }

    const id = Number(match[1]);
    const title = match[2].trim();
    if (Number.isInteger(id) && title) {
      titleMap.set(id, title);
    }
  }

  return titleMap;
}

function updateHtmlTitle(html, nextTitle) {
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title>([\s\S]*?)<\/title>/i, `<title>${nextTitle}</title>`);
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (headTag) => `${headTag}\n  <title>${nextTitle}</title>`);
  }

  return html;
}

async function run() {
  const root = process.cwd();
  const readmePath = path.join(root, "README.md");
  const manifestPath = path.join(root, "manifest.json");

  const readmeContent = await fs.readFile(readmePath, "utf8");
  const titleMap = parseReadmeTitleMap(readmeContent);
  if (titleMap.size === 0) {
    throw new Error("未在 README.md 的“页面案例集合”中解析到编号标题。");
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  let manifestUpdated = 0;
  let htmlUpdated = 0;

  for (const item of manifest) {
    if (!isNumericTitle(item.title)) {
      continue;
    }

    const nextTitle = titleMap.get(Number(item.id));
    if (!nextTitle) {
      continue;
    }

    item.title = nextTitle;
    manifestUpdated += 1;

    if (!item.path) {
      continue;
    }

    const htmlPath = path.join(root, item.path);
    try {
      const html = await fs.readFile(htmlPath, "utf8");
      const currentTitleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const currentTitle = (currentTitleMatch?.[1] || "").trim();
      if (!isNumericTitle(currentTitle)) {
        continue;
      }

      const nextHtml = updateHtmlTitle(html, nextTitle);
      if (nextHtml !== html) {
        await fs.writeFile(htmlPath, nextHtml, "utf8");
        htmlUpdated += 1;
      }
    } catch {
      // Ignore missing or unreadable demo files.
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`manifest updated: ${manifestUpdated}`);
  console.log(`html title updated: ${htmlUpdated}`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
