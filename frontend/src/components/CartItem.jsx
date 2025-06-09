function CartItem({ item, updateCart, removeFromCart }) {
  return (
    <div className="cart-item">
      <img
        src={
          item.image
            ? `${process.env.REACT_APP_API_URL}${item.image}`
            : '/placeholder.jpg'
        }
        alt={item.name}
        style={{ width: '100px', height: '100px' }}
      />
      <div>
        <p>{item.name}</p>
        <p>Размер: {item.size}</p>
        <p>Цена: {Number(item.price).toFixed(2)} ₽</p>
        <p>Количество: {item.quantity}</p>
        <p>Итого: {(Number(item.price) * item.quantity).toFixed(2)} ₽</p>
        <button
  onClick={() => {
    console.log('Удалить товар с id:', item.id);
    removeFromCart(item.id);
  }}
>
  Удалить
</button>
      </div>
    </div>
  );
}

export default CartItem;