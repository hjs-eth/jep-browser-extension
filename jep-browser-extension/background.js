import { createReceipt, verifyReceipt } from '@jep-eth/sdk';

let blockedCount = 0;

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_TRANSACTION') {
    handleTransactionCheck(request.transaction)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 异步响应
  }
  if (request.type === 'RECORD_TRANSACTION') {
    recordTransaction(request.transaction, request.approved, request.risk);
    sendResponse({ ok: true });
  }
});

// 使用 SDK 进行交易风险分析和收据生成
async function handleTransactionCheck(tx) {
  // 1. 获取用户设置
  const { threshold, autoBlock } = await chrome.storage.local.get(['threshold', 'autoBlock']);
  const riskThreshold = threshold || 100;

  // 2. 判断风险（模拟，实际可用更复杂的规则）
  const isHighRisk = tx.value > riskThreshold || tx.firstInteraction;

  // 3. 生成 JEP 收据（记录这笔交易尝试）
  const receipt = await createReceipt({
    actor: 'browser-extension',
    decisionHash: tx.hash || '0x' + Date.now().toString(16),
    authorityScope: 'transaction-protection',
    valid: {
      from: Math.floor(Date.now() / 1000),
      until: Math.floor(Date.now() / 1000) + 86400, // 24小时有效
    },
  });

  // 4. 存储收据以便后续验证（可选）
  await storeReceipt(receipt, tx);

  return {
    risk: isHighRisk ? 'high' : 'low',
    reason: isHighRisk ? `金额超过 ${riskThreshold} USDC 或未知合约` : '正常交易',
    autoBlock: autoBlock || false,
    receiptHash: receipt.id, // 返回收据ID供前端显示
  };
}

// 存储收据到本地（示例）
async function storeReceipt(receipt, tx) {
  const { receipts } = await chrome.storage.local.get(['receipts']);
  const newReceipts = receipts || [];
  newReceipts.push({
    ...receipt,
    transaction: tx,
    timestamp: Date.now(),
  });
  // 只保留最近100条
  if (newReceipts.length > 100) newReceipts.shift();
  await chrome.storage.local.set({ receipts: newReceipts });
}

// 记录交易结果
function recordTransaction(tx, approved, risk) {
  if (!approved) {
    blockedCount++;
    chrome.storage.local.set({ blockedCount });
  }
  chrome.storage.local.get(['logs'], (result) => {
    const logs = result.logs || [];
    logs.push({
      timestamp: new Date().toISOString(),
      transaction: tx,
      approved,
      risk: risk || (approved ? 'low' : 'high'),
    });
    if (logs.length > 100) logs.shift();
    chrome.storage.local.set({ logs });
  });
}
