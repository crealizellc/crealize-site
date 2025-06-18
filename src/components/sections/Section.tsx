import { type FC, memo } from 'react'
import { motion } from 'framer-motion'
import { TitleDivider } from '../ui/TitleDivider'

/**
 * 页面分区组件
 * 
 * 用于创建页面的主要分区，包含标题和内容区域
 * 标题下方会显示动态分割线，内容区域有淡入动画效果
 * 
 * @component
 * @example
 * ```tsx
 * <Section id="projects" title="创新项目">
 *   <div>项目内容</div>
 * </Section>
 * ```
 */
interface SectionProps {
  /** 分区ID，用于导航锚点 */
  id: string
  /** 分区标题 */
  title: string
  /** 分区内容 */
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
}

// 动画配置
const CONTENT_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
}

export const Section = memo<SectionProps>(({ id, title, children, className = '' }) => {
  return (
    <section id={id} className={`py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <TitleDivider>
            {title}
          </TitleDivider>
        </div>
        <motion.div
          {...CONTENT_ANIMATION}
          viewport={{ once: true }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  )
})

Section.displayName = 'Section' 