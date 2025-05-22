import path from 'path';
import fs from 'fs';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import type { GetStaticProps } from 'next';

const sections = [
  { id: 'home', title: '首页' },
  { id: 'vision', title: '使命与愿景' },
  { id: 'projects', title: '创新项目' },
  { id: 'tech', title: '技术理念' },
  { id: 'join', title: '加入我们' },
  { id: 'contact', title: '联系我们' },
];

function splitSections(md: string) {
  const result: { id: string; content: string }[] = [];
  let lastIndex = 0;
  for (let i = 1; i < sections.length; i++) {
    const cur = md.indexOf(`### ${sections[i].title}`, lastIndex);
    result.push({
      id: sections[i - 1].id,
      content: md.slice(lastIndex, cur === -1 ? undefined : cur),
    });
    lastIndex = cur;
  }
  result.push({ id: sections[sections.length - 1].id, content: md.slice(lastIndex) });
  return result;
}

function getRandomAnim() {
  const y = Math.random() * 60 - 30;
  const scale = 0.95 + Math.random() * 0.1;
  return {
    initial: { opacity: 0, y: y * 2, scale: scale * 0.9 },
    whileInView: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.9, type: 'spring', bounce: 0.35 } },
    viewport: { once: true, amount: 0.3 },
  };
}

export const getStaticProps: GetStaticProps = async () => {
  const markdownPath = path.join(process.cwd(), 'docs/website-content.md');
  const markdown = fs.readFileSync(markdownPath, 'utf-8');
  return {
    props: {
      markdown,
    },
  };
};

type Props = { markdown: string };

export default function Home({ markdown }: Props) {
  const sectionContents = splitSections(markdown);
  return (
    <div className="bg-gradient-to-b from-white to-blue-50 min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <span className="font-bold text-xl tracking-widest text-blue-700">Crealize</span>
          <div className="space-x-4">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </nav>
      <div className="h-16" /> {/* 占位 */}
      {/* 内容区块 */}
      <main className="flex-1">
        {sectionContents.map(sec => (
          <Section key={sec.id} id={sec.id} content={sec.content} />
        ))}
      </main>
      {/* 底部仿生流体动画 */}
      <footer className="relative h-40 w-full overflow-hidden mt-12">
        <FluidWave />
      </footer>
    </div>
  );
}

function Section({ id, content }: { id: string; content: string }) {
  const { ref } = useInView({ triggerOnce: true, threshold: 0.2 });
  const anim = getRandomAnim();
  return (
    <motion.section
      id={id}
      ref={ref}
      initial={anim.initial}
      whileInView={anim.whileInView}
      viewport={anim.viewport}
      className="max-w-3xl mx-auto px-4 py-16"
    >
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </motion.section>
  );
}

function FluidWave() {
  return (
    <motion.svg
      viewBox="0 0 1440 320"
      className="absolute bottom-0 left-0 w-full h-full"
      initial={{ y: 40 }}
      animate={{ y: [40, 0, 40], x: [0, 30, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <linearGradient id="wave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <motion.path
        fill="url(#wave)"
        fillOpacity="0.7"
        d="M0,160L60,170C120,180,240,200,360,197.3C480,195,600,169,720,154.7C840,140,960,138,1080,154.7C1200,171,1320,213,1380,234.7L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        animate={{
          d: [
            'M0,160L60,170C120,180,240,200,360,197.3C480,195,600,169,720,154.7C840,140,960,138,1080,154.7C1200,171,1320,213,1380,234.7L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z',
            'M0,180L60,160C120,140,240,180,360,200C480,220,600,200,720,180C840,160,960,140,1080,160C1200,180,1320,220,1380,240L1440,260L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z',
            'M0,160L60,170C120,180,240,200,360,197.3C480,195,600,169,720,154.7C840,140,960,138,1080,154.7C1200,171,1320,213,1380,234.7L1440,256L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
} 