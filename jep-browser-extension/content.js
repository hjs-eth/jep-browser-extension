// 监听页面中的交易发起事件（这里需要根据实际网站 DOM 结构适配）
// 以 Gate 为例，假设有一个“确认交易”按钮
document.addEventListener('click', async (e) => {
  if (e.target.matches('.confirm-trade-btn')) {
    e.preventDefault();
    
    // 从页面提取交易信息（示例）
    const tx = {
      to: document.querySelector('.contract-address')?.textContent,
      value: parseFloat(document.querySelector('.amount')?.textContent),
      firstInteraction: !localStorage.getItem('knownContract')
    };
    
    // 发送给 background 检查
    const result = await chrome.runtime.sendMessage({
      type: 'CHECK_TRANSACTION',
      transaction: tx
    });
    
    if (result.risk === 'high') {
      // 弹出确认框
      const userConfirmed = confirm(
        `⚠️ JEP Guard 检测到高风险交易\n\n` +
        `金额: ${tx.value} USDC\n` +
        `原因: ${result.reason}\n\n` +
        `是否允许执行？`
      );
      if (userConfirmed) {
        // 继续提交交易
        // 这里需要恢复原按钮行为，实际需复杂处理，暂时简化
        alert('交易已放行（模拟）');
      } else {
        alert('交易已拦截');
      }
    } else {
      // 低风险直接放行
    }
  }
});
