import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <nav className="header-nav">
        <div className="nav-left">
          <Link to="/">Главная</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <div className="nav-right">
          <Link to="/profile">Профиль</Link>
          <Link to="/cart">Корзина</Link>
          {user?.role === 'admin' && <Link to="/admin">Админ</Link>}
          {user?.role === 'manager' && <Link to="/manager">Менеджер</Link>}
          {user ? (
            <button onClick={logout}>Выйти</button>
          ) : (
            <>
              <Link to="/login">Вход</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;