let pendingTransaction = null;

document.addEventListener('click', async (e) => {
  const targetButton = e.target.closest(
    '.confirm-trade-btn, #btn-submit-order, button[type="submit"], .buy-button'
  );
  if (!targetButton) return;
  if (pendingTransaction) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  // 提取交易信息（需要根据实际网站调整）
  const amountEl = document.querySelector(
    '.amount-input, #amount, [name="amount"], .input-amount'
  );
  const contractEl = document.querySelector(
    '.contract-address, .token-symbol, [data-currency], .token-info'
  );
  const amount = amountEl ? parseFloat(amountEl.value || amountEl.innerText) : 0;
  const contract = contractEl ? (contractEl.value || contractEl.innerText) : 'unknown';

  const tx = {
    to: contract,
    value: amount,
    firstInteraction: true, // 可改进
    hash: '0x' + Date.now().toString(16) + Math.random().toString(16).substring(2),
  };

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'CHECK_TRANSACTION',
      transaction: tx,
    });

    if (result.error) throw new Error(result.error);

    if (result.risk === 'high') {
      pendingTransaction = { button: targetButton, tx, receiptHash: result.receiptHash };

      const userConfirmed = confirm(
        `⚠️ JEP Guard 高风险交易\n\n` +
        `金额: ${tx.value} USDC\n` +
        `合约: ${tx.to}\n` +
        `原因: ${result.reason}\n` +
        `收据ID: ${result.receiptHash.slice(0, 10)}...\n\n` +
        `是否允许执行？`
      );

      if (userConfirmed) {
        await chrome.runtime.sendMessage({
          type: 'RECORD_TRANSACTION',
          transaction: tx,
          approved: true,
          risk: 'high',
        });
        pendingTransaction = null;
        targetButton.click();
      } else {
        await chrome.runtime.sendMessage({
          type: 'RECORD_TRANSACTION',
          transaction: tx,
          approved: false,
          risk: 'high',
        });
        pendingTransaction = null;
        alert('交易已拦截');
      }
    } else {
      await chrome.runtime.sendMessage({
        type: 'RECORD_TRANSACTION',
        transaction: tx,
        approved: true,
        risk: 'low',
      });
      pendingTransaction = null;
      targetButton.click();
    }
  } catch (error) {
    console.error('JEP Guard error:', error);
    pendingTransaction = null;
    targetButton.click(); // 出错时放行
  }
}, true);
