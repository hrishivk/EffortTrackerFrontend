import { motion, type Variants } from 'framer-motion'
import { type ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
}

const variants: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
}

const PageWrapper = ({ children }: PageWrapperProps) => {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  )
}

export default PageWrapper
