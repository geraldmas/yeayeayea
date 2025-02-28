import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Help.css';

interface HelpProps {}

const Help: React.FC<HelpProps> = () => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + '/README.md')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load README.md');
        }
        return response.text();
      })
      .then(text => {
        setContent(text);
      })
      .catch(error => {
        console.error('Error loading README:', error);
        setContent('# Erreur\nImpossible de charger la documentation.');
      });
  }, []);

  return (
    <div className="help-container">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

export default Help;