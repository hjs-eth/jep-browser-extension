// 存储当前等待确认的交易
let pendingTransaction = null;

// 监听所有点击事件
document.addEventListener('click', async (e) => {
  // 匹配交易按钮的选择器（需要用户根据实际网站修改）
  const targetButton = e.target.closest('.confirm-trade-btn, #btn-submit-order, button[type="submit"]');
  if (!targetButton) return;

  // 如果已经有待处理的交易，说明正在等待确认，忽略后续点击
  if (pendingTransaction) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // 阻止默认提交行为
  e.preventDefault();
  e.stopPropagation();

  // 提取交易信息（示例选择器，用户需根据实际DOM调整）
  const amountEl = document.querySelector('.amount-input, #amount, [name="amount"]');
  const contractEl = document.querySelector('.contract-address, .token-symbol, [data-currency]');
  const amount = amountEl ? parseFloat(amountEl.value || amountEl.innerText) : 0;
  const contract = contractEl ? (contractEl.value || contractEl.innerText) : 'unknown';

  // 构造交易对象
  const tx = {
    to: contract,
    value: amount,
    firstInteraction: true, // 需要根据实际情况判断
    timestamp: Date.now()
  };

  // 发送给background检查风险
  const result = await chrome.runtime.sendMessage({
    type: 'CHECK_TRANSACTION',
    transaction: tx
  });

  if (result.risk === 'high') {
    // 存储待处理交易
    pendingTransaction = { button: targetButton, tx };

    // 显示自定义确认弹窗（使用confirm作为简单实现，后续可美化）
    const userConfirmed = confirm(
      `⚠️ JEP Guard 检测到高风险交易\n\n` +
      `金额: ${tx.value} USDC\n` +
      `合约: ${tx.to}\n` +
      `风险等级: ${result.risk}\n` +
      `原因: ${result.reason}\n\n` +
      `是否允许执行？`
    );

    if (userConfirmed) {
      // 用户允许，生成JEP收据（调用background）
      await chrome.runtime.sendMessage({
        type: 'RECORD_TRANSACTION',
        transaction: tx,
        approved: true
      });

      // 恢复按钮点击（暂时移除监听，重新触发）
      pendingTransaction = null;
      targetButton.click(); // 这会再次触发本监听，但由于 pendingTransaction 已清空，会继续处理
    } else {
      // 用户拒绝，记录拒绝事件
      await chrome.runtime.sendMessage({
        type: 'RECORD_TRANSACTION',
        transaction: tx,
        approved: false
      });
      pendingTransaction = null;
    }
  } else {
    // 低风险，直接放行（记录但不拦截）
    await chrome.runtime.sendMessage({
      type: 'RECORD_TRANSACTION',
      transaction: tx,
      approved: true,
      risk: 'low'
    });
    pendingTransaction = null;
    targetButton.click(); // 放行
  }
}, true); // 使用捕获阶段以确保优先拦截
