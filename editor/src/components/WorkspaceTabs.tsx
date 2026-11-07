import React from 'react';
import { X, FileCode2, Map, FileText, Image as ImageIcon, Package, Box, DoorOpen } from 'lucide-react';
import type { EditorTab } from '../types';
import { IMAGE_EXTENSIONS } from '../constants';

interface WorkspaceTabsProps {
  tabs: EditorTab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e: React.MouseEvent) => void;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab
}) => {
  if (tabs.length === 0) return null;

  const getTabIcon = (tab: EditorTab) => {
    if (tab.viewType === 'items') return <Package size={13} className="icon-item" />;
    if (tab.viewType === 'objects') return <Box size={13} className="icon-obj" />;
    if (tab.viewType === 'rooms') return <DoorOpen size={13} className="icon-room" />;

    const ext = tab.title.split('.').pop()?.toLowerCase();
    if (ext === 'pak') return <FileCode2 size={13} className="icon-pak" />;
    if (ext === 'tmx') return <Map size={13} className="icon-tmx" />;
    if (IMAGE_EXTENSIONS.has(ext || '')) return <ImageIcon size={13} className="icon-img" />;
    return <FileText size={13} />;
  };

  return (
    <div className="workspace-tabs-bar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`workspace-tab ${isActive ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            title={tab.filePath}
          >
            <span className="tab-icon">{getTabIcon(tab)}</span>
            <span className="tab-title">{tab.title}</span>
            {tab.isDirty && <span className="tab-dirty-indicator" title="Unsaved changes">●</span>}
            <button
              className="tab-close-btn"
              onClick={(e) => onCloseTab(tab.id, e)}
              title="Close Tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
