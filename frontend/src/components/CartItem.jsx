function CartItem({ item, updateCart, removeFromCart }) {
  return (
    <div className="cart-item">
      <img
        src={item.Product.ProductImages?.[0]?.url ? `${process.env.REACT_APP_API_URL}${item.Product.ProductImages[0].url}` : '/placeholder.jpg'}
        alt={item.name}
        style={{ width: '100px', height: '100px' }}
      />
      <div>
        <p>{item.name}</p>
        <p>Размер: {item.size}</p>
        <p>Цена: {item.price.toFixed(2)} ₽</p>
        <p>Количество: {item.quantity}</p>
        <p>Итого: {(item.price * item.quantity).toFixed(2)} ₽</p>
        <button onClick={() => updateCart(item.id, item.quantity + 1)}>+</button>
        <button onClick={() => updateCart(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
          -
        </button>
        <button onClick={() => removeFromCart(item.id)}>Удалить</button>
      </div>
    </div>
  );
}

export default CartItem;