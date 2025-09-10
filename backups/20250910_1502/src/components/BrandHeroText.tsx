import { motion } from 'framer-motion';

function getGradientColor(idx: number, total: number, start = 17, end = 53) {
  const light = Math.round(start + ((end - start) * idx) / (total - 1));
  return `hsl(0, 0%, ${light}%)`;
}

export function BrandHeroText({
  text,
  size = '3.2em',
  delay = 0.12,
  multiline = false,
  nowrap = false,
  lineHeight = 1,
  plainColor,
  align = 'center',
}: {
  text: string;
  size?: string;
  delay?: number;
  multiline?: boolean;
  nowrap?: boolean;
  lineHeight?: number | string;
  plainColor?: string;
  align?: 'left' | 'center' | 'right';
}) {
  const words = multiline ? text.split(' ') : [text];
  function renderWord(word: string, i: number) {
    const regex = /(Crealize)/gi;
    const parts = word.split(regex);
    return (
      <motion.div
        key={`${text}-${i}`}
        whileInView={{ opacity: 1, x: 0 }}
        initial={{ opacity: 0, x: 60 }}
        transition={{ delay: i * delay, duration: 0.3, type: 'spring' }}
        viewport={{ once: false, amount: 0.33 }}
        style={{
          display: 'block',
          marginBottom: '-0.18em',
          wordBreak: nowrap ? 'keep-all' : 'break-word',
          whiteSpace: nowrap ? 'nowrap' : 'normal',
          overflow: nowrap ? 'hidden' : 'visible',
          textOverflow: 'clip',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {parts.map((part, j) => {
          if (part.toLowerCase() === 'crealize') {
            return (
              <span key={`${text}-brand-${i}-${j}`} className="font-brand" style={{ fontWeight: 900, letterSpacing: 0 }}>{part}</span>
            );
          }
          return part.split('').map((char, k, arr) =>
            char === ' ' ? (
              <span key={`${text}-${i}-${j}-${k}`} style={{ display: 'inline-block', width: '0.5em' }}>&nbsp;</span>
            ) : (
              <span
                key={`${text}-${i}-${j}-${k}`}
                style={{
                  color: plainColor ? plainColor : getGradientColor(k, arr.length),
                  fontWeight: 900,
                  display: 'inline-block',
                  marginRight: k < arr.length - 1 && arr[k + 1] !== ' ' ? '-0.06em' : 0,
                }}
              >
                {char}
              </span>
            )
          );
        })}
      </motion.div>
    );
  }
  const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'
  const textAlign = align
  return (
    <div style={{
      fontSize: size,
      fontWeight: 900,
      letterSpacing: 0,
      lineHeight: lineHeight,
      marginBottom: '0.2em',
      display: 'flex',
      flexDirection: 'column',
      alignItems: justify,
      textAlign,
      width: '100%'
    }}>
      {words.map(renderWord)}
    </div>
  );
} 