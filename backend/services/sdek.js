// const axios = require('axios');
// const dotenv = require('dotenv');

// dotenv.config();

// const CDEK_API_URL = process.env.CDEK_API_URL || 'https://api.cdek.ru/v2';
// const CDEK_ACCOUNT = process.env.CDEK_ACCOUNT;
// const CDEK_SECURE_PASSWORD = process.env.CDEK_SECURE_PASSWORD;

// let cachedToken = null;
// let tokenExpiresAt = null;

// const getAccessToken = async () => {
//   if (cachedToken && tokenExpiresAt > Date.now()) {
//     console.log('SDEK: Использование кэшированного токена');
//     return cachedToken;
//   }

//   try {
//     if (!CDEK_ACCOUNT || !CDEK_SECURE_PASSWORD) {
//       throw new Error('Отсутствуют учетные данные CDEK');
//     }

//     console.log('SDEK: Получение нового токена');

//     const response = await axios.post(
//       `${CDEK_API_URL}/oauth/token?grant_type=client_credentials&client_id=${CDEK_ACCOUNT}&client_secret=${CDEK_SECURE_PASSWORD}`,
//       {},
//       { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//     );

//     cachedToken = response.data.access_token;
//     tokenExpiresAt = Date.now() + (response.data.expires_in * 1000 - 60000);
//     console.log('SDEK: Токен получен', { expires_at: new Date(tokenExpiresAt).toISOString() });

//     return cachedToken;
//   } catch (error) {
//     console.error('SDEK: Ошибка получения токена', {
//       message: error.response?.data?.message || error.message,
//       status: error.response?.status,
//       stack: error.stack,
//     });
//     throw new Error(`Не удалось получить токен CDEK: ${error.response?.data?.message || error.message}`);
//   }
// };

// const calculateDelivery = async ({ address, tariff_code, packages }) => {
//   try {
//     if (!address.postal_code) {
//       throw new Error('Почтовый индекс адреса не указан');
//     }

//     if (!packages || !packages.length) {
//       throw new Error('Отсутствуют данные о посылках');
//     }

//     console.log('SDEK: Расчет доставки', {
//       tariff_code,
//       postal_code: address.postal_code,
//       package_count: packages.length,
//       packages: packages.map(p => ({ weight: p.weight, items: p.items })),
//     });

//     const token = await getAccessToken();

//     const response = await axios.post(
//       `${CDEK_API_URL}/calculator/tariff`,
//       {
//         tariff_code,
//         from_location: { postal_code: '101000' },
//         to_location: { postal_code: address.postal_code },
//         packages: packages.map(pkg => ({
//           ...pkg,
//           weight: Math.round(pkg.weight * 1000), 
//         })),
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );

//     const { delivery_sum, period_min, period_max } = response.data;
//     if (!delivery_sum || !period_min || !period_max) {
//       throw new Error('Некорректный ответ от CDEK API: отсутствуют обязательные поля');
//     }

//     console.log('SDEK: Доставка рассчитана', { delivery_sum, period_min, period_max });

//     return {
//       delivery_sum: Number(delivery_sum) || 0,
//       period_min: Number(period_min) || 1,
//       period_max: Number(period_max) || 3,
//     };
//   } catch (error) {
//     console.error('SDEK: Ошибка при расчете доставки', {
//       message: error.response?.data?.message || error.message,
//       status: error.response?.status,
//       stack: error.stack,
//       request_data: {
//         tariff_code,
//         postal_code: address?.postal_code,
//         packages,
//       },
//     });
//     throw new Error(`Ошибка CDEK API: ${error.response?.data?.message || error.message}`);
//   }
// };

// const createOrder = async ({ tariff_code, address, user, packages }) => {
//   try {
//     if (!address.postal_code) {
//       throw new Error('Почтовый индекс адреса не указан');
//     }

//     console.log('SDEK: Создание заказа', {
//       tariff_code,
//       postal_code: address.postal_code,
//       package_count: packages.length,
//       userId: user.id,
//     });

//     const token = await getAccessToken();

//     const response = await axios.post(
//       `${CDEK_API_URL}/orders`,
//       {
//         tariff_code,
//         sender: { name: 'Ваш магазин' },
//         recipient: {
//           name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Клиент',
//           phones: user.phone ? [{ number: user.phone }] : [],
//           email: user.email || 'no-email@example.com',
//         },
//         from_location: { postal_code: '101000' },
//         to_location: {
//           postal_code: address.postal_code,
//           city: address.city || '',
//           address: `${address.street || ''}, ${address.house || ''}${
//             address.building ? `, корп. ${address.building}` : ''
//           }${address.apartment ? `, кв. ${address.apartment}` : ''}`.trim(),
//         },
//         packages: packages.map((pkg) => ({
//           ...pkg,
//           weight: Math.round(pkg.weight * 1000), 
//         })),
//       },
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );

//     const tracking_number = response.data.entity?.uuid;
//     if (!tracking_number) {
//       throw new Error('Не удалось получить номер отслеживания от CDEK');
//     }

//     console.log('SDEK: Заказ создан', { tracking_number });
//     return tracking_number;
//   } catch (error) {
//     console.error('SDEK: Ошибка при создании заказа', {
//       message: error.response?.data?.message || error.message,
//       status: error.response?.status,
//       stack: error.stack,
//     });
//     throw new Error(`Ошибка CDEK API: ${error.response?.data?.message || error.message}`);
//   }
// };

// const calculateDeliveryCost = async (order) => {
//   return {
//     cost: 500,
//     estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
//   };
// };

// const getTrackingInfo = async (trackingNumber) => {
//   return {
//     trackingNumber,
//     status: 'В пути',
//     lastUpdate: new Date(),
//     estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
//   };
// };

// module.exports = {
//   calculateDeliveryCost,
//   getTrackingInfo,
//   calculateDelivery,
//   createOrder,
// };

const dotenv = require('dotenv');

dotenv.config();

const calculateDelivery = async ({ address, tariff_code, packages }) => {
  console.warn('SDEK: Используется заглушка для расчета доставки', {
    tariff_code,
    postal_code: address?.postal_code,
    package_count: packages?.length,
  });

  return {
    delivery_sum: 500, 
    period_min: 1,
    period_max: 3, 
  };
};

const createOrder = async ({ tariff_code, address, user, packages }) => {
  console.warn('SDEK: Используется заглушка для создания заказа', {
    tariff_code,
    postal_code: address?.postal_code,
    userId: user?.id,
    package_count: packages?.length,
  });

  const tracking_number = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return tracking_number;
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

const generateFakeTrackingNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FAKE-';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  calculateDeliveryCost,
  getTrackingInfo,
  calculateDelivery,
  createOrder,
};