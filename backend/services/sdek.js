const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const CDEK_API_URL = process.env.CDEK_API_URL || 'https://api.edu.cdek.ru/v2';
const CDEK_ACCOUNT = process.env.CDEK_ACCOUNT;
const CDEK_SECURE_PASSWORD = process.env.CDEK_SECURE_PASSWORD;

const calculateDelivery = async ({ address, tariff_code, packages }) => {
  const response = await axios.post(
    `${CDEK_API_URL}/calculator/tariff`,
    {
      tariff_code,
      from_location: { postal_code: '101000' },
      to_location: { postal_code: address.postal_code },
      packages,
    },
    {
      auth: {
        username: CDEK_ACCOUNT,
        password: CDEK_SECURE_PASSWORD,
      },
    }
  );

  return response.data;
};

const calculateDeliveryCost = async (order) => {
    return {
      cost: 500,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 
    };
  };
  
  const getTrackingInfo = async (trackingNumber) => {
    return {
      trackingNumber,
      status: 'В пути',
      lastUpdate: new Date(),
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };
  };
  
  module.exports = {
    calculateDeliveryCost,
    getTrackingInfo,
    calculateDelivery,
  };