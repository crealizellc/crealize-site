const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const cursorrules = fs.readFileSync(path.join(ROOT, ".cursorrules"), "utf-8");

function checkDirStructure() {
  const requiredDirs = [
    "src",
    "src/app",
    "src/components",
    "src/lib",
    "src/styles",
    "src/types",
    "docs",
    "docs/development",
    "docs/architecture",
    "docs/design-system",
  ];
  let allPassed = true;
  for (const dir of requiredDirs) {
    if (!fs.existsSync(path.join(ROOT, dir))) {
      console.log(`[x] 缺少目录: ${dir}`);
      allPassed = false;
    } else {
      console.log(`[√] 目录存在: ${dir}`);
    }
  }
  return allPassed;
}

function checkNamingConventions() {
  // 这里只做简单演示，可扩展为正则批量检查
  const files = fs.readdirSync(path.join(ROOT, "src/components"), {
    withFileTypes: true,
  });
  let allPassed = true;
  for (const file of files) {
    if (file.isFile() && !/^[A-Z][A-Za-z0-9]+\.tsx$/.test(file.name)) {
      console.log(`[x] 组件命名不规范: ${file.name}`);
      allPassed = false;
    }
  }
  return allPassed;
}

console.log("--- 目录结构检查 ---");
const dirOk = checkDirStructure();
console.log("--- 组件命名规范检查 ---");
const nameOk = checkNamingConventions();

if (dirOk && nameOk) {
  console.log("所有结构与命名规范检查通过！");
} else {
  console.log("存在不符合规范的项目，请根据 .cursorrules 修正！");
}
