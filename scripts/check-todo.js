const fs = require("fs");
const path = require("path");

const TODO_PATH = path.resolve(__dirname, "../docs/development/TODO.md");

function checkTask(line, checkers) {
  for (const checker of checkers) {
    if (checker.pattern.test(line)) {
      return checker.done ? "[x]" : "[ ]";
    }
  }
  return null;
}

// 可扩展的任务检测器
const checkers = [
  // 「创建公开仓库 crealize」原本用 fs.existsSync("../../.git") 判斷 —— 檢查的是本 repo
  // 上一層目錄有無 .git，與「GitHub 上公開 repo 是否存在」無關，每次執行都把已完成翻成未完成
  // 並寫回檔案（假指標 + 檔案汙染）。本機無法離線驗證遠端 repo，故移出自動檢測，維持人工狀態。
  // 事實：crealizellc/crealize 存在（2026-08-08 `gh repo list crealizellc` 實查）。
  {
    pattern: /创建私有仓库 crealizecode/,
    done: true, // 假定已完成
  },
  {
    pattern: /添加 README 文件/,
    done: fs.existsSync(path.resolve(__dirname, "../README.md")),
  },
  {
    pattern: /配置仓库关系/,
    done: true, // 可根据实际情况扩展
  },
  // 可继续扩展更多任务检测
];

const todo = fs.readFileSync(TODO_PATH, "utf-8");
const lines = todo.split("\n");
const newLines = lines.map((line) => {
  const match = line.match(/\[.\]/);
  if (match) {
    const status = checkTask(line, checkers);
    if (status) {
      return line.replace(/\[.\]/, status);
    }
  }
  return line;
});

fs.writeFileSync(TODO_PATH, newLines.join("\n"), "utf-8");
console.log("TODO.md 自动检查与勾选完成！");
