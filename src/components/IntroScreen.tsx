import { motion } from 'framer-motion';
import { useState } from 'react';

interface IntroScreenProps {
  onStart: (email: string) => void;
}

export function IntroScreen({ onStart }: IntroScreenProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // If successful, proceed with the quiz
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
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      <motion.div
        className="text-center max-w-lg relative z-10"
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
        <h1 className="text-4xl font-bold text-gray-100 mb-4">
          Discover your brand's true voice in 3 minutes
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Swipe through our interactive quiz to uncover your unique brand voice archetype and get personalized recommendations.
        </p>

        <form onSubmit={handleSubmit} className="max-w-sm mx-auto mb-6">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to start"
              required
              className="w-full px-6 py-4 bg-gray-900/80 backdrop-blur-sm border-2 border-gray-800 rounded-full text-gray-100 placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-400 text-black px-8 py-4 rounded-full text-lg font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-shadow disabled:opacity-50"
          >
            {isSubmitting ? 'Starting...' : 'Start Quiz'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}