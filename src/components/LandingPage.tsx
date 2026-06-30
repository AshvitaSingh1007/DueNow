import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mic } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#F8F7F4] flex flex-col justify-between overflow-hidden font-sans selection:bg-[#FF4D00] selection:text-[#0B0B0C]">
      
      {/* Main Grid: Split visual vs content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] border-b border-[#F8F7F4]/10 min-h-0">
        
        {/* Left Visual Area - Interactive Orb */}
        <div 
          className="relative min-h-[300px] lg:min-h-0 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#F8F7F4]/10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(248, 247, 244, 0.1) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4D00]/5 via-transparent to-[#FF4D00]/2 pointer-events-none" />
          
          <div className="relative flex items-center justify-center">
            {/* Interactive Outer Rings */}
            <motion.div 
              className="absolute w-[360px] h-[360px] border border-[#F8F7F4]/10 rounded-full pointer-events-none"
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute w-[240px] h-[240px] border border-[#F8F7F4]/10 rounded-full pointer-events-none"
              animate={{ scale: [1.05, 0.95, 1.05], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Soft Ambient Glow Under the Orb */}
            <div className="absolute w-[160px] h-[160px] bg-[#FF4D00]/30 rounded-full blur-[60px] pointer-events-none" />

            {/* Glowing Interactive Core Orb */}
            <motion.div 
              onClick={onStart}
              className="w-[120px] h-[120px] bg-[#FF4D00] rounded-full shadow-[0_0_80px_#FF4D00] relative z-10 cursor-pointer flex items-center justify-center group"
              whileHover={{ scale: 1.08, shadow: '0 0 100px #FF4D00' }}
              whileTap={{ scale: 0.95 }}
              animate={{ 
                scale: [1, 1.04, 1],
                boxShadow: ['0 0 60px #FF4D00', '0 0 90px #FF4D00', '0 0 60px #FF4D00']
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              {/* Pulsing microphone inside core for micro-interaction */}
              <Mic className="w-5 h-5 text-[#0B0B0C] opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
            </motion.div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-gradient-to-b from-transparent to-[#FF4D00]/[0.02] relative">
          <div className="max-w-[340px] mx-auto w-full space-y-8">
            
            {/* Tactical Meta Label */}
            <div className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#FF4D00] uppercase flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#FF4D00]" />
              SYSTEM STATUS: INITIATED
            </div>

            {/* Premium Syne Display Typography Heading */}
            <h2 className="font-display font-black text-5xl sm:text-6xl tracking-tight leading-[0.9] text-[#F8F7F4] uppercase">
              "Hi, I'm <span className="text-[#FF4D00]">DueNow.</span>"
            </h2>

            {/* High fidelity intro paragraph */}
            <p className="text-[#F8F7F4]/60 text-sm font-light leading-relaxed font-sans">
              I will serve as your Voice-First AI Executive Companion. Before we sync your workstation files and calculate success probability curves, I want to learn about your goals.
            </p>

            {/* Action Trigger Button */}
            <motion.button
              onClick={onStart}
              className="w-full p-5 bg-[#F8F7F4] text-[#0B0B0C] hover:bg-[#F8F7F4]/95 border-none font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-between rounded-[2px] cursor-pointer shadow-lg hover:shadow-xl transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span>Begin Configuration</span>
              <ArrowRight className="w-4 h-4 text-[#0B0B0C]" />
            </motion.button>
          </div>
        </div>

      </div>

      {/* Grid Coordinates Monospace Footer */}
      <footer className="p-4 sm:p-6 lg:px-12 flex justify-between items-center font-mono text-[9px] sm:text-[10px] text-[#F8F7F4]/20 tracking-wider uppercase">
        <div>DN-EXEC // PROTOCOL 01</div>
        <div className="text-right">COORDINATES: 40.7128° N, 74.0060° W</div>
      </footer>

    </div>
  );
};
