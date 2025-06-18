import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BrandHeroText } from '../src/components/BrandHeroText';
import AnimatedSandParticles from '../components/AnimatedSandParticles';
import { ContactForm } from '../src/components/ContactForm';

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
      '标题：社群導向的創作者交易平台',
      '智能合約 × 第三方 KYC，打造可信賴交易環境',
      '結合區塊鏈智能合約與合規身份驗證（KYC）機制，確保交易雙方資訊透明、流程安全。',
      '按讚與關注，即可影響市場價格',
      '粉絲的每一次按讚與關注，將轉化為可量化的價值指標，直接影響創作者在平台上的估值與股權價格。',
      '開放式評價系統 × 社群共治機制',
      '評價權開放給所有社群成員參與，避免黑箱操作，建立透明、公正的社群治理模式。',
      '投票參與決策，影響創作者市值',
      '用戶可透過投票表達支持，進一步形塑創作者的市值與曝光機會，讓粉絲參與不僅有感，更具影響力。',
      '手續費回饋 × 粉絲經濟閉環',
      '每一筆交易產生的部分手續費，將回饋給對應的創作者，促進創作者與粉絲之間的雙向成長與長期連結。',
      '平台合規進行中',
      '目前平台已在新加坡進行合規審查，積極配合法規，以確保日後的國際化營運穩健合法。',
      '标题：GameFi 策略遊戲：Mars2049',
      'Play-to-Earn 遊戲機制 × 區塊鏈資產經濟',
      '結合建設、探索與競爭玩法，讓玩家透過遊戲任務賺取虛擬資產，實現娛樂與收益並進。',
      'Telegram Mini App 全球封測進行中',
      '目前主打遊戲《Mars2049》已於 Telegram Mini App 上開啟全球封測：',
      '官方網站：https://www.mars2049.online/',
      '體驗入口：https://t.me/Mars2049_Bot/Mars2049?startapp=1ARn69BN',
      '無須下載，即點即玩，為全球玩家提供輕量流暢的上手體驗。',
      '未來導入代幣經濟 × 多鏈資產擴展',
      '遊戲預計將推出專屬代幣，並支援多鏈資產互通，擴展整體經濟體系與收藏價值。',
      '标题：AI 虛擬影響者與社群經營工具',
      '整合 x.com API，掌握最新社群脈動',
      'AI 將即時擷取來自 x.com（前 Twitter）的熱搜趨勢與新聞內容，助你快速掌握話題走向。',
      '自動生成評論 × 精準行銷建議',
      '搭載自然語言處理模型，可為品牌與社群主提供個性化、即時的行銷文案與互動建議。',
      'AI 音樂人 × 聲音角色虛擬化',
      '透過語音合成與 AI 編曲技術，生成虛擬創作者形象，支援演唱、發言與互動應對。',
      '企業代言人 × 社群操盤角色',
      '這些 AI 虛擬角色不僅是工具，更能作為品牌的代表，參與行銷推廣與社群活動，成為企業專屬的虛擬資產與數位人物形象。',
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
      'AI 多語翻譯系統：善用 Google Apps Script 搭配 GPT搭建入門後台',
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
      '我們歡迎工程師、設計師、PM、創意人、遊戲製作人、Web3 領域專才',
    ],
  },
  {
    id: 'contact',
    title: 'CONTACT',
    content: [
      'Company Name: Crealize合同会社 (Crealize LLC)',
      'Established: October 9, 2024',
      'Bank: MIZUHO Bank',
      'Founder: Yves CHEN',
      'Registered Address:',
      'B-5, Shibuya Bridge,',
      '2-9-3, Higashi 1-Chome,',
      'Shibuya-ku, Tokyo 150-0011, Japan',
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
      <div ref={contentRef} className="relative z-10 w-full max-w-[480px] mx-auto px-6 sm:px-10 md:px-16 lg:px-32 pt-12 sm:pt-20 pb-12 sm:pb-20" style={{ minHeight: '100vh' }}>
        <div className="relative z-10">
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <BrandHeroText text="Transforming Imagination into Reality" size="4.5em" multiline nowrap />
          </div>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-12">
            以 Web3 × 遊戲化 × AI 技術，重新定義創意落地的可能性。
          </p>
          {sections.map((sec, idx) => (
            <Section section={sec} idx={idx} key={sec.id} />
          ))}
        </div>
      </div>
      {/* 紅色canvas測試條已移除，恢復動畫組件 */}
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
    'Play-to-Earn 機制 × 區塊鏈資產',
  ];
  return (
    <section id={section.id} className="mb-10 md:mb-14 text-left w-full">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="mb-4"
      >
        <BrandHeroText text={section.title} size="3em" nowrap />
      </motion.div>
      <ul className="pl-0 ml-0 text-left list-disc text-gray-700 text-base sm:text-lg leading-[1] break-words whitespace-normal max-w-full">
        {section.content.map((line, i) => {
          let clean = line.trim();
          // Founder: Yves CHEN 行加 Telegram 連結
          if (section.id === 'contact' && clean === 'Founder: Yves CHEN') {
            return (
              <motion.li
                key={i}
                className="break-words whitespace-normal max-w-full"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.7 }}
                transition={{ duration: 0.5, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
              >
                Founder: Yves CHEN
                <a
                  href="https://t.me/yveschen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-blue-600 underline hover:text-blue-800 transition"
                  style={{fontSize:'0.95em'}}
                >
                  @yveschen
                </a>
              </motion.li>
            );
          }
          // 其餘內容全部正常渲染
          return (
            <motion.li
              key={i}
              className="break-words whitespace-normal max-w-full"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
            >
              {clean}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
} 