import { motion } from 'framer-motion';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { archetypes } from '../data/archetypes';
import { TraitName, VoiceArchetype, UserData } from '../types';
import { Download, ArrowRight, X, RefreshCw, Share2, Info, ExternalLink, Mail } from 'lucide-react';
import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import emailjs from '@emailjs/browser';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsScreenProps {
  scores: Record<string, number>;
  userData: UserData;
  onRetake: () => void;
}

function determineArchetype(scores: Record<string, number>): VoiceArchetype {
  const archetypeScores = archetypes.map(archetype => {
    let score = 0;
    
    if (archetype.name === '✨ The Spark') {
      if ((scores.Playfulness >= 2 && scores.Boldness >= 2) &&
          (scores.Playfulness >= 3 || scores.Boldness >= 3)) {
        score += 3;
      }
    }
    
    if (archetype.name === '🎓 The Sage') {
      const relevantTraits = ['Sophistication', 'Clarity', 'Formality'];
      const highScores = relevantTraits.filter(trait => scores[trait] >= 2).length;
      if (highScores >= 2) score += 3;
    }
    
    if (archetype.name === '🤝 The Companion') {
      if ((scores.Warmth >= 2 && scores.Empathy >= 2) &&
          (scores.Warmth >= 3 || scores.Empathy >= 3)) {
        score += 3;
      }
    }
    
    if (archetype.name === '🚀 The Visionary') {
      if (scores.Inspiration >= 3 &&
          (scores.Boldness >= 2 || scores.Sophistication >= 2)) {
        score += 3;
      }
    }
    
    archetype.traits.forEach(trait => {
      score += scores[trait] || 0;
    });
    
    return { archetype, score };
  });

  return archetypeScores.reduce((best, current) => 
    current.score > best.score ? current : best
  ).archetype;
}

