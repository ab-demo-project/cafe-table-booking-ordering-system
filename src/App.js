import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Change to your backend URL
const BACKEND_URL = 'http://localhost:3000';
const socket = io(BACKEND_URL);

const menuItems = [
  { id: 1, name: 'Coffee', price: 2 },
  { id: 2, name: 'Sandwich', price: 5 },
  { id: 3, name: 'Cake', price: 3 },
];

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableNumber = urlParams.get('table') || 1;

  const [orderItems, setOrderItems] = useState(menuItems.map(i => ({ ...i, quantity: 0 })));
  const [orders, setOrders] = useState([]);

  // Fetch existing orders for staff view
  useEffect(() => {
    fetch(`${BACKEND_URL}/orders`)
      .then(res => res.json())
      .then(data => setOrders(data));
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    socket.on('new-order', order => setOrders(prev => [order, ...prev]));
    socket.on('update-order', ({ id, status }) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    });
    return () => {
      socket.off('new-order');
      socket.off('update-order');
    };
  }, []);

  const handleQuantityChange = (id, value) => {
    setOrderItems(prev =>
      prev.map(i => i.id === id ? { ...i, quantity: parseInt(value) } : i)
    );
  };

  const placeOrder = () => {
    const itemsToOrder = orderItems.filter(i => i.quantity > 0);
    if (itemsToOrder.length === 0) return alert('Select at least one item');

    fetch(`${BACKEND_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: tableNumber, items: itemsToOrder })
    })
      .then(res => res.json())
      .then(data => alert(`Order Placed! ID: ${data.orderId}`));
  };

  const updateStatus = (id, status) => {
    fetch(`${BACKEND_URL}/order/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Cafe Order System</h1>
      <h2>Table: {tableNumber}</h2>

      <h3>Menu</h3>
      {orderItems.map(item => (
        <div key={item.id} style={{ margin: '10px 0' }}>
          {item.name} - ${item.price}
          <input
            type="number"
            min="0"
            value={item.quantity}
            onChange={e => handleQuantityChange(item.id, e.target.value)}
            style={{ marginLeft: '10px', width: '50px' }}
          />
        </div>
      ))}
      <button onClick={placeOrder} style={{ marginTop: '10px', padding: '5px 15px' }}>Place Order</button>

      <h3 style={{ marginTop: '30px' }}>Orders (Staff View)</h3>
      {orders.map(order => (
        <div key={order.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <b>Table {order.table_number}</b> - Status: <span>{order.status}</span>
          <ul>
            {order.items.map(i => <li key={i.id}>{i.name} x {i.quantity}</li>)}
          </ul>
          <button onClick={() => updateStatus(order.id, 'preparing')}>Preparing</button>
          <button onClick={() => updateStatus(order.id, 'ready')}>Ready</button>
          <button onClick={() => updateStatus(order.id, 'served')}>Served</button>
        </div>
      ))}
    </div>
  );
}

export default App;