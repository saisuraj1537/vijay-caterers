// components/ItemCard.js
import React from 'react';

const ItemCard = ({ item, onBook }) => {
  const [quantity, setQuantity] = React.useState(1);

  return (
    <div className="card">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <p>₹{item.price}</p>
      <input
        type="number"
        value={quantity}
        min={1}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <button onClick={() => onBook(item, quantity)}>Book</button>
    </div>
  );
};

export default ItemCard;
