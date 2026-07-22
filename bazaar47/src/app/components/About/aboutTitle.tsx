'use client'

import { motion } from 'framer-motion'
import { Reem_Kufi } from 'next/font/google'

const reemKufi = Reem_Kufi({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
})

export function AboutTitle() {
  return (
    <div
      className="relative w-full"
      style={{
        backgroundColor: '#EFEADE',
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end pt-10 md:pt-14 pb-6 md:pb-8 border-b border-[#341B1C]/15">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="font-host-grotesk font-bold text-[32px] sm:text-[40px] md:text-[48px] lg:text-[58px] leading-[108%] tracking-normal text-[#341B1C] text-center md:text-left"
          >
            About Bazaar47
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className={`${reemKufi.className} font-bold text-[22px] sm:text-[26px] md:text-[32px] lg:text-[38px] leading-[140%] tracking-normal text-[#341B1C] mt-2 md:mt-0 text-center md:text-right`}
            dir="rtl"
          >
            كيْف بَلَشَتْ حِكَايَتنَا
          </motion.div>
        </div>
      </div>
    </div>
  )
}