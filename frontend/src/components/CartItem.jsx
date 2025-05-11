function CartItem({ item, updateCart, removeFromCart }) {
    return (
      <div>
        <p>{item.name} - Size: {item.size} - Qty: {item.quantity} - ${item.price * item.quantity}</p>
        <button onClick={() => updateCart(item.id, item.quantity + 1)}>+</button>
        <button onClick={() => updateCart(item.id, item.quantity - 1)}>-</button>
        <button onClick={() => removeFromCart(item.id)}>Remove</button>
      </div>
    );
  }
  
  export default CartItem;