# 网站内容规划

## 网站结构

本项目采用单页面应用（SPA）架构，通过滚动和导航实现页面切换。

### 目录结构

```
src/
├── app/                    # 应用入口
│   ├── [locale]/          # 国际化路由
│   │   └── page.tsx       # 单页面应用主入口
│   └── layout.tsx         # 布局组件
├── components/            # 组件目录
│   ├── sections/         # 页面各部分组件
│   │   ├── Home.tsx      # 首页部分
│   │   ├── Vision.tsx    # 使命与愿景部分
│   │   ├── Projects.tsx  # 创新项目部分
│   │   ├── Tech.tsx      # 技术理念部分
│   │   ├── Join.tsx      # 加入我们部分
│   │   └── Contact.tsx   # 联系我们部分
│   ├── layout/           # 布局组件
│   │   ├── Header.tsx    # 顶部导航
│   │   └── Footer.tsx    # 底部信息
│   └── ui/               # UI组件
├── lib/                  # 工具函数
│   ├── twitter/          # Twitter API集成
│   ├── i18n/            # 国际化配置
│   └── google/          # Google Apps Script集成
├── styles/              # 样式文件
│   ├── globals.css      # 全局样式
│   └── animations.css   # 动画样式
└── types/               # 类型定义
```

### 页面组成

1. 首页 (Home)
2. 使命与愿景 (Vision)
3. 创新项目 (Projects)
4. 技术理念 (Tech Philosophy)
5. 加入我们 (Join Us)
6. 联系我们 (Contact)

### 导航结构

- 顶部固定导航栏
- 滚动到对应部分
- 平滑滚动效果
- 当前部分高亮显示

### URL结构

```
/                    # 首页
/#vision            # 使命与愿景
/#projects          # 创新项目
/#tech              # 技术理念
/#join              # 加入我们
/#contact           # 联系我们

/ja/                # 日语版本
/ja/#vision        # 日语版本-使命与愿景
/en/                # 英语版本
/en/#vision        # 英语版本-使命与愿景
```

### 技术实现

- 前端框架：Next.js 14
- 开发语言：TypeScript
- 样式方案：Tailwind CSS
- 动画系统：Framer Motion
- 部署平台：GitHub Pages
- 国际化：Google Apps Script + next-intl
- 表单处理：React Hook Form
- 图片优化：Next.js Image
- Twitter集成：Twitter API v2
- 自动化部署：GitHub Actions

### 动画实现

- 页面切换动画：使用Framer Motion的AnimatePresence
- 滚动动画：使用Framer Motion的useScroll和useTransform
- 悬停效果：使用Tailwind CSS的transition
- 加载动画：使用Framer Motion的motion组件

### 性能优化

- 组件懒加载
- 图片优化
- 动画性能优化
- 预加载关键资源
- 静态生成(SSG)
- 增量静态再生成(ISR)
- 资源预加载
- 代码分割

## 详细内容

### 1. 首页 (Home)

#### 主标题

- Crealize
- Transforming Imagination into Reality

#### 副标题

- 以 Web3 × 游戏化 × AI 技术，重新定义创意落地的可能性。
- 我们不只是构想未来，我们正在打造它。

### 2. 使命与愿景 (Vision)

#### 核心信息

- 把创意转化为现实
- Crealize 是由 "Creative" × "Realize" 所组成的名字

#### 核心理念

- 「创意若不被实现，只是空谈。」
- 擅长将点子从 0 执行至 1
- 经过验证、反复打磨，最终变为可触及的数字产品

#### 技术融合

- Web3
- 游戏化
- AI
- 价值网络

### 3. 创新项目 (Projects)

#### 艺术品交易平台

- 智能合约与第三方 KYC 确保信赖
- 用赞与关注决定市场价格
- 评价系统透明开放，由社群共同参与

#### 偶像与创作者股交易平台

- 投票即是支持，影响「市值」
- 交易活动回馈手续费予偶像
- 正在新加坡进行合规审查

#### MARS2049：火星殖民 × GameFi

- Build-to-Earn 机制 × 区块链资产
- Telegram Mini App 全球封测中
- 未来支持 NFT 与多链互通

#### AI 虚拟影响者

- 与 x.com API 整合，撷取趋势新闻
- 自动生成评论建议
- 将可作为企业代言人或社群操盘角色

### 4. 技术理念 (Tech Philosophy)

#### 设计理念

- 去中心化 × 前端驱动
- 低维运、高稳定、可扩展

#### 实践方式

- 静态前端部署实现零服务器、零维护费
- 区块链整合，实现去中心化身份验证与资产管理
- AI 多语翻译系统：使用 Google Apps Script 搭配 GPT
- 低成本、高自由的开发模型

### 5. 加入我们 (Join Us)

#### 工作环境

- 全球招募中，支持全远程工作
- 总部设于东京
- 完全自由的工作环境，专注成果，不看打卡

#### 人才需求

- 工程师
- 设计师
- PM
- 创意人
- 游戏制作人
- 法务
- Web3 领域专才

### 6. 联系我们 (Contact)

#### 公司信息

- 名称：Crealize合同会社（Crealize LLC）
- 成立时间：2024年10月9日
- 创办人：Yves CHEN
- 银行：瑞穗银行（Mizuho Bank）

#### 地址信息

- 地址：东京都涩谷区东1丁目2-9-3
- Shibuya Bridge B-5（Shibuya Startup Support 提供）

#### 工作地点

- 东京 + 全球远程团队
- 台湾、新加坡、杜拜、伦敦

#### 联系方式

- 网站底部表单
- 商业合作
- 媒体访问
- 技术咨询
- 加入团队

## 技术实现要点

### 1. 多语言支持

- 支持语言：日语/英语
- 实现方式：Google Apps Script + next-intl
- URL结构：`/[locale]/#section`
- 切换方式：顶部导航栏语言切换
- 内容管理：Google表单收集翻译内容
- 自动更新：定时触发Apps Script更新

### 2. 响应式设计

- 使用Tailwind CSS实现
- 断点设计：
  - 移动端：< 640px
  - 平板：640px - 1024px
  - 桌面：> 1024px
- 布局适配：
  - 移动端：单列布局
  - 平板：双列布局
  - 桌面：多列布局

### 3. 动画效果

- 页面切换：Framer Motion AnimatePresence
- 滚动动画：Framer Motion useScroll
- 悬停效果：Tailwind CSS transition
- 加载动画：Framer Motion motion组件

### 4. 表单处理

- 使用React Hook Form
- 表单验证
- 错误提示
- 提交状态管理
- 自动翻译

### 5. Twitter集成

- Twitter API v2
- 推文列表展示
- 推文交互
- 推文搜索
- 推文缓存
- 定时更新

### 6. 图片优化

- Next.js Image组件
- 自动格式转换
- 响应式图片
- 懒加载
- 占位图

### 7. SEO优化

- 静态生成(SSG)
- 增量静态再生成(ISR)
- Meta标签优化
- 结构化数据
- 多语言SEO
- 性能优化
