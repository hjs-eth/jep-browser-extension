// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_TRANSACTION') {
    checkTransaction(request.transaction)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 保持异步响应
  }
});

// 模拟交易风险检查（后续可集成真实 API）
async function checkTransaction(tx) {
  // 这里可以调用 JEP SDK 进行风险评估
  // 简单规则：金额 > 100 USDC 或 首次交互的合约 标记为高风险
  const isHighRisk = tx.value > 100 || tx.firstInteraction;
  return {
    risk: isHighRisk ? 'high' : 'low',
    reason: isHighRisk ? '大额交易或未知合约' : '正常交易',
    tx
  };
}
