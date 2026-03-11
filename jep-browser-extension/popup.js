// 更新统计数据
chrome.storage.local.get(['blockedCount'], (result) => {
  document.getElementById('blockedCount').textContent = result.blockedCount || 0;
});

// 获取当前标签页URL，简单判断风险
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  const riskSpan = document.getElementById('pageRisk');
  if (url.includes('gate.com') || url.includes('bitget.com')) {
    riskSpan.textContent = '中';
    riskSpan.className = 'risk-high';
  } else {
    riskSpan.textContent = '低';
    riskSpan.className = 'risk-low';
  }
});

document.getElementById('viewLogs').addEventListener('click', () => {
  chrome.tabs.create({ url: 'logs.html' });
});

document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
