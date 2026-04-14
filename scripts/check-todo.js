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
  {
    pattern: /创建公开仓库 crealize/,
    done: fs.existsSync(path.resolve(__dirname, "../../.git")),
  },
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
