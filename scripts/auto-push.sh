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

# 1. 推送到私有仓库 (crealizecode)
echo -e "${GREEN}推送到私有仓库...${NC}"
cd "$PROJECT_ROOT"
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

# 同步公开内容
rsync -av --delete \
    "$PROJECT_ROOT/README.md" \
    "$PROJECT_ROOT/docs/" \
    "$PROJECT_ROOT/public/" \
    "$PROJECT_ROOT/src/app/" \
    "$PUBLIC_DIR/" || {
    echo -e "${RED}同步公开内容失败${NC}"
    exit 1
}

# 提交并推送公开仓库
cd "$PUBLIC_DIR"
# 设置 git 只检查当前目录
export GIT_DIR="$PUBLIC_DIR/.git"
export GIT_WORK_TREE="$PUBLIC_DIR"

# 终极无人值守：自动 add -A .，确保所有未跟踪文件也被暂存
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git add -A .
    git commit -m "chore: 自动暂存本地变更（含未跟踪文件）" || true
fi

# 推送前自动拉取并 rebase
if ! git pull --rebase origin main; then
    echo -e "${RED}公开仓库拉取合并失败，请手动处理冲突${NC}"
    exit 1
fi
git push origin main || {
    echo -e "${RED}公开仓库推送失败${NC}"
    exit 1
}

echo -e "${GREEN}自动推送完成！${NC}" 