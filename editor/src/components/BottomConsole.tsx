import React, { useRef, useEffect } from 'react';
import { 
  Terminal, 
  AlertTriangle, 
  Settings as SettingsIcon, 
  ChevronUp, 
  ChevronDown, 
  Trash2, 
  ExternalLink,
  CheckCircle,
  Square
} from 'lucide-react';
import type { CompilerProblem, ProjectSettings, SystemInfo } from '../types';
import { 
  EMULATOR_PRESETS, 
  DEFAULT_COMPILER_ARGS, 
  DEFAULT_MAIN_PAK,
  DEFAULT_EMULATOR_COMMAND,
  TARGET_FORMAT_DSK,
  TARGET_FORMAT_CDT,
  getEffectiveTargetFormat,
  getTargetBinaryFilename
} from '../constants';

export type BottomConsoleTab = 'console' | 'problems' | 'settings';

interface BottomConsoleProps {
  consoleOutput: string;
  problems: CompilerProblem[];
  isCompiling: boolean;
  onClearConsole: () => void;
  onProblemClick: (file?: string, line?: number) => void;
  onKillCompile?: () => void;
  settings: ProjectSettings;
  onUpdateSettings: (settings: Partial<ProjectSettings>) => void;
  systemInfo: SystemInfo;
  height?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
  projectPath?: string | null;
  activeTab: BottomConsoleTab;
  onTabChange: (tab: BottomConsoleTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
}

const ANSI_COLORS: Record<string, string> = {
  '31': 'var(--accent-red, #ef4444)',
  '32': '#34d399',
  '33': '#fbbf24',
  '34': '#60a5fa',
  '35': '#c084fc',
  '36': '#22d3ee',
  '37': '#f4f4f5',
  '90': '#71717a',
  '91': '#f87171',
  '92': '#34d399',
  '93': '#fbbf24',
  '94': '#60a5fa',
  '95': '#e879f9',
  '96': '#67e8f9',
};

const renderAnsiText = (text: string): React.ReactNode => {
  if (!text) return null;

  const regex = /\x1b\[([0-9;]*)([a-zA-Z])/g;
  const elements: React.ReactNode[] = [];
  let currentColor: string | undefined = undefined;
  let isBold = false;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const segment = text.slice(lastIndex, match.index);
      elements.push(
        <span
          key={elements.length}
          style={{
            color: currentColor,
            fontWeight: isBold ? 600 : undefined,
          }}
        >
          {segment}
        </span>
      );
    }

    const code = match[1];
    const letter = match[2];

    if (letter === 'm') {
      if (code === '0' || code === '' || code === '39') {
        currentColor = undefined;
        isBold = false;
      } else if (code === '1') {
        isBold = true;
      } else if (ANSI_COLORS[code]) {
        currentColor = ANSI_COLORS[code];
      } else if (code.includes(';')) {
        const parts = code.split(';');
        for (const p of parts) {
          if (p === '0') {
            currentColor = undefined;
            isBold = false;
          } else if (p === '1') {
            isBold = true;
          } else if (ANSI_COLORS[p]) {
            currentColor = ANSI_COLORS[p];
          }
        }
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const segment = text.slice(lastIndex);
    elements.push(
      <span
        key={elements.length}
        style={{
          color: currentColor,
          fontWeight: isBold ? 600 : undefined,
        }}
      >
        {segment}
      </span>
    );
  }

  return elements;
};

export const BottomConsole: React.FC<BottomConsoleProps> = ({
  consoleOutput,
  problems,
  isCompiling,
  onClearConsole,
  onProblemClick,
  onKillCompile,
  settings,
  onUpdateSettings,
  systemInfo,
  height,
  onResizeStart,
  projectPath,
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse
}) => {
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Auto-switch to problems if errors occur
  useEffect(() => {
    if (problems.length > 0) {
      onTabChange('problems');
      onToggleCollapse(false);
    }
  }, [problems, onTabChange, onToggleCollapse]);

  // Auto-scroll console
  useEffect(() => {
    if (activeTab === 'console' && !isCollapsed) {
      consoleBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleOutput, activeTab, isCollapsed]);

  const applyEmulatorPreset = (preset: 'openmsx' | 'rvm' | 'default') => {
    if (preset === 'openmsx') {
      onUpdateSettings({ emulatorCommand: EMULATOR_PRESETS.OPENMSX });
    } else if (preset === 'rvm') {
      onUpdateSettings({ emulatorCommand: EMULATOR_PRESETS.RVM });
    } else if (preset === 'default') {
      onUpdateSettings({ emulatorCommand: EMULATOR_PRESETS.DEFAULT });
    }
  };

  const getCompilerCommandPreview = () => {
    const javaBin = settings.javaPath || systemInfo.detected_java || 'java';
    const jar = settings.jarPath || systemInfo.detected_jar || 'PAKET.jar';
    const mainPak = settings.mainPakRelative || DEFAULT_MAIN_PAK;
    const outDir = settings.outputDirRelative || `${settings.selectedPlatform}/built`;
    const rawArgs = settings.compilerArgs || DEFAULT_COMPILER_ARGS;
    const expanded = rawArgs
      .replace('%MAIN%', mainPak)
      .replace('%PLATFORM%', settings.selectedPlatform)
      .replace('%LANG%', settings.language)
      .replace('%OUT%', outDir);
    return `${javaBin} -jar ${jar} ${expanded}`;
  };

  const outDir = settings.outputDirRelative || `${settings.selectedPlatform}/built`;
  const targetFilename = getTargetBinaryFilename(settings.selectedPlatform, settings.language, settings.targetFormat);
  const targetBinaryPath = projectPath ? `${projectPath}/${outDir}/${targetFilename}` : `${outDir}/${targetFilename}`;

  const getEmulatorCommandPreview = () => {
    const rawCmd = settings.emulatorCommand || DEFAULT_EMULATOR_COMMAND;
    return rawCmd.replace(/%FILE%/g, targetBinaryPath);
  };

  return (
    <div
      className={`bottom-panel ${isCollapsed ? 'collapsed' : ''}`}
      style={!isCollapsed && height !== undefined ? { height: `${height}px` } : undefined}
    >
      <div
        className="panel-resizer-horizontal"
        onMouseDown={(e) => {
          if (isCollapsed) onToggleCollapse(false);
          onResizeStart?.(e);
        }}
        title="Drag to resize console panel"
      />
      <div className="panel-tab-bar">
        <div className="tab-buttons">
          <button
            className={`panel-tab-btn ${activeTab === 'console' ? 'active' : ''}`}
            onClick={() => { onTabChange('console'); onToggleCollapse(false); }}
          >
            <Terminal size={14} />
            <span>Console</span>
            {isCompiling && <span className="pulsing-dot" />}
          </button>

          <button
            className={`panel-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => { onTabChange('problems'); onToggleCollapse(false); }}
          >
            <AlertTriangle size={14} className={problems.length > 0 ? 'text-error' : ''} />
            <span>Problems</span>
            {problems.length > 0 && (
              <span className="badge-problem-count">{problems.length}</span>
            )}
          </button>

          <button
            className={`panel-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { onTabChange('settings'); onToggleCollapse(false); }}
          >
            <SettingsIcon size={14} />
            <span>Build Settings</span>
          </button>
        </div>

        <div className="panel-actions">
          {isCompiling && onKillCompile && (
            <button
              className="btn btn-danger btn-xs"
              onClick={onKillCompile}
              title="Kill compiler process (Cancel build)"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '11px' }}
            >
              <Square size={10} fill="currentColor" />
              <span>Stop Build</span>
            </button>
          )}

          {activeTab === 'console' && (
            <button className="icon-action-btn" onClick={onClearConsole} title="Clear Console">
              <Trash2 size={13} />
            </button>
          )}

          <button
            className="icon-action-btn"
            onClick={() => onToggleCollapse(!isCollapsed)}
            title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="panel-body">
          {activeTab === 'console' && (
            <div className="console-view">
              <pre className="terminal-text">
                {consoleOutput ? renderAnsiText(consoleOutput) : 'Ready. Click [Compile] or press F5 to build your PAKET game.'}
                <div ref={consoleBottomRef} />
              </pre>
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="problems-view">
              {problems.length === 0 ? (
                <div className="empty-problems">
                  <CheckCircle size={24} className="text-success" />
                  <span>No errors detected in the last compilation.</span>
                </div>
              ) : (
                <table className="problems-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>File</th>
                      <th style={{ width: '10%' }}>Line</th>
                      <th style={{ width: '50%' }}>Error Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((prob, idx) => (
                      <tr
                        key={idx}
                        className="problem-row"
                        onClick={() => onProblemClick(prob.file, prob.line)}
                        title="Click to jump to line in code editor"
                      >
                        <td className="problem-file">
                          <ExternalLink size={12} className="jump-icon" />
                          <span>{prob.file || 'General Build'}</span>
                        </td>
                        <td className="problem-line">{prob.line ?? '-'}</td>
                        <td className="problem-msg">{prob.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Java Executable Path (Requires Java 18+):</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="text-input"
                      value={settings.javaPath}
                      placeholder={systemInfo.detected_java || 'Path to java binary (e.g. /Library/Java/.../bin/java)'}
                      onChange={(e) => onUpdateSettings({ javaPath: e.target.value })}
                    />
                    {systemInfo.detected_java && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onUpdateSettings({ javaPath: systemInfo.detected_java || '' })}
                      >
                        Auto: {systemInfo.detected_java.split('/').pop()}
                      </button>
                    )}
                  </div>
                  <span className="setting-desc">Currently using: {settings.javaPath || systemInfo.detected_java || 'System default java'}</span>
                </div>

                <div className="setting-item">
                  <label>PAKET.jar Location:</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="text-input"
                      value={settings.jarPath}
                      placeholder={systemInfo.detected_jar || 'Path to PAKET.jar'}
                      onChange={(e) => onUpdateSettings({ jarPath: e.target.value })}
                    />
                    {systemInfo.detected_jar && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onUpdateSettings({ jarPath: systemInfo.detected_jar || '' })}
                      >
                        Found: {systemInfo.detected_jar.split('/').pop()}
                      </button>
                    )}
                  </div>
                  <span className="setting-desc">Resolved to: {settings.jarPath || systemInfo.detected_jar || 'Built-in PAKET.jar'}</span>
                </div>

                <div className="setting-item full-width">
                  <label>Compilation Output Folder (%OUT% - relative to project root):</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="text-input"
                      value={settings.outputDirRelative}
                      placeholder={`${settings.selectedPlatform}/built`}
                      onChange={(e) => onUpdateSettings({ outputDirRelative: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onUpdateSettings({ outputDirRelative: `${settings.selectedPlatform}/built` })}
                      title="Reset to default platform output directory"
                    >
                      Default: {settings.selectedPlatform}/built
                    </button>
                  </div>
                  <span className="setting-desc">
                    Target binaries will be output to: <code>{settings.outputDirRelative || `${settings.selectedPlatform}/built`}</code>
                  </span>
                </div>

                <div className="setting-item full-width">
                  <label>Compiler Arguments (%MAIN%, %PLATFORM%, %LANG%, %OUT%):</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="text-input"
                      value={settings.compilerArgs}
                      placeholder={DEFAULT_COMPILER_ARGS}
                      onChange={(e) => onUpdateSettings({ compilerArgs: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => onUpdateSettings({ compilerArgs: DEFAULT_COMPILER_ARGS })}
                      title="Reset to default compiler arguments"
                    >
                      Reset
                    </button>
                  </div>
                  <span className="setting-desc">
                    Command preview: <code>{getCompilerCommandPreview()}</code>
                  </span>
                </div>

                {(settings.selectedPlatform === 'cpc' || settings.selectedPlatform === 'cpc6128') && (
                  <div className="setting-item full-width">
                    <label>Target Binary Format for %FILE% (Amstrad CPC):</label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '2px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        <input
                          type="radio"
                          name="targetFormat"
                          value={TARGET_FORMAT_DSK}
                          checked={getEffectiveTargetFormat(settings.selectedPlatform, settings.targetFormat) === TARGET_FORMAT_DSK}
                          onChange={() => onUpdateSettings({ targetFormat: TARGET_FORMAT_DSK })}
                        />
                        <span>Floppy Disk (<strong>.dsk</strong>)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        <input
                          type="radio"
                          name="targetFormat"
                          value={TARGET_FORMAT_CDT}
                          checked={getEffectiveTargetFormat(settings.selectedPlatform, settings.targetFormat) === TARGET_FORMAT_CDT}
                          onChange={() => onUpdateSettings({ targetFormat: TARGET_FORMAT_CDT })}
                        />
                        <span>Cassette Tape (<strong>.cdt</strong>)</span>
                      </label>
                    </div>
                    <span className="setting-desc">
                      PAKET generates both .dsk and .cdt when compiling for CPC. Select which format %FILE% resolves to.
                    </span>
                  </div>
                )}

                <div className="setting-item full-width">
                  <label>Emulator Launch Command (%FILE% replaces binary):</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      className="text-input"
                      value={settings.emulatorCommand}
                      placeholder="e.g., openmsx %FILE% or open -a 'Retro Virtual Machine' %FILE%"
                      onChange={(e) => onUpdateSettings({ emulatorCommand: e.target.value })}
                    />
                    <div className="preset-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => applyEmulatorPreset('rvm')}>
                        RVM (CPC)
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => applyEmulatorPreset('openmsx')}>
                        OpenMSX
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => applyEmulatorPreset('default')}>
                        Default (open)
                      </button>
                    </div>
                  </div>
                  <span className="setting-desc">
                    %FILE% resolves to: <code>{targetBinaryPath}</code>
                  </span>
                  <span className="setting-desc">
                    Command preview: <code>{getEmulatorCommandPreview()}</code>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
