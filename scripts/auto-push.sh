#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 获取当前脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PUBLIC_DIR="$PROJECT_ROOT/../crealize-public"

# 获取公开仓库地址
PUBLIC_REPO=$(node -p "require('$PROJECT_ROOT/package.json').crealizePublicRepo")

echo -e "${GREEN}开始自动推送流程...${NC}"

# 0. 构建并导出静态站点
cd "$PROJECT_ROOT"
echo -e "${GREEN}构建并导出静态站点...${NC}"
npm run build

# 1. 推送到私有仓库 (crealizecode)
echo -e "${GREEN}推送到私有仓库...${NC}"
git add .
git commit -m "chore: 自动化开发与优化一体化提交" || {
    echo -e "${RED}私有仓库提交失败${NC}"
    exit 1
}
git push origin main || {
    echo -e "${RED}私有仓库推送失败${NC}"
    exit 1
}

# 2. 检查并克隆公开仓库 (crealize)
echo -e "${GREEN}检查公开仓库目录...${NC}"
if [ ! -d "$PUBLIC_DIR" ]; then
    echo -e "${YELLOW}公开仓库目录不存在，自动克隆...${NC}"
    git clone "$PUBLIC_REPO" "$PUBLIC_DIR" || {
        echo -e "${RED}公开仓库克隆失败${NC}"
        exit 1
    }
fi

# 只同步 .next/export/ 目录内容到公开仓库根目录
rsync -av --delete "$PROJECT_ROOT/.next/export/" "$PUBLIC_DIR/" || {
    echo -e "${RED}同步静态站点内容失败${NC}"
    exit 1
}

# 提交并推送公开仓库
cd "$PUBLIC_DIR"
export GIT_DIR="$PUBLIC_DIR/.git"
export GIT_WORK_TREE="$PUBLIC_DIR"

touch .nojekyll
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git add -A .
    git commit -m "chore: 发布静态站点（自动导出）" || true
fi
if ! git pull --rebase origin main; then
    echo -e "${RED}公开仓库拉取合并失败，请手动处理冲突${NC}"
    exit 1
fi
git push origin main || {
    echo -e "${RED}公开仓库推送失败${NC}"
    exit 1
}

echo -e "${GREEN}自动推送完成！${NC}" 