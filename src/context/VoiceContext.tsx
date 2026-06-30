import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface VoiceContextType {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  transcript: string;
  aiResponse: string;
  audioLevel: number; // 0-100 for waveform visualization
  startListening: () => void;
  stopListening: () => void;
  speakText: (text: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId, userProfile } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioIntervalRef = useRef<any>(null);

  useEffect(() => {
    // 1. Initialize Web Speech API Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
        // Start simulated waveform pulsing (Section 6.3)
        startAudioPulsing();
      };

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(finalTranscript || interimTranscript);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      rec.onend = () => {
        setIsListening(false);
        clearInterval(audioIntervalRef.current);
        setAudioLevel(0);
        // Core Voice Flow: Automatically trigger AI processing on final transcript completion
        triggerAIProcessing();
      };

      recognitionRef.current = rec;
    }

    // 2. Initialize Text-to-Speech Synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      clearInterval(audioIntervalRef.current);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [userId, transcript]);

  const startAudioPulsing = () => {
    clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = setInterval(() => {
      // Create organic visual wave level
      setAudioLevel(Math.floor(Math.random() * 40) + 30);
    }, 100);
  };

  const startListening = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition already started:', e);
      }
    } else {
      // Sandbox text prompt simulation fallback
      const textPrompt = prompt('Speech recognition not supported in this frame. Say task:');
      if (textPrompt) {
        setTranscript(textPrompt);
        setIsProcessing(true);
        processUserInput(textPrompt);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    clearInterval(audioIntervalRef.current);
    setAudioLevel(0);
  };

  const triggerAIProcessing = () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    processUserInput(transcript);
  };

  const processUserInput = async (text: string) => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId || 'default-user-id'}`
        },
        body: JSON.stringify({
          input: text,
          inputType: 'voice',
          sessionId: `session-${Date.now()}`
        })
      });
      const data = await response.json();
      setAiResponse(data.aiResponse);
      setIsProcessing(false);

      // Programmatic vocal response back
      speakText(data.aiResponse);
    } catch (error) {
      console.error('AI Processing Error:', error);
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Apply voice tone properties if configured
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      isProcessing,
      isSpeaking,
      transcript,
      aiResponse,
      audioLevel,
      startListening,
      stopListening,
      speakText
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used inside VoiceProvider');
  return context;
};
