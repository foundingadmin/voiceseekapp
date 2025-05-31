import { useState } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { Quiz } from './components/Quiz';
import { ResultsScreen } from './components/ResultsScreen';
import { AppState, UserData } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [scores, setScores] = useState<Record<string, number> | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  const handleStart = (email: string) => {
    setUserData({ email });
    setAppState('quiz');
  };

  const handleQuizComplete = (results: Record<string, number>) => {
    setScores(results);
    setAppState('results');
  };

  const handleRetake = () => {
    setScores(null);
    setAppState('quiz');
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative">
      <div className="fixed inset-0 z-0">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'url(/background-02.gif)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.2
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
      </div>
      <div className="relative z-10">
        {appState === 'intro' && <IntroScreen onStart={handleStart} />}
        {appState === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
        {appState === 'results' && scores && userData && (
          <ResultsScreen scores={scores} userData={userData} onRetake={handleRetake} />
        )}
      </div>
    </div>
  );
}