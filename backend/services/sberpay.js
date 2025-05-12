const processPayment = async (order) => {
    return {
      transactionId: `TX${Math.random().toString(36).substring(2, 10)}`,
      status: 'completed',
      amount: order.total_price,
      date: new Date(),
    };
  };
  
  module.exports = { processPayment };