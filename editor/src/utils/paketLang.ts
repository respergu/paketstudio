import type { Monaco } from '@monaco-editor/react';

export function registerPaketLanguage(monaco: Monaco) {
  const languageId = 'paket';

  // Avoid registering multiple times
  const existingLanguages = monaco.languages.getLanguages();
  if (existingLanguages.some((l: any) => l.id === languageId)) {
    return;
  }

  monaco.languages.register({ id: languageId });

  monaco.languages.setMonarchTokensProvider(languageId, {
    defaultToken: '',
    tokenPostfix: '.pak',

    keywords: [
      // top level keywords:
      "include",
      "language",
      "built-in-texts",
      "action-names",
      "font",
      "loading-screen",
      "pointers",
      "frame-around-subrooms",
      "text-area",
      "game-area",
      "gui",
      "inventory",
      "pathfinding",
      "double-click-on-exit",
      "load-save-game-mode",
      "load-save-game-script",
      "use-item-with-item-symmetric",
      "player-scaling-thresholds",
      "palette-rgb-tolerance",
      "cpc-rgb-palette",
      "msx-screen2-rgb-palette",
      "item",
      "object",
      "room",
      "itemRules",
      "onRoomLoadRules",
      "onRoomStartRules",
      "dialogue",
      "init-variable",
      "cutscene-image",
      "script",
      "define-palette",
      "base-palette",
      "additional-assembler-file",
      "additional-assembler-incbin",
      "player-stop-state",
      "player-walk-animation-speeds",
      "wyz-instruments-file",
      // Rule-types:
      "rule",
      "repeating-rule",
      "on-room-load-rule",
      "on-room-start-rule",
      "persistent-rule",
      "persistent-rule-effect",
      // Rule triggers:
      "true",
      "examine-object",
      "pickup-object",
      "use-object",
      "talk-to-object",
      "examine-item",
      "use-item-with-object",
      "talk-to-item",
      "click-outside-room-area",
      "variable-eq",
      "use-item-with-item",
      "exit-through-object",
      "have-item",
      "current-room-is",
      "number-object-equals",
      // Rule scripts:
      "message",
      "remove-object",
      "gain-item",
      "lose-item",
      "change-object-description",
      "change-object-name",
      "walk-to",
      "go-to-room",
      "change-object-state",
      "set-variable",
      "inc-variable",
      "dec-variable",
      "if",
      "add-dialogue-option",
      "goto-dialogue-state",
      "start-dialogue",
      "scrolling-message",
      "scrolling-message-pause",
      "increase-number-object",
      "decrease-number-object",
      "set-number-object",
      "change-object-direction",
      "wait-for-space",
      "call-script",
      "clear-screen",
      "clear-text-area",
      "clear-room-area",
      "redraw-room",
      "redraw-dirty",
      "gui-off",
      "gui-on",
      "print",
      "print-paragraph",
      "draw-cutscene-image",
      "draw-cutscene-image-horizontal-section",
      "draw-cutscene-image-rectangle",
      "collision-map-clear",
      "collision-map-set",
      "play-sfx",
      "pause",
      "skippable-pause",
      "pause-redrawing",
      "skippable-pause-redrawing",
      "play-tsv-song",
      "play-wyz-song",
      "stop-song",
      "set-palette",
      "restore-current-room-palette",
      "draw-fog-over-room-area",
      "call-assembler",
      "custom-assembler-room-draw",
      "clear-custom-assembler-room-draw",
      "custom-assembler-on-update",
      "clear-custom-assembler-on-update",
      "save-game",
      "load-game",
    ],

    constants: [
      'true', 'false', 'idle', 'open', 'closed', 'hidden', 'exit', 'walking-1',
      'walking-2', 'walking-3', 'walking-4', 'number', 'front', 'left', 'right',
      'up', 'down', 'box', 'pixel', 'none', 'on-click', 'on-collision', 'stop-early',
      'do-not-stop-early', 'cpc-mode0', 'cpc-mode1'
    ],

    tokenizer: {
      root: [
        // Comments
        [/#.*$/, 'comment'],

        // Strings
        [/"([^"\\]|\\.)*"/, 'string'],
        [/'([^'\\]|\\.)*'/, 'string'],

        // Numbers
        [/\b\d+\b/, 'number'],

        // Identifiers & keywords
        [/[a-zA-Z_-][a-zA-Z0-9_-]*/, {
          cases: {
            '@keywords': 'keyword',
            '@constants': 'type.identifier',
            '@default': 'identifier'
          }
        }],

        // Delimiters and operators
        [/[()[\],:]/, 'delimiter'],
      ]
    }
  });

  // Define custom dark theme styling for PAKET
  monaco.editor.defineTheme('paket-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '00d8d6', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: 'ffb86c' },
      { token: 'identifier', foreground: 'f8f8f2' },
      { token: 'string', foreground: '50fa7b' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'delimiter', foreground: 'f1fa8c' }
    ],
    colors: {
      'editor.background': '#13151f',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#1c1f2e',
      'editorLineNumber.foreground': '#4f5573',
      'editorLineNumber.activeForeground': '#00d8d6',
      'editorCursor.foreground': '#00d8d6',
      'editor.selectionBackground': '#2d334d'
    }
  });
}
