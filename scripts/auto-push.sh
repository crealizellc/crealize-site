#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

# 获取公开仓库地址（修正为当前目录）
PUBLIC_REPO=$(node -p "require('./package.json').crealizePublicRepo")
PUBLIC_DIR="../crealize-public"

echo -e "${GREEN}开始自动推送流程...${NC}"

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

# 同步公开内容
rsync -av --delete \
    README.md \
    docs/ \
    public/ \
    src/app/ \
    "$PUBLIC_DIR" || {
    echo -e "${RED}同步公开内容失败${NC}"
    exit 1
}

# 提交并推送公开仓库
cd "$PUBLIC_DIR"
git add .
git commit -m "chore: 发布公开版" || true
# 推送前自动暂存所有本地变更，确保 pull --rebase 不被阻断
if ! git diff --quiet || ! git diff --cached --quiet; then
    git add .
    git commit -m "chore: 自动暂存本地变更" || true
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