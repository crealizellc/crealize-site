import React, { useRef } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { homeContent } from '../src/content/homeContent';
import { BrandHeroText } from '../src/components/BrandHeroText';
import AnimatedSandParticles from '../components/AnimatedSandParticles';


const AnimatedLinesBackground = dynamic(() => import('../components/AnimatedLinesBackground'), { ssr: false });

function BrandSlogan({ slogan }: { slogan: string[] }) {
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
      {slogan.map((word, i) => (
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
                color: `hsl(0, 0%, ${17 + ((53 - 17) * j) / (word.length - 1)}%)`,
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

function Section({ section }: { section: typeof homeContent.sections[0] }) {
  return (
    <section id={section.id} className="mb-10 md:mb-14 text-left w-full max-w-3xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.7 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="mb-4"
      >
        <BrandHeroText text={section.title} size="3em" nowrap />
      </motion.div>
      <ul className="pl-0 ml-0 text-left list-none text-gray-700 text-base sm:text-lg leading-[1] break-words whitespace-normal max-w-full" style={{ listStyle: 'none', paddingLeft: 0 }}>
        {section.content.map((line, i) => (
          <motion.li
            key={i}
            className="break-words whitespace-normal max-w-full"
            style={{ listStyle: 'none' }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 0.5, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
          >
            {line}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Head>
        <title>{homeContent.seo.title}</title>
        <meta name="description" content={homeContent.seo.description} />
      </Head>
      <div className="relative min-h-screen bg-white overflow-x-hidden">
        <AnimatedLinesBackground />
        {/* 顶部Logo+品牌名 水平居左上角对齐 */}
        <div className="w-full flex flex-row items-baseline justify-start pt-4 pb-1 pl-8 whitespace-nowrap z-10 relative">
          <Image
            src={homeContent.logo.src}
            alt={homeContent.logo.alt}
            width={homeContent.logo.width}
            height={homeContent.logo.height}
            priority
            style={{
              height: homeContent.logo.height,
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
            {homeContent.brandName}
          </span>
        </div>
        <div ref={contentRef} className="relative z-10 w-full max-w-[480px] mx-auto px-6 sm:px-10 md:px-16 lg:px-32 pt-12 sm:pt-20 pb-12 sm:pb-20">
          <div className="relative z-10">
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <BrandSlogan slogan={homeContent.slogan} />
            </div>
            {/* 你可以在这里插入首页副标题或描述 */}
            {/* <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-12">{homeContent.sloganDesc}</p> */}
            {homeContent.sections.map((sec) => (
              <Section section={sec} key={sec.id} />
            ))}
          </div>
        </div>
        <AnimatedSandParticles />
      </div>
    </>
  );
} 