import { useEffect, useRef, useState, memo, useCallback } from 'react'
import { motion, useAnimation, cubicBezier } from 'framer-motion'

/**
 * 标题分割线组件
 * 
 * 当标题进入视口中间1/3区域时，在标题下方显示一个与标题等宽的分割线
 * 分割线会随着标题的进入和离开平滑地展开和收起
 * 
 * @component
 * @example
 * ```tsx
 * <TitleDivider>
 *   创新项目
 * </TitleDivider>
 * ```
 */
interface TitleDividerProps {
  /** 标题内容 */
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
}

// 动画配置
const easeEnter = cubicBezier(0.4, 0, 0.2, 1)
const easeExit = cubicBezier(0.4, 0, 1, 1)
const ANIMATION_CONFIG = {
  enter: {
    duration: 0.5,
    ease: easeEnter,
  },
  exit: {
    duration: 0.3,
    ease: easeExit,
  }
}

export const TitleDivider = memo<TitleDividerProps>(({ children, className = '' }) => {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleWidth, setTitleWidth] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const controls = useAnimation()

  const updateWidth = useCallback(() => {
    if (titleRef.current) {
      const width = titleRef.current.getBoundingClientRect().width
      console.log('Title width:', width)
      setTitleWidth(width)
      if (isVisible) {
        controls.set({ width: width })
      }
    }
  }, [controls, isVisible])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('Intersection:', entry.isIntersecting)
          setIsVisible(entry.isIntersecting)
          if (entry.isIntersecting) {
            controls.start({
              width: titleWidth,
              opacity: 1,
              transition: ANIMATION_CONFIG.enter
            })
          } else {
            controls.start({
              width: 0,
              opacity: 0,
              transition: ANIMATION_CONFIG.exit
            })
          }
        })
      },
      {
        root: null,
        rootMargin: '-33% 0px -33% 0px',
        threshold: 0
      }
    )

    if (titleRef.current) {
      observer.observe(titleRef.current)
      updateWidth()
    }

    window.addEventListener('resize', updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [controls, isVisible, updateWidth])

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <h2 
        ref={titleRef} 
        className="text-3xl mb-4 font-bold tracking-tight"
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          letterSpacing: '-0.02em'
        }}
      >
        {children}
      </h2>
      <motion.div
        className="h-[2px] bg-black"
        initial={{ width: 0, opacity: 0 }}
        animate={controls}
        style={{ 
          marginTop: '0.5rem',
          transformOrigin: 'center',
          willChange: 'width, opacity',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  )
})

TitleDivider.displayName = 'TitleDivider' 