export const getCart = () => {
    return JSON.parse(localStorage.getItem('cart')) || [];
  };
  
  export const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
  };
  
  export const addToCart = (product, size, quantity = 1) => {
    const cart = getCart();
    const existingItem = cart.find(
      (item) => item.id === product.id && item.size === size
    );
  
    let updatedCart;
    if (existingItem) {
      updatedCart = cart.map((item) =>
        item.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, size, quantity }];
    }
  
    saveCart(updatedCart);
  };
  