function displayLogs() {
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    const tbody = document.querySelector('#logTable tbody');
    tbody.innerHTML = '';
    
    // 按时间倒序显示
    logs.slice().reverse().forEach(log => {
      const row = tbody.insertRow();
      const timeCell = row.insertCell();
      const amountCell = row.insertCell();
      const contractCell = row.insertCell();
      const riskCell = row.insertCell();
      const statusCell = row.insertCell();
      
      timeCell.textContent = new Date(log.timestamp).toLocaleString();
      amountCell.textContent = log.transaction.value || 0;
      contractCell.textContent = log.transaction.to || 'unknown';
      riskCell.textContent = log.risk || 'unknown';
      statusCell.textContent = log.approved ? '已放行' : '已拦截';
      
      if (log.approved) {
        statusCell.className = 'approved';
      } else {
        statusCell.className = 'blocked';
      }
    });
  });
}

document.getElementById('clearLogs').addEventListener('click', () => {
  chrome.storage.local.remove('logs', displayLogs);
});

displayLogs();
