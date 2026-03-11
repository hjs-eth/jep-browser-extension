// 当前待处理的交易
let pendingTransaction = null;

// 监听页面点击事件（使用捕获阶段确保优先）
document.addEventListener('click', async (e) => {
  // 匹配交易按钮的选择器（你需要根据实际网站修改！）
  const targetButton = e.target.closest(
    '.confirm-trade-btn, #btn-submit-order, button[type="submit"], .buy-button'
  );
  
  if (!targetButton) return;

  // 如果已经有待处理的交易，阻止重复点击
  if (pendingTransaction) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // 阻止按钮的默认行为
  e.preventDefault();
  e.stopPropagation();

  // 提取交易信息（这些选择器也需要根据实际网站调整）
  const amountEl = document.querySelector(
    '.amount-input, #amount, [name="amount"], .input-amount'
  );
  const contractEl = document.querySelector(
    '.contract-address, .token-symbol, [data-currency], .token-info'
  );
  
  const amount = amountEl ? parseFloat(amountEl.value || amountEl.innerText) : 0;
  const contract = contractEl ? (contractEl.value || contractEl.innerText) : 'unknown';

  // 构造交易对象
  const tx = {
    to: contract,
    value: amount,
    firstInteraction: true, // 这里可以改进：检查本地存储是否记录过该合约
    timestamp: Date.now()
  };

  try {
    // 发送给 background 检查风险
    const result = await chrome.runtime.sendMessage({
      type: 'CHECK_TRANSACTION',
      transaction: tx
    });

    if (result.risk === 'high') {
      // 存储待处理交易
      pendingTransaction = { button: targetButton, tx };

      // 使用 confirm 弹窗（可替换为自定义弹窗）
      const userConfirmed = confirm(
        `⚠️ JEP Guard 检测到高风险交易\n\n` +
        `金额: ${tx.value} USDC\n` +
        `合约地址: ${tx.to}\n` +
        `风险等级: ${result.risk}\n` +
        `原因: ${result.reason}\n\n` +
        `是否允许执行？`
      );

      if (userConfirmed) {
        // 记录允许
        await chrome.runtime.sendMessage({
          type: 'RECORD_TRANSACTION',
          transaction: tx,
          approved: true,
          risk: 'high'
        });
        pendingTransaction = null;
        // 重新触发按钮点击（放行）
        targetButton.click();
      } else {
        // 记录拒绝
        await chrome.runtime.sendMessage({
          type: 'RECORD_TRANSACTION',
          transaction: tx,
          approved: false,
          risk: 'high'
        });
        pendingTransaction = null;
        alert('交易已拦截');
      }
    } else {
      // 低风险，直接放行
      await chrome.runtime.sendMessage({
        type: 'RECORD_TRANSACTION',
        transaction: tx,
        approved: true,
        risk: 'low'
      });
      pendingTransaction = null;
      targetButton.click();
    }
  } catch (error) {
    console.error('JEP Guard 错误:', error);
    pendingTransaction = null;
    // 出错时放行，避免影响正常使用
    targetButton.click();
  }
}, true); // 使用捕获阶段
