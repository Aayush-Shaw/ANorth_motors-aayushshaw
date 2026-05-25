import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalPreloader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide the preloader after a set time or when the main app signals it's ready.
    // For now, we'll use a 2.5 second cinematic delay.
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Ambient Light */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-[#D4AF37] rounded-full blur-[100px] opacity-10 animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Spinning Wheel Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.2)] p-2"
            >
              <motion.img 
                src="/full_luxury_wheel_with_tyre_1777282790829.png"
                className="w-full h-full object-contain rounded-full drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            {/* Typography */}
            <div className="flex flex-col items-center text-center">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="text-white font-heading font-bold text-3xl md:text-4xl tracking-tighter"
              >
                AUTONORTH <span className="text-[#D4AF37]">MOTORS</span>
              </motion.h1>
              <motion.p 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                className="text-white/40 font-body text-xs md:text-sm tracking-[0.3em] uppercase mt-2"
              >
                Premium Vehicles
              </motion.p>
            </div>
          </div>
          
          {/* Loading Bar */}
          <motion.div 
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div 
              className="h-full bg-[#D4AF37]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
