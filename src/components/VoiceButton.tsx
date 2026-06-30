import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const VoiceButton: React.FC = () => {
  const { isListening, isProcessing, isSpeaking, audioLevel, startListening, stopListening } = useVoice();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-bg/40 backdrop-blur-md border border-ink-faint rounded-3xl">
      <div className="relative">
        {/* Pulsing halo rings when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 bg-accent rounded-full opacity-20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 bg-accent rounded-full opacity-10"
              animate={{ scale: [1, 2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative z-10 flex items-center justify-center w-28 h-28 rounded-full shadow-2xl transition-all duration-300 outline-none select-none cursor-pointer ${
            isListening
              ? 'bg-accent text-white'
              : isProcessing
              ? 'bg-ink-faint text-ink-muted'
              : isSpeaking
              ? 'bg-emerald-600 text-white animate-pulse'
              : 'bg-accent/95 text-white hover:bg-accent active:scale-95'
          }`}
          style={{
            transform: isListening ? `scale(${1 + audioLevel / 300})` : 'scale(1)'
          }}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          ) : isListening ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : isSpeaking ? (
            <Volume2 className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-ink font-sans">
          {isListening
            ? 'Listening to you...'
            : isProcessing
            ? 'Analyzing your request...'
            : isSpeaking
            ? 'Speaking...'
            : 'Tap to speak to DueNow'}
        </p>
        <p className="text-xs text-ink-muted mt-1 font-light font-mono uppercase tracking-wider">
          Push-to-Talk • Conversational AI Executive
        </p>
      </div>
    </div>
  );
};
