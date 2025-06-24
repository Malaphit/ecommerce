import { useState } from 'react';

function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'Как оформить заказ?',
      answer: 'Просмотрите каталог, добавьте товары в корзину и перейдите к оформлению заказа.',
    },
    {
      question: 'Какие способы оплаты доступны?',
      answer: 'Интеграция с платёжной системой (например, SberPay) появится скоро. Следите за новостями!',
    },
    {
      question: 'Как отследить заказ?',
      answer: 'После отправки вы получите номер его можно посмотреть в профиле.',
    },
    {
      question: 'Как работает реферальная программа?',
      answer: 'Приглашайте друзей с помощью реферального кода и получайте бонусные баллы.',
    },
    {
      question: 'Можно ли вернуть товар?',
      answer: 'Да, возврат возможен в течение 14 дней при соблюдении условий возврата.',
    },
  ];

  const toggleAnswer = (index) => {
    setActiveIndex(index === activeIndex ? null : index);
  };

  return (
    <div className="faq-container">
      <h1>Часто задаваемые вопросы</h1>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`faq-item ${activeIndex === index ? 'active' : ''}`}
            onClick={() => toggleAnswer(index)}
          >
            <div className="faq-question">
              <span>{faq.question}</span>
              <span className="faq-toggle">{activeIndex === index ? '−' : '+'}</span>
            </div>
            {activeIndex === index && <div className="faq-answer">{faq.answer}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQ;
