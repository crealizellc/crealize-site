#!/bin/bash
set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

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

# 2. 推送到公开仓库 (crealize)
echo -e "${GREEN}推送到公开仓库...${NC}"
# 假设 ../crealize-public/ 为公开仓库目录
if [ ! -d "../crealize-public" ]; then
    echo -e "${RED}公开仓库目录不存在，请先克隆仓库${NC}"
    exit 1
fi

# 同步公开内容
rsync -av --delete \
    README.md \
    docs/ \
    public/ \
    src/app/ \
    ../crealize-public/ || {
    echo -e "${RED}同步公开内容失败${NC}"
    exit 1
}

# 提交并推送公开仓库
cd ../crealize-public/
git add .
git commit -m "chore: 发布公开版" || {
    echo -e "${RED}公开仓库提交失败${NC}"
    exit 1
}
git push origin main || {
    echo -e "${RED}公开仓库推送失败${NC}"
    exit 1
}

echo -e "${GREEN}自动推送完成！${NC}" 