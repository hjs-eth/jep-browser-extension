// 加载已保存的设置
chrome.storage.local.get(['threshold', 'autoBlock'], (result) => {
  document.getElementById('threshold').value = result.threshold || 100;
  document.getElementById('autoBlock').checked = result.autoBlock || false;
});

document.getElementById('save').addEventListener('click', () => {
  const threshold = parseInt(document.getElementById('threshold').value, 10);
  const autoBlock = document.getElementById('autoBlock').checked;
  
  chrome.storage.local.set({ threshold, autoBlock }, () => {
    document.getElementById('status').textContent = '已保存';
    setTimeout(() => {
      document.getElementById('status').textContent = '';
    }, 2000);
  });
});
