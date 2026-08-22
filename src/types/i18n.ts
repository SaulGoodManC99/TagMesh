export type Locale = 'en' | 'zh';

export interface TranslationDictionary {
  app: {
    title: string;
    tagline: string;
  };
  commandPalette: {
    placeholder: string;
    noResults: string;
    createNew: string;
    sectionNotes: string;
    sectionTags: string;
    sectionCommands: string;
    cmdNewNote: string;
    cmdToggleLang: string;
    cmdExportMarkdown: string;
    cmdExportJson: string;
    cmdCopyMcpToken: string;
    cmdToggleSidebar: string;
    cmdShortcuts: string;
    cmdDeleteNote: string;
    cmdPinNote: string;
    cmdUnpinNote: string;
    enterToSelect: string;
    escToClose: string;
    navigate: string;
  };
  editor: {
    placeholder: string;
    emptyNote: string;
    uploadingImage: string;
    imageUploaded: string;
    imageUploadFailed: string;
    words: string;
    characters: string;
    readingTime: string;
    synced: string;
    saving: string;
    offline: string;
  };
  sidebar: {
    title: string;
    allNotes: string;
    untagged: string;
    tagsHeader: string;
    noTags: string;
    notesCount: string;
    searchTags: string;
  };
  shortcuts: {
    title: string;
    commandPalette: string;
    quickNew: string;
    toggleSidebar: string;
    toggleLang: string;
    saveImmediate: string;
    closeModal: string;
  };
  mcp: {
    title: string;
    subtitle: string;
    endpoint: string;
    tokenLabel: string;
    tokenCopied: string;
    toolsList: string;
  };
}