export function ResultsScreen({ scores, userData, onRetake }: ResultsScreenProps) {
  const [selectedArchetype, setSelectedArchetype] = useState<VoiceArchetype | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const chartRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const traits = Object.keys(scores) as TraitName[];
  const values = traits.map(trait => scores[trait]);
  const maxScore = Math.max(...values);

  const topTraits = traits
    .map(trait => ({ trait, score: scores[trait] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ trait }) => trait);

  const matchingArchetype = determineArchetype(scores);

  const chartData = {
    labels: traits,
    datasets: [
      {
        label: 'Your Voice Profile',
        data: values,
        backgroundColor: 'rgba(217, 111, 255, 0.2)',
        borderColor: '#D96FFF',
        borderWidth: 2,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#D96FFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#D96FFF',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: Math.max(maxScore, 3),
        beginAtZero: true,
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          circular: true,
        },
        pointLabels: {
          color: '#EEEEEE',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            family: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          },
          padding: window.innerWidth < 768 ? 8 : 20,
        },
        ticks: {
          display: false,
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#EEEEEE',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (items: any[]) => items[0].label,
          label: (item: any) => `Score: ${item.formattedValue}`,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  const handleShare = () => {
    const shareText = `I discovered my brand voice archetype: ${matchingArchetype.name}! Find yours at VoiceSeek`;
    const shareUrl = window.location.href;
    
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=600'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setFormStatus('submitting');
    
    try {
      await emailjs.sendForm(
        'service_wxwzny7',
        'template_todg1h3',
        formRef.current,
        'EzMx5EhE7iYubMY-i'
      );
      setFormStatus('success');
    } catch (error) {
      console.error('Failed to send email:', error);
      setFormStatus('error');
    }
  };

  const handleDownload = () => {
    const pdf = new jsPDF();
    
    pdf.setFontSize(24);
    pdf.text('VoiceSeek Results', 20, 30);
    
    pdf.setFontSize(20);
    pdf.text(`Your Archetype ${matchingArchetype.name}`, 20, 50);
    
    pdf.setFontSize(12);
    const description = `Your brand voice leans towards ${topTraits.join(', ')}. ${matchingArchetype.vibe}`;
    const splitDescription = pdf.splitTextToSize(description, pdf.internal.pageSize.width - 40);
    pdf.text(splitDescription, 20, 70);

    pdf.autoTable({
      head: [['Top Traits', 'Score']],
      body: topTraits.map(trait => [trait, scores[trait]]),
      startY: 90,
      theme: 'grid'
    });

    pdf.setFontSize(16);
    pdf.text('Writing Examples', 20, pdf.autoTable.previous.finalY + 20);

    pdf.autoTable({
      head: [['Do Write', 'Don\'t Write']],
      body: matchingArchetype.doWrite.map((phrase, i) => [
        phrase,
        matchingArchetype.dontWrite[i] || ''
      ]),
      startY: pdf.autoTable.previous.finalY + 30,
      theme: 'grid'
    });

    pdf.setFontSize(12);
    pdf.text('Ready to develop your brand strategy?', 20, pdf.autoTable.previous.finalY + 20);
    pdf.text('Visit: foundingcreative.com', 20, pdf.autoTable.previous.finalY + 30);
    pdf.text('Email: admin@foundingcreative.com', 20, pdf.autoTable.previous.finalY + 40);

    pdf.save('voiceseek-results.pdf');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen py-6 px-4"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <motion.button
            onClick={onRetake}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            <span>Retake Quiz</span>
          </motion.button>
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full group"
          >
            <Share2 className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            <span>Share on LinkedIn</span>
          </motion.button>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 mb-8 relative border border-border/50">
          <div className="text-base font-normal text-muted-foreground mb-1">Your Archetype</div>
          <h1 className="text-4xl font-bold text-foreground mb-6">{matchingArchetype.name}</h1>
          
          <p className="text-muted-foreground mb-8">
            Your brand voice leans towards {topTraits.join(', ')}. {matchingArchetype.vibe}
          </p>

          <div ref={chartRef} className="w-full aspect-square md:px-8 px-0 py-4">
            <Radar data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">✍️ Write Like This</h3>
              <ul className="space-y-3">
                {matchingArchetype.doWrite.map((phrase, index) => (
                  <li key={index} className="text-muted-foreground bg-success/10 border border-success/30 p-3 rounded-lg">
                    {phrase}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">⛔ Avoid Writing Like This</h3>
              <ul className="space-y-3">
                {matchingArchetype.dontWrite.map((phrase, index) => (
                  <li key={index} className="text-muted-foreground bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                    {phrase}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Explore Other Archetypes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {archetypes.map((archetype) => (
                <button
                  key={archetype.name}
                  onClick={() => setSelectedArchetype(archetype)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    archetype.name === matchingArchetype.name
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-secondary/50 hover:bg-secondary/80 border-2 border-transparent backdrop-blur-sm'
                  }`}
                >
                  <h4 className="font-semibold mb-1">{archetype.name}</h4>
                  <p className="text-sm text-muted-foreground">{archetype.vibe}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 border border-border/50">
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/Founding-v1-Brandmark-white copy.svg" 
              alt="Founding" 
              className="w-16 mb-6"
            />
            <h3 className="text-2xl font-bold mb-4">Ready to bring your brand voice to life?</h3>
            <p className="text-muted-foreground max-w-xl mb-6">
              Let's discuss how we can help you implement your voice across your brand, marketing, and website.
            </p>
          
            <form 
              ref={formRef}
              onSubmit={handleSubmit}
              className="w-full max-w-lg space-y-4"
            >
              <input type="hidden" name="archetype" value={matchingArchetype.name} />
              <input type="hidden" name="subject" value="I found my voice!" />
              
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/80 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  name="email"
                  defaultValue={userData.email}
                  placeholder="Your Email"
                  required
                  className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/80 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div>
                <textarea
                  name="message"
                  placeholder="Tell us about your brand and what you'd like help with..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/80 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
                ></textarea>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleDownload}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-secondary/50 backdrop-blur-sm text-primary border-2 border-primary px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Results
                </button>
                
                <button 
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-[0_4px_24px_-4px_hsl(var(--primary)_/_0.3)] hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)_/_0.4)] hover:bg-primary/90 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {formStatus === 'submitting' ? (
                    'Sending...'
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>

              {formStatus === 'success' && (
                <div className="text-success text-center">
                  Thanks! We'll be in touch soon.
                </div>
              )}
              
              {formStatus === 'error' && (
                <div className="text-destructive text-center">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}
            </form>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-border/50 pt-8">
            <div className="text-center">
              <h4 className="font-semibold mb-2">Brand Strategy</h4>
              <p className="text-muted-foreground text-sm">Turn your voice into a website-ready strategy that defines how your brand speaks, looks, and acts online.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Messaging & Creative</h4>
              <p className="text-muted-foreground text-sm">Craft powerful messaging, visuals, and user flows rooted in your archetype, built to resonate and convert.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold mb-2">Website Design</h4>
              <p className="text-muted-foreground text-sm">Bring it all to life through custom digital activations that reflect your unique voice and move audiences to act.</p>
            </div>
          </div>

          <div className="flex justify-center mt-8 pt-8 border-t border-border/50">
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>About VoiceSeek</span>
            </button>
          </div>
        </div>
      </div>

      {selectedArchetype && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-border/50"
          >
            <button
              onClick={() => setSelectedArchetype(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-base font-normal text-muted-foreground mb-1">Archetype</div>
            <h3 className="text-3xl font-bold mb-2">{selectedArchetype.name}</h3>
            <p className="text-muted-foreground mb-6">{selectedArchetype.vibe}</p>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-2">Key Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArchetype.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm border border-primary/50"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-4">What to Say</h4>
                  <ul className="space-y-3">
                    {selectedArchetype.doWrite.map((phrase, index) => (
                      <li key={index} className="text-muted-foreground bg-success/10 border border-success/30 p-3 rounded-lg">
                        {phrase}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">What Not to Say</h4>
                  <ul className="space-y-3">
                    {selectedArchetype.dontWrite.map((phrase, index) => (
                      <li key={index} className="text-muted-foreground bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                        {phrase}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card/50 backdrop-blur-sm rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-border/50"
          >
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-bold mb-6">Why we built VoiceSeek</h2>
            <p className="text-lg mb-6">Most voice and tone guides focus on rules. We focus on resonance.</p>

            <div className="space-y-6 text-muted-foreground">
              <p>
                VoiceSeek was built for founders, marketers, and teams who want their brand to sound like it means something—without needing to decode industry jargon or generic tone wheels. Traditional guidelines often lack clarity, context, or connection to how people actually read and listen.
              </p>

              <p>
                That's where VoiceSeek is different.
              </p>

              <p>
                We built this quick, strategy-led tool to help you define your brand's voice through instinctive, side-by-side comparisons. Each answer shapes a tone profile that's practical, memorable, and rooted in how you want to be perceived. The result is a voice that isn't just documented—it's felt.
              </p>

              <p>
                VoiceSeek doesn't just define tone. It helps your brand communicate with purpose.
              </p>

              <div className="pt-6 border-t border-border/50">
                <p className="font-semibold mb-4">Need help shaping your brand's voice across messaging, design, and web?</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="https://foundingcreative.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-[0_4px_24px_-4px_hsl(var(--primary)_/_0.3)] hover:shadow-[0_4px_32px_-4px_hsl(var(--primary)_/_0.4)] hover:bg-primary/90 transition-all flex-1"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Visit Website</span>
                  </a>
                  <a
                    href="mailto:admin@foundingcreative.com"
                    className="flex items-center justify-center gap-2 bg-secondary/50 backdrop-blur-sm text-primary border-2 border-primary px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors flex-1"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}