import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BrandHeroText } from '../src/components/BrandHeroText';
import AnimatedSandParticles from '../components/AnimatedSandParticles';

const AnimatedLinesBackground = dynamic(() => import('../components/AnimatedLinesBackground'), { ssr: false });

const sections = [
  {
    id: 'vision',
    title: 'VISION',
    content: [
      '把創意轉化為現實',
      'Crealize 是由 "Creative" × "Realize" 所組成的名字',
      '「創意若不被實現，只是空談。」',
      '擅長將點子從 0 執行至 1，經過驗證、反覆打磨，最終變為可觸及的數位產品',
      'Web3 × 遊戲化 × AI × 價值網路',
    ],
  },
  {
    id: 'projects',
    title: 'PROJECTS',
    content: [
      '🎨 藝術品交易平台',
      '智能合約與第三方 KYC 確保信賴',
      '用讚與關注決定市場價格',
      '評價系統透明開放，由社群共同參與',
      '',
      '🌟 偶像與創作者股交易平台',
      '投票即是支持，影響「市值」',
      '交易活動回饋手續費予偶像',
      '正在新加坡進行合規審查',
      '',
      '🪙 MARS2049：火星殖民 × GameFi',
      'Build-to-Earn 機制 × 區塊鏈資產',
      'Telegram Mini App 全球封測中',
      '未來支援 NFT 與多鏈互通',
      '',
      '🤖 AI 虛擬影響者',
      '與 x.com API 整合，擷取趨勢新聞',
      '自動生成評論建議',
      '將可作為企業代言人或社群操盤角色',
    ],
  },
  {
    id: 'tech',
    title: 'TECH PHILOSOPHY',
    content: [
      '去中心化 × 前端驅動',
      '低維運、高穩定、可擴展',
      '靜態前端部署實現零伺服器、零維護費',
      '區塊鏈整合，實現去中心化身份驗證與資產管理',
      'AI 多語翻譯系統：使用 Google Apps Script 搭配 GPT',
      '低成本、高自由的開發模型',
    ],
  },
  {
    id: 'join',
    title: 'JOIN US',
    content: [
      '全球招募中，支援全遠端工作',
      '總部設於東京',
      '完全自由的工作環境，專注成果，不看打卡',
      '我們歡迎工程師、設計師、PM、創意人、遊戲製作人、法務、Web3 領域專才',
    ],
  },
  {
    id: 'contact',
    title: 'CONTACT',
    content: [
      'Crealize合同会社（Crealize LLC）',
      '成立時間：2024年10月9日',
      '創辦人：Yves CHEN',
      '銀行：瑞穗銀行（Mizuho Bank）',
      '地址：東京都澀谷區東1丁目2-9-3',
      'Shibuya Bridge B-5（Shibuya Startup Support 提供）',
      '工作地點：東京 + 全球遠端團隊（台灣、新加坡、杜拜、倫敦）',
      '📩 歡迎來信洽談商業合作、媒體訪問、技術諮詢或加入團隊。',
      '👉 網站底部附有表單可直接聯繫我們。',
    ],
  },
];

function getGradientColor(idx: number, total: number, start = 17, end = 53) {
  // 17=#111, 53=#888，最浅也很清晰
  const light = Math.round(start + ((end - start) * idx) / (total - 1));
  return `hsl(0, 0%, ${light}%)`;
}

