const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hordDesktop', {
  exportSave: save => ipcRenderer.invoke('desktop:export-save', save),
  importSave: save => ipcRenderer.invoke('desktop:import-save', save),
  notify: message => ipcRenderer.invoke('desktop:notify', String(message).slice(0, 500)),
  onCommand(callback) {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on('desktop:command', listener);
    return () => ipcRenderer.removeListener('desktop:command', listener);
  }
});
