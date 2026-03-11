// background.js 模拟版（无真实JEP SDK）
let blockedCount = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_TRANSACTION') {
    checkTransaction(request.transaction)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
  if (request.type === 'RECORD_TRANSACTION') {
    recordTransaction(request.transaction, request.approved, request.risk);
    sendResponse({ ok: true });
  }
});

async function checkTransaction(tx) {
  // 简单规则：金额 > 100 或 地址未知视为高风险
  const isHighRisk = tx.value > 100 || tx.firstInteraction;
  return {
    risk: isHighRisk ? 'high' : 'low',
    reason: isHighRisk ? '大额交易或未知合约' : '正常交易'
  };
}

function recordTransaction(tx, approved, risk) {
  if (!approved) {
    blockedCount++;
    chrome.storage.local.set({ blockedCount });
  }
  // 存储日志
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.push({
      timestamp: new Date().toISOString(),
      transaction: tx,
      approved,
      risk: risk || (approved ? 'low' : 'high')
    });
    chrome.storage.local.set({ logs });
  });
}
