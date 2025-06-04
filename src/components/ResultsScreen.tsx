import React from 'react';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

export function ResultsScreen({ archetype, phrases }) {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(20);
    doc.text("Your Voice Archetype Results", 20, 20);
    
    doc.setFontSize(16);
    doc.text(`Voice Archetype ${archetype}`, 20, 40);
    
    doc.setFontSize(12);
    doc.text("Example Phrases", 20, 60);
    
    // Add phrases with proper spacing
    phrases.forEach((phrase, index) => {
      doc.text(`• ${phrase}`, 30, 70 + (index * 10));
    });
    
    // Save the PDF
    doc.save("voice-archetype-results.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Your Results</h1>
        
        <div className="bg-gray-800 rounded-lg p-8 shadow-xl mb-8">
          <h2 className="text-3xl font-semibold mb-6">Voice Archetype {archetype}</h2>
          
          <div className="mb-8">
            <h3 className="text-2xl font-medium mb-4">Example Phrases</h3>
            <ul className="space-y-3">
              {phrases.map((phrase, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>{phrase}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition duration-200"
          >
            <Download size={20} />
            Download Results PDF
          </button>
        </div>
      </div>
    </div>
  );
}