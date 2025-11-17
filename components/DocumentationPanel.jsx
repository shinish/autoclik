'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, HelpCircle } from 'lucide-react';

export default function DocumentationPanel({ title, sections }) {
  const [isOpen, setIsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        width: isOpen ? '320px' : '48px',
        flexShrink: 0
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{ borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
      >
        {isOpen ? (
          <>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                {title || 'Documentation'}
              </h3>
            </div>
            <ChevronUp className="h-4 w-4" style={{ color: 'var(--muted)' }} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 mx-auto">
            <BookOpen className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted)' }} />
          </div>
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sections && sections.length > 0 ? (
            sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {section.title}
                    </span>
                  </div>
                  {openSections[index] ? (
                    <ChevronUp className="h-3 w-3" style={{ color: 'var(--muted)' }} />
                  ) : (
                    <ChevronDown className="h-3 w-3" style={{ color: 'var(--muted)' }} />
                  )}
                </button>

                {openSections[index] && (
                  <div
                    className="pl-6 pr-2 py-2 text-xs space-y-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    {section.content}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              No documentation available for this page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
