'use client'

import { motion } from 'framer-motion'
// import Image from 'next/image'
// import flowers from '@/assets/newAssets/flowers.png'

interface AboutDescriptionProps {
  sentences: string[]
}

export function AboutDescription({ sentences }: AboutDescriptionProps) {
  return (
    <div className="relative w-full overflow-hidden py-6 sm:py-8 md:py-10 lg:py-12 bg-[#FFB0BC]">
      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-0 w-full px-2 sm:px-0">
          {sentences.map((sentence, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.3 }}
              viewport={{ once: true, margin: '-30px' }}
              className="font-host-grotesk font-regular text-[14px] sm:text-[15px] md:text-[16px] lg:text-[18px] leading-[130%] sm:leading-[125%] md:leading-[120%] tracking-normal text-[#6A2630] max-w-3xl mb-3 sm:mb-4 md:mb-5 drop-shadow-lg px-1"
            >
              {sentence}
            </motion.p>
          ))}
        </div>
        {/* <div className=''>
             <Image
                src={flowers}
                alt="Bazaar À La Carte Florida Tour"
                fill
                className="object-contain object-right"
                priority
              />
        </div> */}
      </div>
    </div>
  )
}