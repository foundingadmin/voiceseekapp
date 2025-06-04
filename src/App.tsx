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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 animated-gradient opacity-30" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="/Wave-Black.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'brightness(0.1) contrast(0.8)',
              mixBlendMode: 'overlay'
            }}
          />
        </div>
        <div 
          className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/50 backdrop-blur-[1px]" 
        />
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