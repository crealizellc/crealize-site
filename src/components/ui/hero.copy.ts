export type Copy = { title: string; subtitle: string };
export const heroCopy: Record<'en'|'ja'|'zh-TW', Copy> = {
  en: {
    title: 'Transforming Imagination into Reality',
    subtitle: 'Data‑driven, staged delivery for Web3 × Gamification × AI — ship fast, validate in the market, iterate by metrics.'
  },
  ja: {
    title: '想像を現実へ',
    subtitle: 'Web3 × ゲーミフィケーション × AI をデータ起点で段階的に実装。素早く公開し、実運用データで磨き込みます。'
  },
  'zh-TW': {
    title: '把想像變成現實',
    subtitle: '以數據驅動的分階段交付，專注 Web3 × 遊戲化 × AI。先上線、先驗證，再用指標推進。'
  }
};


