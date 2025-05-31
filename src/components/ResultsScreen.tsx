import { motion } from 'framer-motion';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { archetypes } from '../data/archetypes';
import { TraitName, VoiceArchetype, UserData } from '../types';
import { Download, ArrowRight, X, RefreshCw, Linkedin } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import emailjs from '@emailjs/browser';
import html2canvas from 'html2canvas';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface ResultsScreenProps {
  scores: Record<string, number>;
  userData: UserData;
  onRetake: () => void;
}

function determineArchetype(scores: Record<string, number>): VoiceArchetype {
  const archetypeScores = archetypes.map(archetype => {
    let score = 0;
    
    if (archetype.name === 'The Spark') {
      if ((scores.Playfulness >= 2 && scores.Boldness >= 2) &&
          (scores.Playfulness >= 3 || scores.Boldness >= 3)) {
        score += 3;
      }
    }
    
    if (archetype.name === 'The Sage') {
      const relevantTraits = ['Sophistication', 'Clarity', 'Formality'];
      const highScores = relevantTraits.filter(trait => scores[trait] >= 2).length;
      if (highScores >= 2) score += 3;
    }
    
    if (archetype.name === 'The Companion') {
      if ((scores.Warmth >= 2 && scores.Empathy >= 2) &&
          (scores.Warmth >= 3 || scores.Empathy >= 3)) {
        score += 3;
      }
    }
    
    if (archetype.name === 'The Visionary') {
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
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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

  useEffect(() => {
    const generateAndUploadPreview = async () => {
      if (!chartRef.current || isUploading) return;

      try {
        setIsUploading(true);
        setUploadError(null);

        // Capture the chart with padding and styling
        const chartElement = chartRef.current;
        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#000000',
          scale: 2,
          logging: false,
          windowWidth: chartElement.scrollWidth * 2,
          windowHeight: chartElement.scrollHeight * 2
        });

        const dataUrl = canvas.toDataURL('image/png');
        
        // Upload to ImgBB through Netlify Function
        const response = await fetch('/.netlify/functions/upload-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: dataUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const { url } = await response.json();
        setPreviewImage(url);

        // Update Open Graph meta tags
        const metaTags = {
          'og:image': url,
          'og:title': `My VoiceSeek Result: ${matchingArchetype.name}`,
          'og:description': `I discovered my brand voice archetype: ${matchingArchetype.name}. My top traits are ${topTraits.join(', ')}. Find yours in 3 minutes!`
        };

        Object.entries(metaTags).forEach(([property, content]) => {
          let tag = document.querySelector(`meta[property="${property}"]`);
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', content);
        });

      } catch (error) {
        console.error('Error generating/uploading preview:', error);
        setUploadError('Failed to prepare share preview. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };

    generateAndUploadPreview();
  }, [matchingArchetype, topTraits]);

  const handleLinkedInShare = () => {
    if (uploadError) {
      alert('Unable to share: ' + uploadError);
      return;
    }
    
    const shareUrl = encodeURIComponent(window.location.href);
    const width = 550;
    const height = 400;
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2);
    
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      'Share on LinkedIn',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0`
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
    
    // Add title and branding
    pdf.setFontSize(24);
    pdf.text('VoiceSeek Results', 20, 30);
    
    pdf.setFontSize(20);
    pdf.text(`Your Brand Voice Archetype: ${matchingArchetype.name}`, 20, 50);
    
    // Description
    pdf.setFontSize(12);
    const description = `Your brand voice leans towards ${topTraits.join(', ')}. ${matchingArchetype.vibe}`;
    const splitDescription = pdf.splitTextToSize(description, pdf.internal.pageSize.width - 40);
    pdf.text(splitDescription, 20, 70);

    // Top Traits Table
    pdf.autoTable({
      head: [['Top Traits', 'Score']],
      body: topTraits.map(trait => [trait, scores[trait]]),
      startY: 90,
      theme: 'grid'
    });

    // Writing Examples
    pdf.setFontSize(16);
    pdf.text('Writing Examples:', 20, pdf.autoTable.previous.finalY + 20);

    pdf.autoTable({
      head: [['Do Write', 'Don\'t Write']],
      body: matchingArchetype.doWrite.map((phrase, i) => [
        phrase,
        matchingArchetype.dontWrite[i] || ''
      ]),
      startY: pdf.autoTable.previous.finalY + 30,
      theme: 'grid'
    });

    // Contact Information
    pdf.setFontSize(12);
    pdf.text('Ready to develop your brand strategy?', 20, pdf.autoTable.previous.finalY + 20);
    pdf.text('Visit: foundingcreative.com', 20, pdf.autoTable.previous.finalY + 30);
    pdf.text('Email: admin@foundingcreative.com', 20, pdf.autoTable.previous.finalY + 40);

    pdf.save('voiceseek-results.pdf');
  };

  const chartData = {
    labels: traits,
    datasets: [
      {
        label: 'Your Voice Profile',
        data: values,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            size: 12
          }
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
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-black py-12 px-4"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={onRetake}
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors bg-gray-900/50 px-4 py-2 rounded-full"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
          <button
            onClick={handleLinkedInShare}
            className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors bg-gray-900/50 px-4 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            <Linkedin className="w-4 h-4" />
            <span>{isUploading ? 'Preparing Share...' : 'Share on LinkedIn'}</span>
          </button>
        </div>

        {uploadError && (
          <div className="text-red-400 text-center mb-4">
            {uploadError}
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 relative border border-gray-800">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Your Voice Archetype:</h1>
          <h2 className="text-2xl text-green-400 font-semibold mb-6">
            {matchingArchetype.name}
          </h2>
          
          <p className="text-gray-300 mb-8">
            Your brand voice leans towards {topTraits.join(', ')}. {matchingArchetype.vibe}
          </p>

          <div ref={chartRef} className="aspect-square max-w-md mx-auto mb-8 bg-black p-4 rounded-xl">
            <Radar data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">✍️ Write Like This:</h3>
              <ul className="space-y-3">
                {matchingArchetype.doWrite.map((phrase, index) => (
                  <li key={index} className="text-gray-300 bg-green-900/20 border border-green-700/30 p-3 rounded-lg">
                    "{phrase}"
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">⛔ Avoid Writing Like This:</h3>
              <ul className="space-y-3">
                {matchingArchetype.dontWrite.map((phrase, index) => (
                  <li key={index} className="text-gray-300 bg-red-900/20 border border-red-700/30 p-3 rounded-lg">
                    "{phrase}"
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Explore Other Archetypes:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {archetypes.map((archetype) => (
                <button
                  key={archetype.name}
                  onClick={() => setSelectedArchetype(archetype)}
                  className={`p-4 rounded-lg text-left transition-all ${
                    archetype.name === matchingArchetype.name
                      ? 'bg-green-900/50 border-2 border-green-500'
                      : 'bg-gray-800/50 hover:bg-gray-800 border-2 border-transparent'
                  }`}
                >
                  <h4 className="font-semibold text-gray-100 mb-1">{archetype.name}</h4>
                  <p className="text-sm text-gray-300">{archetype.vibe}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
          <div className="flex flex-col items-center text-center mb-8">
            <img 
              src="/Founding-v1-Wordmark-white.svg" 
              alt="Founding" 
              className="h-8 mb-6"
            />
            <h3 className="text-2xl font-bold text-gray-100 mb-4">Ready to bring your brand voice to life?</h3>
            <p className="text-gray-300 max-w-xl mb-6">
              Let's discuss how we can help you implement your {matchingArchetype.name.toLowerCase()} voice across your brand, marketing, and web presence.
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-100 placeholder-gray-400"
                />
              </div>
              
              <div>
                <input
                  type="email"
                  name="email"
                  defaultValue={userData.email}
                  placeholder="Your Email"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-100 placeholder-gray-400"
                />
              </div>
              
              <div>
                <textarea
                  name="message"
                  placeholder="Tell us about your brand and what you'd like help with..."
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-100 placeholder-gray-400"
                ></textarea>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleDownload}
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-gray-800 text-green-400 border-2 border-green-500 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Results
                </button>
                
                <button 
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-400 text-black px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-shadow disabled:opacity-50"
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
                <div className="text-green-400 text-center">
                  Thanks! We'll be in touch soon.
                </div>
              )}
              
              {formStatus === 'error' && (
                <div className="text-red-400 text-center">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}
            </form>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-800 pt-8">
            <div className="text-center">
              <h4 className="font-semibold text-gray-100 mb-2">Brand Strategy</h4>
              <p className="text-gray-400 text-sm">Develop a comprehensive brand strategy aligned with your voice archetype</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-100 mb-2">Marketing Implementation</h4>
              <p className="text-gray-400 text-sm">Create marketing materials that consistently reflect your brand voice</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-gray-100 mb-2">Web Presence</h4>
              <p className="text-gray-400 text-sm">Design a website that embodies your brand voice and engages your audience</p>
            </div>
          </div>
        </div>
      </div>

      {selectedArchetype && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 rounded-2xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border border-gray-800"
          >
            <button
              onClick={() => setSelectedArchetype(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-100 mb-2">{selectedArchetype.name}</h3>
            <p className="text-gray-300 mb-6">{selectedArchetype.vibe}</p>

            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-100 mb-2">Key Traits:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArchetype.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm border border-green-700/50"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-4">What to Say:</h4>
                  <ul className="space-y-3">
                    {selectedArchetype.doWrite.map((phrase, index) => (
                      <li key={index} className="text-gray-300 bg-green-900/20 border border-green-700/30 p-3 rounded-lg">
                        "{phrase}"
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-100 mb-4">What Not to Say:</h4>
                  <ul className="space-y-3">
                    {selectedArchetype.dontWrite.map((phrase, index) => (
                      <li key={index} className="text-gray-300 bg-red-900/20 border border-red-700/30 p-3 rounded-lg">
                        "{phrase}"
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}