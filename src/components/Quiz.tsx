import { useState, useEffect } from 'react';
import { phrases } from '../data/phrases';
import { Phrase } from '../types';
import { QuizCard } from './QuizCard';

interface QuizProps {
  onComplete: (results: Record<string, number>) => void;
}

export function Quiz({ onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    Clarity: 0,
    Warmth: 0,
    Playfulness: 0,
    Boldness: 0,
    Sophistication: 0,
    Formality: 0,
    Inspiration: 0,
    Empathy: 0,
  });

  const handleSwipe = (direction: 'left' | 'right') => {
    const currentPhrase = phrases[currentIndex];
    
    if (direction === 'right') {
      setScores(prev => {
        const newScores = { ...prev };
        Object.entries(currentPhrase.traits).forEach(([trait, value]) => {
          newScores[trait] = (newScores[trait] || 0) + value;
        });
        return newScores;
      });
    }

    if (currentIndex === phrases.length - 1) {
      onComplete(scores);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handleSwipe('left');
      } else if (event.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.removeEventListener('touchmove', handleTouchMove);
      document.body.style.height = '';
      document.body.style.overflow = '';
    };
  }, [currentIndex]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="text-muted-foreground text-lg">
          {currentIndex + 1} / {phrases.length}
        </div>
      </div>

      <div className="w-full h-full max-w-md flex items-center justify-center px-4">
        <QuizCard
          key={currentIndex}
          phrase={phrases[currentIndex]}
          onSwipe={handleSwipe}
        />
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center text-sm text-muted-foreground px-4">
        <div>Swipe left or right</div>
      </div>
    </div>
  );
}