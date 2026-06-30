import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mail, Lock, User, ArrowRight, Chrome, ChevronLeft } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    if (mode === 'signup' && !name) {
      setError('Name is required for registration.');
      return;
    }

    if (mode !== 'forgot' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccess('Password reset instructions have been dispatched to your email.');
      }
    } catch (err: any) {
      let msg = err.message || 'An authentication error occurred.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password combination.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'The email address format is invalid.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-6 relative font-sans">
      {/* Aurora Ambient Background Flow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[130px] animate-aurora" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/3 blur-[130px] animate-aurora" style={{ animationDelay: '-8s' }} />
      </div>

      {/* Back to landing */}
      <motion.button 
        onClick={onBack}
        className="absolute top-6 left-6 text-ink-muted hover:text-ink flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-all z-10 cursor-pointer"
        whileHover={{ x: -2 }}
      >
        <ChevronLeft className="w-4 h-4 text-accent" />
        <span>Return</span>
      </motion.button>

      <motion.div
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 120, damping: 15 }}
      >
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center border border-ink-faint shadow-md"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              <Sparkles className="w-5 h-5 text-bg" />
            </motion.div>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-ink uppercase">
            {mode === 'signin' && 'Partner Sign In'}
            {mode === 'signup' && 'Register Account'}
            {mode === 'forgot' && 'Reset Credential'}
          </h2>
          <p className="text-ink-muted text-xs font-mono uppercase tracking-wider">
            {mode === 'signin' && 'Access your personalized AI executive workstation.'}
            {mode === 'signup' && 'Establish your secure, executive workspace.'}
            {mode === 'forgot' && 'Supply your email to receive recovery instructions.'}
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-300 text-xs text-center font-sans"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div 
                className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-300 text-xs text-center font-sans"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block font-mono">Security Password</label>
                  {mode === 'signin' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[10px] font-bold text-accent hover:underline font-mono transition-all"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full glass-input rounded-xl py-3 pl-11 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent font-sans text-ink"
                  />
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 text-bg rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 mt-4 shadow-md font-sans cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{loading ? 'Processing...' : mode === 'signin' ? 'Workstation Log In' : mode === 'signup' ? 'Create Workstation' : 'Send Instructions'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5 text-bg" />}
            </motion.button>
          </form>

          {/* Social Sign In (Only for Login/Signup screens) */}
          {mode !== 'forgot' && (
            <div className="space-y-4 pt-2">
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-ink-faint" />
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-ink-muted tracking-wider font-mono">Or Connect with</span>
                <div className="flex-grow border-t border-ink-faint" />
              </div>

              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 bg-bg hover:bg-ink-faint border border-ink-faint text-ink rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2.5 font-sans cursor-pointer"
                whileHover={{ scale: 1.01, borderColor: 'var(--accent)' }}
                whileTap={{ scale: 0.99 }}
              >
                <Chrome className="w-4 h-4 text-accent" />
                <span>Google Enterprise Sign In</span>
              </motion.button>
            </div>
          )}

          {/* Toggle Screen Mode */}
          <div className="text-center pt-2">
            {mode === 'signin' && (
              <p className="text-ink-muted text-xs font-sans">
                Need an account?{' '}
                <button 
                  onClick={() => setMode('signup')}
                  className="font-bold text-accent hover:underline font-sans transition-all"
                >
                  Create Workstation
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p className="text-ink-muted text-xs font-sans">
                Already registered?{' '}
                <button 
                  onClick={() => setMode('signin')}
                  className="font-bold text-accent hover:underline font-sans transition-all"
                >
                  Partner Sign In
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button 
                onClick={() => setMode('signin')}
                className="text-xs font-bold text-accent hover:underline font-sans transition-all"
              >
                Return to Login
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
