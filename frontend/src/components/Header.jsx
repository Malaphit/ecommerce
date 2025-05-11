import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header>
      <nav>
        <Link to="/">Home</Link> | <Link to="/faq">FAQ</Link> | <Link to="/profile">Profile</Link> |{' '}
        <Link to="/cart">Cart</Link> | {user?.role === 'admin' && <Link to="/admin">Admin</Link>} |{' '}
        {user?.role === 'manager' && <Link to="/manager">Manager</Link>} |{' '}
        {user ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;