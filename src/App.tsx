import { useState } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { Quiz } from './components/Quiz';
import { ResultsScreen } from './components/ResultsScreen';
import { AppState, UserData } from './types';

function App() {
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

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {appState === 'intro' && <IntroScreen onStart={handleStart} />}
      {appState === 'quiz' && <Quiz onComplete={handleQuizComplete} />}
      {appState === 'results' && scores && userData && (
        <ResultsScreen scores={scores} userData={userData} />
      )}
    </div>
  );
}

export default App;