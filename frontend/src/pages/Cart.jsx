import { useState, useEffect } from 'react';
import CartItem from '../components/CartItem';
import Checkout from '../components/Checkout';

function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
  }, []);

  const updateCart = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    const updatedCart = cart.map((item) =>
      item.id === id ? { ...item, quantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // const addToCart = (product, size, quantity) => {
  //   const existingItem = cart.find((item) => item.id === product.id && item.size === size);
  //   let updatedCart;
  //   if (existingItem) {
  //     updatedCart = cart.map((item) =>
  //       item.id === product.id && item.size === size
  //         ? { ...item, quantity: item.quantity + quantity }
  //         : item
  //     );
  //   } else {
  //     updatedCart = [...cart, { ...product, size, quantity }];
  //   }
  //   setCart(updatedCart);
  //   localStorage.setItem('cart', JSON.stringify(updatedCart));
  // };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div>
      <h1>Cart</h1>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {cart.map((item) => (
            <CartItem
              key={`${item.id}-${item.size}`}
              item={item}
              updateCart={updateCart}
              removeFromCart={removeFromCart}
            />
          ))}
          <p>Total: ${total.toFixed(2)}</p>
          <Checkout />
        </>
      )}
    </div>
  );
}

export default Cart;