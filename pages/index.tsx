import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const AnimatedLinesBackground = dynamic(() => import('../components/AnimatedLinesBackground'), { ssr: false });

const sections = [
  {
    id: 'vision',
    title: '使命與願景 / VISION',
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
    title: '創新專案 / PROJECTS',
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
    title: '技術理念 / TECH PHILOSOPHY',
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
    title: '加入我們 / JOIN US',
    content: [
      '全球招募中，支援全遠端工作',
      '總部設於東京',
      '完全自由的工作環境，專注成果，不看打卡',
      '我們歡迎工程師、設計師、PM、創意人、遊戲製作人、法務、Web3 領域專才',
    ],
  },
  {
    id: 'contact',
    title: '聯絡我們 / CONTACT',
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
      <div className="w-full flex flex-row items-baseline justify-start pt-8 pb-2 pl-8 whitespace-nowrap">
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
      <div ref={contentRef} className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-8" style={{ minHeight: '100vh', paddingTop: '180px', paddingBottom: '180px' }}>
        <div className="relative z-10">
          <p className="text-xl sm:text-2xl text-gray-500 mb-8 leading-relaxed">
            Transforming Imagination into Reality
          </p>
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
    </>
  );
}

function Section({ section, idx }: { section: typeof sections[0]; idx: number }) {
  return (
    <section id={section.id} className="mb-10 md:mb-14 text-left w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 tracking-wide">
        {section.title}
      </h2>
      <ul className="list-none pl-0 space-y-3 text-gray-700 text-base sm:text-lg leading-relaxed">
        {section.content.map((line, i) =>
          line.trim() === '' ? <li key={i} className="h-2" /> : <li key={i}>{line}</li>
        )}
      </ul>
    </section>
  );
} 