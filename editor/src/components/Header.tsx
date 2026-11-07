import React from 'react';
import {
  Play,
  FolderOpen,
  FolderPlus,
  X,
  Settings,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Gamepad2,
  Square,
  Palette
} from 'lucide-react';
import type { Platform } from '../types';
import { DEFAULT_OUTPUT_DIR } from '../constants';

interface HeaderProps {
  projectPath: string | null;
  onOpenFolder: () => void;
  onNewProject: () => void;
  onCloseProject: () => void;
  selectedPlatform: Platform;
  onPlatformChange: (p: Platform) => void;
  language: string;
  onLanguageChange: (l: string) => void;
  outputDir: string;
  onOutputDirChange: (d: string) => void;
  onCompile: () => void;
  onKillCompile: () => void;
  onRunEmulator: () => void;
  onOpenPaletteManager: () => void;
  onOpenSettings: () => void;
  isCompiling: boolean;
  lastCompileStatus: boolean | null;
  pakFiles: string[];
  selectedMainPak: string;
  onMainPakChange: (p: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectPath,
  onOpenFolder,
  onNewProject,
  onCloseProject,
  selectedPlatform,
  onPlatformChange,
  language,
  onLanguageChange,
  outputDir,
  onOutputDirChange,
  onCompile,
  onKillCompile,
  onRunEmulator,
  onOpenPaletteManager,
  onOpenSettings,
  isCompiling,
  lastCompileStatus,
  pakFiles,
  selectedMainPak,
  onMainPakChange,
}) => {
  const projectName = projectPath ? projectPath.split(/[/\\]/).filter(Boolean).pop() : 'No Project Opened';

  return (
    <header className="header-container">
      <div className="header-left">
        <div className="app-brand">
          <img src="/paket-logo.png" width="40" alt="PAKET Logo" className="brand-logo" />
          <span className="brand-title">PAKET Studio</span>
        </div>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onNewProject}
          title="Create New PAKET Project from Template"
        >
          <FolderPlus size={15} />
          <span>New</span>
        </button>

        <button
          className="btn btn-secondary btn-icon"
          onClick={onOpenFolder}
          title="Open PAKET Project Folder"
        >
          <FolderOpen size={15} />
          <span>Open</span>
        </button>

        {projectPath && (
          <div className="project-badge" title={projectPath}>
            <span className="project-label">Project:</span>
            <span className="project-name">{projectName}</span>
            <button
              className="project-close-btn"
              onClick={onCloseProject}
              title="Close Current Project"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="header-center">
        {projectPath && (
          <div className="compile-config-bar">
            {pakFiles.length > 0 && (
              <div className="control-group">
                <label>Main:</label>
                <select
                  className="select-input select-main-pak"
                  value={selectedMainPak}
                  onChange={(e) => onMainPakChange(e.target.value)}
                >
                  {pakFiles.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="control-group">
              <label><Cpu size={14} /> Platform:</label>
              <select
                className="select-input"
                value={selectedPlatform}
                onChange={(e) => onPlatformChange(e.target.value as Platform)}
              >
                <option value="cpc">Amstrad CPC (64K)</option>
                <option value="cpc6128">Amstrad CPC 6128 (128K)</option>
                <option value="msx">MSX (Screen 2)</option>
                <option value="msxmegarom">MSX MegaROM (Screen 2)</option>
                <option value="msx-wt">MSX Wide Tile (Screen 2)</option>
              </select>
            </div>

            <div className="control-group">
              <label>Lang:</label>
              <input
                type="text"
                className="text-input lang-input"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value)}
                maxLength={4}
                title="Target Language Code"
              />
            </div>

            <div className="control-group">
              <label>Out:</label>
              <input
                type="text"
                className="text-input out-input"
                value={outputDir}
                placeholder={DEFAULT_OUTPUT_DIR}
                onChange={(e) => onOutputDirChange(e.target.value)}
                title="Compilation Output Directory (%OUT%)"
              />
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        {lastCompileStatus !== null && (
          <div className={`status-pill ${lastCompileStatus ? 'status-success' : 'status-error'}`}>
            {lastCompileStatus ? (
              <>
                <CheckCircle2 size={14} />
                <span>Build Succeeded</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} />
                <span>Build Failed</span>
              </>
            )}
          </div>
        )}

        {isCompiling ? (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              disabled
              style={{ cursor: 'wait' }}
              title="Compiling PAKET game..."
            >
              <Loader2 size={16} className="spin" />
              <span>Compiling...</span>
            </button>
            <button
              className="btn btn-danger"
              onClick={onKillCompile}
              title="Kill running compiler process (Cancel build)"
            >
              <Square size={13} fill="currentColor" />
              <span>Stop</span>
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onCompile}
            disabled={!projectPath}
            title="Compile Game (F5)"
          >
            <Play size={16} fill="currentColor" />
            <span>Compile (F5)</span>
          </button>
        )}

        <button
          className="btn btn-accent"
          onClick={onRunEmulator}
          disabled={!projectPath}
          title="Run in Emulator"
        >
          <Gamepad2 size={16} />
          <span>Run</span>
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onOpenPaletteManager}
          title="Palette Manager (MSX / CPC)"
        >
          <Palette size={18} />
        </button>

        <button
          className="btn btn-icon-only"
          onClick={onOpenSettings}
          title="IDE & Toolchain Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
