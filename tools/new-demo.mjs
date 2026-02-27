import fs from "node:fs/promises";
import path from "node:path";

function parseArgs() {
  const id = Number(process.argv[2]);
  const title = (process.argv[3] || "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("用法: node .\\tools\\new-demo.mjs 272 \"按钮悬浮动效\"");
  }

  return {
    id,
    title: title || `效果 ${id}`
  };
}

function buildTemplate(title) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body {
      margin: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>TODO: 在这里实现效果。</p>
</body>
</html>
`;
}

async function createDemo() {
  const { id, title } = parseArgs();
  const root = process.cwd();
  const demoDir = path.join(root, "demos", String(id));
  const htmlFile = path.join(demoDir, "index.html");

  await fs.mkdir(demoDir, { recursive: true });

  try {
    await fs.access(htmlFile);
    console.error(`已存在: ${htmlFile}`);
    process.exit(1);
  } catch {
    await fs.writeFile(htmlFile, buildTemplate(title), "utf8");
    console.log(`created: ${htmlFile}`);
  }
}

createDemo().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
