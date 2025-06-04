import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { Phrase } from '../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface QuizCardProps {
  phrase: Phrase;
  onSwipe: (direction: 'left' | 'right') => void;
}

export function QuizCard({ phrase, onSwipe }: QuizCardProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({ x: 0, opacity: 1, scale: 1 });
  }, [phrase]);

  const handleDragEnd = async (_: never, info: PanInfo) => {
    const threshold = 100;
    const direction = info.offset.x > threshold ? 'right' : info.offset.x < -threshold ? 'left' : null;

    if (direction) {
      await controls.start({
        x: direction === 'right' ? 200 : -200,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.3 }
      });
      onSwipe(direction);
    } else {
      controls.start({ x: 0, scale: 1 });
    }
  };

  const handleButtonClick = async (direction: 'left' | 'right') => {
    await controls.start({
      x: direction === 'right' ? 200 : -200,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    });
    onSwipe(direction);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={controls}
      initial={{ x: 300, opacity: 0, scale: 0.8 }}
      whileDrag={{ scale: 1.05 }}
      className="w-full h-full flex items-center justify-center"
    >
      <div className="w-full aspect-[3/4] bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 border border-border/50 flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <div className="size-3 rounded-full bg-primary/20 border border-primary/30" />
          <div className="text-sm text-muted-foreground font-medium">{phrase.contextLabel}</div>
        </div>
        
        <div className="text-2xl font-medium mb-auto">{phrase.optionA}</div>
        
        <div className="grid grid-cols-2 gap-3 mt-8">
          <button
            onClick={() => handleButtonClick('left')}
            className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm p-3 bg-secondary/50 backdrop-blur-sm rounded-xl hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Not my vibe</span>
          </button>
          <button
            onClick={() => handleButtonClick('right')}
            className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm p-3 bg-secondary/50 backdrop-blur-sm rounded-xl hover:bg-secondary/80 transition-colors"
          >
            <span className="whitespace-nowrap">I like this</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}