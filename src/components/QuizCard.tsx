import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Phrase } from '../types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface QuizCardProps {
  phrase: Phrase;
  onSwipe: (direction: 'left' | 'right') => void;
}

export function QuizCard({ phrase, onSwipe }: QuizCardProps) {
  const controls = useAnimation();
  const [dragX, setDragX] = useState(0);
  const [activeDirection, setActiveDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    controls.start({ x: 0, opacity: 1, scale: 1 });
    setDragX(0);
    setActiveDirection(null);
  }, [phrase]);

  const animateAndSwipe = async (direction: 'left' | 'right') => {
    setActiveDirection(direction);
    await controls.start({
      x: direction === 'right' ? 200 : -200,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3 }
    });
    onSwipe(direction);
    setActiveDirection(null);
  };

  const handleDragEnd = async (_: never, info: PanInfo) => {
    const threshold = 100;
    const direction = info.offset.x > threshold ? 'right' : info.offset.x < -threshold ? 'left' : null;

    if (direction) {
      await animateAndSwipe(direction);
    } else {
      controls.start({ x: 0, scale: 1 });
    }
    setDragX(0);
  };

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        await animateAndSwipe('left');
      } else if (event.key === 'ArrowRight') {
        await animateAndSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBackgroundStyle = () => {
    const intensity = Math.min(Math.abs(dragX) / 100, 1) * 0.3;
    if (dragX > 0 || activeDirection === 'right') {
      return `rgba(34, 197, 94, ${intensity || 0.3})`; // Green
    } else if (dragX < 0 || activeDirection === 'left') {
      return `rgba(239, 68, 68, ${intensity || 0.3})`; // Red
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  const getBorderStyle = () => {
    if (dragX > 0 || activeDirection === 'right') {
      return 'rgb(34, 197, 94)';
    } else if (dragX < 0 || activeDirection === 'left') {
      return 'rgb(239, 68, 68)';
    }
    return 'rgba(255, 255, 255, 0.1)';
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
      onDrag={(_, info) => setDragX(info.offset.x)}
      className="w-full h-full flex items-center justify-center"
    >
      <div 
        className="w-full aspect-[3/4] backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 flex flex-col transition-all duration-200"
        style={{
          backgroundColor: getBackgroundStyle(),
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: getBorderStyle(),
        }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="size-3 rounded-full bg-primary/20 border border-primary/30" />
          <div className="text-sm text-muted-foreground font-medium">{phrase.contextLabel}</div>
        </div>
        
        <div className="text-2xl font-medium mb-auto">{phrase.optionA}</div>
        
        <div className="grid grid-cols-2 gap-3 mt-8">
          <button
            onClick={() => animateAndSwipe('left')}
            className={`flex items-center justify-center gap-1.5 text-muted-foreground text-sm p-3 rounded-xl transition-all duration-200 border-2 ${
              activeDirection === 'left'
                ? 'bg-destructive/20 border-destructive'
                : 'bg-secondary/50 border-border/50 hover:bg-secondary/80 hover:border-destructive/50'
            }`}
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Not my vibe</span>
          </button>
          <button
            onClick={() => animateAndSwipe('right')}
            className={`flex items-center justify-center gap-1.5 text-muted-foreground text-sm p-3 rounded-xl transition-all duration-200 border-2 ${
              activeDirection === 'right'
                ? 'bg-success/20 border-success'
                : 'bg-secondary/50 border-border/50 hover:bg-secondary/80 hover:border-success/50'
            }`}
          >
            <span className="whitespace-nowrap">I like this</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}