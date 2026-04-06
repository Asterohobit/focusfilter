const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

chrome.storage.sync.get({ enabled: true }, (s) => {
  toggle.checked = s.enabled;
  status.textContent = s.enabled ? 'Enabled' : 'Disabled';
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.sync.set({ enabled });
  status.textContent = enabled ? 'Enabled' : 'Disabled';

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) chrome.tabs.sendMessage(tab.id, { type: 'FF_TOGGLE', enabled }).catch(() => {});
  });
});