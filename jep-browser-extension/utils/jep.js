// 这里可以调用 @jep-eth/sdk 生成收据
// 暂时留空，后续集成
export async function generateReceipt(transaction) {
  // 模拟返回
  return {
    hash: '0x' + Math.random().toString(36).substring(2, 15),
    transaction,
    timestamp: Date.now()
  };
}
