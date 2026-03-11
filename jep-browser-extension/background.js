// 存储拦截计数
let blockedCount = 0;

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_TRANSACTION') {
    checkTransaction(request.transaction)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 保持异步响应
  }
  if (request.type === 'RECORD_TRANSACTION') {
    recordTransaction(request.transaction, request.approved, request.risk);
    sendResponse({ ok: true });
  }
});

// 风险判断函数（可根据需要扩展）
async function checkTransaction(tx) {
  // 从存储中获取用户设置
  const { threshold, autoBlock } = await chrome.storage.local.get(['threshold', 'autoBlock']);
  const riskThreshold = threshold || 100;
  
  // 简单规则：金额 > 阈值 或 首次交互 视为高风险
  const isHighRisk = tx.value > riskThreshold || tx.firstInteraction;
  
  return {
    risk: isHighRisk ? 'high' : 'low',
    reason: isHighRisk ? `金额超过${riskThreshold} USDC或未知合约` : '正常交易',
    autoBlock: autoBlock || false
  };
}

// 记录交易结果
function recordTransaction(tx, approved, risk) {
  if (!approved) {
    blockedCount++;
    chrome.storage.local.set({ blockedCount });
  }
  // 获取现有日志
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.push({
      timestamp: new Date().toISOString(),
      transaction: tx,
      approved,
      risk: risk || (approved ? 'low' : 'high')
    });
    // 只保留最近100条日志
    if (logs.length > 100) logs.shift();
    chrome.storage.local.set({ logs });
  });
}
