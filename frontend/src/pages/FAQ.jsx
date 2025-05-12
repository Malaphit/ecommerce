function FAQ() {
    const faqs = [
      {
        question: 'How do I place an order?',
        answer: 'Browse the catalog, add items to your cart, and proceed to checkout.',
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'Payment integration (e.g., SberPay) is coming soon. Stay tuned!',
      },
      {
        question: 'How can I track my order?',
        answer: 'Once shipped, you’ll receive a tracking number via email.',
      },
      {
        question: 'How does the referral program work?',
        answer: 'Invite friends with your referral code to earn bonus points.',
      },
    ];
  
    return (
      <div>
        <h1>Frequently Asked Questions</h1>
        {faqs.map((faq, index) => (
          <div key={index}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
      </div>
    );
  }
  
  export default FAQ;