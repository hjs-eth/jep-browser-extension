document.getElementById('viewLogs').addEventListener('click', () => {
  chrome.tabs.create({ url: 'logs.html' });
});

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// 从 storage 读取统计数据
chrome.storage.local.get(['blockedCount'], (result) => {
  document.getElementById('blocked').textContent = result.blockedCount || 0;
});
