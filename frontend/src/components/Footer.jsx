import { FaTelegramPlane, FaVk, FaWhatsapp } from 'react-icons/fa';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-left">
          <p>© 2025 Alesandro Vitorio</p>
        </div>

        <div className="footer-center">
          <a href="https://t.me/your_username" target="_blank" rel="noopener noreferrer">
            <FaTelegramPlane />
          </a>
          <a href="https://vk.com/your_page" target="_blank" rel="noopener noreferrer">
            <FaVk />
          </a>
          <a href="https://wa.me/71234567890" target="_blank" rel="noopener noreferrer">
            <FaWhatsapp />
          </a>
        </div>

        <div className="footer-right">
          <a href="/privacy">Политика конфиденциальности</a>
          <a href="/terms">Условия использования</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
