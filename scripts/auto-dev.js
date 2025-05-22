#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 颜色定义
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.green}[INFO]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
};

// 执行命令
function runCommand(command) {
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    log.error(`执行命令失败: ${command}`);
    return false;
  }
}

// 自动开发
async function runAutoDev() {
  log.info("开始自动开发流程...");

  // 运行现有的开发指南脚本
  if (!runCommand("node scripts/dev-guide.js")) {
    log.error("自动开发失败");
    return false;
  }

  return true;
}

// 自动优化
async function runAutoOptimize() {
  log.info("开始自动优化流程...");

  // 1. 格式化代码
  log.info("格式化代码...");
  if (!runCommand('npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"')) {
    log.error("代码格式化失败");
    return false;
  }

  // 2. ESLint 检查
  log.info("运行 ESLint 检查...");
  if (!runCommand("npx eslint . --fix")) {
    log.warn("ESLint 检查发现问题，但已尝试修复");
  }

  // 3. 类型检查
  log.info("运行 TypeScript 类型检查...");
  if (!runCommand("npx tsc --noEmit")) {
    log.error("类型检查失败");
    return false;
  }

  return true;
}

// 自动推送
async function runAutoPush() {
  log.info("开始自动推送流程...");

  if (!runCommand("bash scripts/auto-push.sh")) {
    log.error("自动推送失败");
    return false;
  }

  return true;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || "--all";

  try {
    switch (mode) {
      case "--dev":
        await runAutoDev();
        break;
      case "--opt":
        await runAutoOptimize();
        break;
      case "--push":
        await runAutoPush();
        break;
      case "--all":
      default:
        if (await runAutoDev()) {
          if (await runAutoOptimize()) {
            await runAutoPush();
          }
        }
        break;
    }
  } catch (error) {
    log.error(`执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();
