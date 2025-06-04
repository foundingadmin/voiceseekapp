import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          Designed & Built with <Heart className="w-4 h-4 fill-current text-primary" /> by{' '}
          <a
            href="https://foundingcreative.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors"
          >
            Founding Creative
          </a>
        </div>
      </div>
    </footer>
  );
}