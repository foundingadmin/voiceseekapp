import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface IntroScreenProps {
  onStart: (email: string) => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.metaKey && e.key === 'Enter') {
        e.preventDefault();
        onStart('skip@voiceseek.dev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`https://api.hsforms.com/submissions/v3/integration/submit/242336861/04c01090-1b9d-4827-b4a5-9a4bf9971a58`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          fields: [
            {
              name: 'email',
              value: email
            },
            {
              name: 'lead_source',
              value: 'VoiceSeek App'
            }
          ],
          context: {
            hutk: document.cookie.match(/hubspotutk=(.*?);/)?.[1] || undefined,
            pageUri: window.location.href,
            pageName: 'VoiceSeek Quiz'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit to HubSpot');
      }

      onStart(email);
    } catch (err) {
      console.error('Error submitting to HubSpot:', err);
      setError('Failed to save your email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6"
    >
      <motion.div
        className="text-center max-w-lg"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-12">
          <img 
            src="/Founding-v1-Wordmark-white.svg" 
            alt="Founding" 
            className="h-12 mx-auto"
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Find your brand's voice in 3 minutes
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Take our quick quiz to discover your brand voice archetype. Get personalized writing examples and recommendations to make your brand's voice stand out.
        </p>

        <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
          <div className="relative mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to start"
              required
              className="w-full px-6 py-4 bg-background/50 backdrop-blur-sm border border-border/50 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm mb-4">{error}</p>
          )}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold shadow-[0_4px_24px_-4px_hsl(var(--primary)_/_0.3)] hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)_/_0.4)] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Starting...' : 'Start Quiz'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}