function BrandSlogan() {
  const sloganWords = ['Transforming', 'Imagination', 'into', 'Reality'];
  return (
    <div style={{
      fontSize: '4.5em',
      fontWeight: 900,
      letterSpacing: 0,
      lineHeight: 1,
      marginBottom: '0.2em',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    }}>
      {sloganWords.map((word, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * 0.12,
            duration: 0.3,
            type: 'spring',
          }}
          style={{
            display: 'block',
            marginBottom: '-0.18em',
            wordBreak: 'keep-all',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'clip',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {word.split('').map((char, j) => (
            <span
              key={j}
              style={{
                color: getGradientColor(j, word.length),
                fontWeight: 900,
                display: 'inline-block',
                marginRight: j < word.length - 1 ? '-0.06em' : 0,
              }}
            >
              {char}
            </span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    function updateHeight() {
      if (contentRef.current) setContentHeight(contentRef.current.offsetHeight);
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <>
      {/* 顶部Logo+品牌名 水平居左上角对齐 */}
      <div className="w-full flex flex-row items-baseline justify-start pt-4 pb-1 pl-8 whitespace-nowrap">
        <Image
          src="/image/Crealizelogo1.png"
          alt="Crealize Logo"
          width={90}
          height={48}
          priority
          style={{
            height: 48,
            width: 'auto',
            display: 'inline-block',
            verticalAlign: 'baseline',
            marginBottom: 0,
          }}
        />
        <span
          className="font-brand ml-4 leading-[1] align-baseline relative"
          style={{
            fontSize: '1.75rem',
            top: '8px',
            display: 'inline-block',
            verticalAlign: 'baseline',
          }}
        >
          Crealize
        </span>
      </div>
      <div ref={contentRef} className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8" style={{ minHeight: '100vh', paddingTop: '50px', paddingBottom: '50px' }}>
        <div className="relative z-10">
          <BrandHeroText text="Transforming Imagination into Reality" size="4.5em" multiline />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-12">
            以 Web3 × 遊戲化 × AI 技術，重新定義創意落地的可能性。
          </p>
          {sections.map((sec, idx) => (
            <Section section={sec} idx={idx} key={sec.id} />
          ))}
          <div id="contact-anchor" className="w-full flex justify-center mt-16 mb-2">
            <a href="#" className="px-6 py-3 rounded-full bg-black text-white text-base font-semibold shadow hover:bg-gray-800 transition">联系我们</a>
          </div>
        </div>
      </div>
      {/* 红色canvas测试条已移除，恢复动画组件 */}
      <AnimatedLinesBackground />
      <AnimatedSandParticles />
    </>
  );
}

function Section({ section, idx }: { section: typeof sections[0]; idx: number }) {
  // 小标题关键词
  const subTitles = [
    '把創意轉化為現實',
    '藝術品交易平台',
    '偶像與創作者股交易平台',
    'MARS2049：火星殖民 × GameFi',
    'AI 虛擬影響者',
    '去中心化 × 前端驅動',
    '全球招募中，支援全遠端工作',
    'Crealize合同会社（Crealize LLC）',
  ];
  return (
    <section id={section.id} className="mb-10 md:mb-14 text-left w-full">
      <BrandHeroText text={section.title} size="2.2em" />
      <ul className="list-none pl-0 space-y-3 text-gray-700 text-base sm:text-lg leading-relaxed">
        {section.content.map((line, i) => {
          // 去除 emoji
          let clean = line.replace(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\uFE0F]|[\u200D]|[\u2190-\u21FF]|[\u2300-\u23FF]|[\u25A0-\u25FF]|[\u2600-\u26FF]|[\u2700-\u27BF]|[\u2B50-\u2BFF]|[\u1F300-\u1F5FF]|[\u1F600-\u1F64F]|[\u1F680-\u1F6FF]|[\u1F700-\u1F77F]|[\u1F780-\u1F7FF]|[\u1F800-\u1F8FF]|[\u1F900-\u1F9FF]|[\u1FA00-\u1FA6F]|[\u1FA70-\u1FAFF]|[\u1FB00-\u1FBFF]|[\u1FC00-\u1FCFF]|[\u1FD00-\u1FDFF]|[\u1FE00-\u1FEFF]|[\u1FF00-\u1FFFF]|[\u2000-\u206F]|[\u2190-\u21FF]|[\u2300-\u23FF]|[\u25A0-\u25FF]|[\u2600-\u26FF]|[\u2700-\u27BF]|[\u2B50-\u2BFF]|[\u1F004]|[\u1F0CF]|[\u1F170-\u1F251]|[\u1F300-\u1F5FF]|[\u1F600-\u1F64F]|[\u1F680-\u1F6FF]|[\u1F700-\u1F77F]|[\u1F780-\u1F7FF]|[\u1F800-\u1F8FF]|[\u1F900-\u1F9FF]|[\u1FA00-\u1FA6F]|[\u1FA70-\u1FAFF]|[\u1FB00-\u1FBFF]|[\u1FC00-\u1FCFF]|[\u1FD00-\u1FDFF]|[\u1FE00-\u1FEFF]|[\u1FF00-\u1FFFF])+/g, '').trim();
          // 小标题渲染
          if (subTitles.includes(clean)) {
            // 品牌字特殊处理
            if (clean === 'Crealize合同会社（Crealize LLC）') {
              // Crealize 用品牌字 class
              const brand = <span className="font-brand">Crealize</span>;
              const rest = '合同会社（Crealize LLC）'.replace('Crealize', '');
              return (
                <li key={i} style={{ listStyle: 'none', margin: '1.2em 0' }}>
                  <BrandHeroText text="" size="1.5em" />
                  <span style={{ fontSize: '1.5em', fontWeight: 900 }}>
                    {brand}{rest}
                  </span>
                </li>
              );
            }
            return (
              <li key={i} style={{ listStyle: 'none', margin: '1.2em 0' }}>
                <BrandHeroText text={clean} size="1.5em" />
              </li>
            );
          }
          // 空行
          if (clean === '') return <li key={i} className="h-2" />;
          // 普通正文
          return <li key={i}>{clean}</li>;
        })}
      </ul>
    </section>
  );
} 