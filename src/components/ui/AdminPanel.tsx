import React, { ReactNode } from 'react';
import './AdminPanel.css';

interface AdminPanelProps {
  title: string;
  icon?: string;
  children: ReactNode;
  actions?: ReactNode;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  title,
  icon,
  children,
  actions,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const handleToggleCollapse = () => {
    if (isCollapsible && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  return (
    <div className={`admin-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="admin-panel-header">
        <div className="admin-panel-title-container">
          {icon && <span className="admin-panel-icon">{icon}</span>}
          <h3 className="admin-panel-title">{title}</h3>
        </div>
        
        <div className="admin-panel-actions">
          {actions}
          
          {isCollapsible && (
            <button 
              className="admin-panel-collapse-btn" 
              onClick={handleToggleCollapse}
              title={isCollapsed ? "Développer" : "Réduire"}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      </div>
      
      <div className="admin-panel-content">
        {children}
      </div>
    </div>
  );
};

export default AdminPanel; 