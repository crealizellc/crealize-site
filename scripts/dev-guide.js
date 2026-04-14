const fs = require("fs");
const path = require("path");

const TODO_PATH = path.resolve(__dirname, "../docs/development/TODO.md");
const ROOT = path.resolve(__dirname, "..");
const ISSUE_LOG = path.resolve(
  __dirname,
  "../docs/development/AUTO_DEV_ISSUES.md",
);

// 解析 auto:check/auto:gen 注释（修正版，支持多个键值）
function parseAuto(line) {
  const match = line.match(/<!--\s*auto:([^>]*)-->/);
  if (!match) return {};
  const parts = match[1].split(";").map((s) => s.trim());
  const result = {};
  parts.forEach((p) => {
    const eqIdx = p.indexOf("=");
    if (eqIdx > 0) {
      let k = p.slice(0, eqIdx).trim();
      const v = p.slice(eqIdx + 1).trim();
      if (k.startsWith("auto:")) k = k.replace("auto:", "");
      result[k] = v;
    }
  });
  return result;
}

// 自动检测任务是否完成
function checkTask(auto) {
  if (auto.check && auto.check.startsWith("file:")) {
    const filePath = path.join(ROOT, auto.check.replace("file:", ""));
    const exists = fs.existsSync(filePath);
    console.log(`[调试] 检查文件是否存在: ${filePath} => ${exists}`);
    return exists;
  }
  // 可扩展更多检测类型
  return false;
}

// 自动生成任务（详细调试版）
function genTask(auto, line) {
  console.log(`[调试] genTask 入参: auto=`, auto, "line=", line);
  try {
    if (auto.gen && auto.gen.startsWith("page:")) {
      const filePath = path.join(ROOT, auto.check.replace("file:", ""));
      const pageName = path.basename(filePath, ".tsx");
      const title = auto.gen.replace("page:", "");
      console.log(
        `[调试] 进入 page 生成分支: filePath=${filePath}, pageName=${pageName}, title=${title}`,
      );
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        console.log(`[调试] 已递归创建目录: ${path.dirname(filePath)}`);
      }
      fs.writeFileSync(
        filePath,
        `/**\n * ${title} 页面\n */\nexport default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}() {\n  return <div>${title}</div>;\n}\n`,
      );
      console.log(`[自动生成] 已创建页面: ${filePath}`);
      return true;
    }
    if (auto.gen && auto.gen.startsWith("component:")) {
      const filePath = path.join(ROOT, auto.check.replace("file:", ""));
      const compName = path.basename(filePath, ".tsx");
      console.log(
        `[调试] 进入 component 生成分支: filePath=${filePath}, compName=${compName}`,
      );
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        console.log(`[调试] 已递归创建目录: ${path.dirname(filePath)}`);
      }
      fs.writeFileSync(
        filePath,
        `/**\n * ${compName} 组件\n */\nimport React from 'react';\n\nexport const ${compName.charAt(0).toUpperCase() + compName.slice(1)} = () => {\n  return <button>{'按钮'}</button>;\n};\n`,
      );
      console.log(`[自动生成] 已创建组件: ${filePath}`);
      return true;
    }
    if (auto.gen && auto.gen.startsWith("style:global")) {
      const filePath = path.join(ROOT, "src/styles/globals.css");
      console.log(`[调试] 进入 style 生成分支: filePath=${filePath}`);
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        console.log(`[调试] 已递归创建目录: ${path.dirname(filePath)}`);
      }
      fs.writeFileSync(
        filePath,
        "/* 全局样式 */\nbody { margin: 0; font-family: sans-serif; }\n",
      );
      console.log(`[自动生成] 已创建全局样式: ${filePath}`);
      return true;
    }
    // 可扩展更多自动生成类型
    console.log("[调试] 未进入任何生成分支");
    return false;
  } catch (e) {
    const errMsg = `[错误] 自动生成失败: ${line.trim()}\n${e.stack || e}`;
    console.error(errMsg);
    // 自动追加到 AUTO_DEV_ISSUES.md
    const log = `\n### ${new Date().toISOString()}\n${errMsg}\n`;
    fs.appendFileSync(ISSUE_LOG, log, "utf-8");
    return false;
  }
}

// 主流程
let todo = fs.readFileSync(TODO_PATH, "utf-8");
let lines = todo.split("\n");
let updated = false;
let steps = [];

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (line.match(/\[ \]/) && line.includes("auto:")) {
    const auto = parseAuto(line);
    console.log(`[调试] 解析任务: ${line.trim()} =>`, auto);
    if (auto.manual !== undefined) {
      steps.push(`⏩ 跳过需人工确认任务: ${line.trim()}`);
      continue;
    }
    if (checkTask(auto)) {
      lines[i] = line.replace(/\[ \]/, "[x]");
      updated = true;
      steps.push(`✔️ 已检测完成: ${line.trim()}`);
      continue;
    }
    // 自动生成
    if (genTask(auto, line)) {
      lines[i] = line.replace(/\[ \]/, "[x]");
      updated = true;
      steps.push(`✔️ 已自动生成: ${line.trim()}`);
      continue;
    } else {
      steps.push(`❌ 未能自动生成: ${line.trim()}`);
    }
  }
}
if (updated) {
  fs.writeFileSync(TODO_PATH, lines.join("\n"), "utf-8");
}

console.log("--- 自动开发过程 ---");
steps.forEach((step) => console.log(step));

const hasUnfinished = lines.some((line) => line.match(/\[ \]/));
if (!hasUnfinished) {
  console.log("\n🎉 项目开发已全部自动完成！所有任务均已完成。");
} else {
  console.log("\n部分任务未能自动完成，请根据 TODO.md 手动推进。");
}
