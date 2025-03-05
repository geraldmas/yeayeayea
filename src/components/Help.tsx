import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Help.css';

interface HelpProps {}

type TabType = 'readme' | 'cahierdescharges' | 'todo';

const Help: React.FC<HelpProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('readme');
  const [contents, setContents] = useState<Record<TabType, string>>({
    readme: '',
    cahierdescharges: '',
    todo: ''
  });

  useEffect(() => {
    // Charger les contenus pour chaque onglet
    const fetchContent = async (file: string, tab: TabType) => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/${file}`);
        if (!response.ok) {
          throw new Error(`Impossible de charger ${file}`);
        }
        const text = await response.text();
        setContents(prev => ({ ...prev, [tab]: text }));
      } catch (error) {
        console.error(`Erreur lors du chargement de ${file}:`, error);
        setContents(prev => ({ 
          ...prev, 
          [tab]: `# Erreur\nImpossible de charger ${file}.` 
        }));
      }
    };

    fetchContent('README.md', 'readme');
    fetchContent('cahierdescharges.md', 'cahierdescharges');
    fetchContent('TODO.md', 'todo');
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <div className="help-container">
      <div className="help-tabs">
        <button 
          className={`tab-button ${activeTab === 'readme' ? 'active' : ''}`}
          onClick={() => handleTabChange('readme')}
        >
          README
        </button>
        <button 
          className={`tab-button ${activeTab === 'cahierdescharges' ? 'active' : ''}`}
          onClick={() => handleTabChange('cahierdescharges')}
        >
          Cahier des Charges
        </button>
        <button 
          className={`tab-button ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => handleTabChange('todo')}
        >
          TODO
        </button>
      </div>
      
      <div className="tab-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {contents[activeTab]}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Help;