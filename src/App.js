import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Trash2, Eye, Download, Search, Filter, Bell, Clock, TrendingUp, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const CafeOrderingSystem = () => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [view, setView] = useState('admin');
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reportView, setReportView] = useState('daily');

  useEffect(() => {
    loadData();
    const interval = setInterval(checkNewOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableId = params.get('table');
    if (tableId && tables.length > 0) {
      const table = tables.find(t => t.id === parseInt(tableId));
      if (table) {
        setSelectedTable(table);
        setView('table');
      }
    }
  }, [tables]);

  const loadData = async () => {
    try {
      const [tablesRes, ordersRes, menuRes, notifRes] = await Promise.all([
        window.storage.get('cafe_tables').catch(() => null),
        window.storage.get('cafe_orders').catch(() => null),
        window.storage.get('cafe_menu').catch(() => null),
        window.storage.get('cafe_notifications').catch(() => null)
      ]);

      if (tablesRes) setTables(JSON.parse(tablesRes.value));
      if (ordersRes) setOrders(JSON.parse(ordersRes.value));
      if (notifRes) setNotifications(JSON.parse(notifRes.value));
      
      if (menuRes) {
        setMenuItems(JSON.parse(menuRes.value));
      } else {
        const defaultMenu = [
          { id: 1, name: 'Espresso', price: 3.5, category: 'Coffee' },
          { id: 2, name: 'Cappuccino', price: 4.5, category: 'Coffee' },
          { id: 3, name: 'Latte', price: 5.0, category: 'Coffee' },
          { id: 4, name: 'Croissant', price: 3.0, category: 'Pastry' },
          { id: 5, name: 'Sandwich', price: 7.5, category: 'Food' }
        ];
        setMenuItems(defaultMenu);
        await window.storage.set('cafe_menu', JSON.stringify(defaultMenu));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkNewOrders = async () => {
    try {
      const ordersRes = await window.storage.get('cafe_orders').catch(() => null);
      if (ordersRes) {
        const storedOrders = JSON.parse(ordersRes.value);
        const newOrders = storedOrders.filter(so => 
          !orders.find(o => o.id === so.id) && so.status === 'pending'
        );
        
        if (newOrders.length > 0) {
          setOrders(storedOrders);
          newOrders.forEach(order => {
            addNotification(`New order from Table ${order.tableNumber}`, 'new_order');
            if (soundEnabled) playNotificationSound();
          });
        }
      }
    } catch (error) {
      console.error('Error checking orders:', error);
    }
  };

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const addNotification = async (message, type) => {
    const notif = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [notif, ...notifications].slice(0, 50);
    setNotifications(updated);
    await window.storage.set('cafe_notifications', JSON.stringify(updated));
  };

  const markNotificationsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await window.storage.set('cafe_notifications', JSON.stringify(updated));
  };

  const saveData = async (type, data) => {
    try {
      await window.storage.set(`cafe_${type}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
    }
  };

  const addTable = async () => {
    const newTable = {
      id: Date.now(),
      number: tables.length + 1,
      status: 'available',
      createdAt: new Date().toISOString()
    };
    const updated = [...tables, newTable];
    setTables(updated);
    await saveData('tables', updated);
  };

  const deleteTable = async (id) => {
    const updated = tables.filter(t => t.id !== id);
    setTables(updated);
    await saveData('tables', updated);
  };

  const updateTableStatus = async (id, status) => {
    const updated = tables.map(t => t.id === id ? { ...t, status } : t);
    setTables(updated);
    await saveData('tables', updated);
  };

  const addMenuItem = async () => {
    if (!newItem.name || !newItem.price) return;
    const item = {
      id: Date.now(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category || 'Other'
    };
    const updated = [...menuItems, item];
    setMenuItems(updated);
    await saveData('menu', updated);
    setNewItem({ name: '', price: '', category: '' });
  };

  const deleteMenuItem = async (id) => {
    const updated = menuItems.filter(i => i.id !== id);
    setMenuItems(updated);
    await saveData('menu', updated);
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const order = {
      id: Date.now(),
      tableId: selectedTable.id,
      tableNumber: selectedTable.number,
      items: cart,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    const updated = [...orders, order];
    setOrders(updated);
    await saveData('orders', updated);
    await updateTableStatus(selectedTable.id, 'occupied');
    setCart([]);
    alert('Order placed successfully! Your order will be prepared shortly.');
    setView('admin');
  };

  const updateOrderStatus = async (orderId, status) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    await saveData('orders', updated);
    
    const order = updated.find(o => o.id === orderId);
    if (status === 'completed') {
      await updateTableStatus(order.tableId, 'available');
      await addNotification(`Order for Table ${order.tableNumber} completed`, 'completed');
    } else if (status === 'preparing') {
      await addNotification(`Table ${order.tableNumber} order is being prepared`, 'preparing');
    }
  };

  const downloadQR = (table) => {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 0, size, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Table ${table.number}`, size/2, 50);
    
    const qrSize = 240;
    const startX = (size - qrSize) / 2;
    const startY = 100;
    ctx.fillStyle = 'black';
    ctx.fillRect(startX, startY, qrSize, qrSize);
    
    ctx.fillStyle = 'white';
    const cellSize = qrSize / 10;
    for (let i = 1; i < 10; i += 2) {
      for (let j = 1; j < 10; j += 2) {
        ctx.fillRect(startX + i * cellSize, startY + j * cellSize, cellSize, cellSize);
      }
    }
    
    ctx.fillStyle = '#1f2937';
    ctx.font = '20px Arial';
    ctx.fillText('Scan to Order', size/2, 370);
    
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `table-${table.number}-qr.png`;
      a.click();
    });
  };

  const getReportData = () => {
    const now = new Date();
    let filteredOrders = orders;
    
    if (reportView === 'daily') {
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.timestamp);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (reportView === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter(o => new Date(o.timestamp) >= weekAgo);
    } else if (reportView === 'monthly') {
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.timestamp);
        return orderDate.getMonth() === now.getMonth() && 
               orderDate.getFullYear() === now.getFullYear();
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    const itemSales = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!itemSales[item.name]) {
          itemSales[item.name] = { quantity: 0, revenue: 0 };
        }
        itemSales[item.name].quantity += item.quantity;
        itemSales[item.name].revenue += item.price * item.quantity;
      });
    });
    
    const topItems = Object.entries(itemSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      completedOrders,
      avgOrderValue,
      topItems
    };
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.tableNumber.toString().includes(searchTerm) ||
                         order.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const categories = [...new Set(menuItems.map(i => i.category))];
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading cafe system...</p>
        </div>
      </div>
    );
  }

  if (view === 'reports') {
    const reportData = getReportData();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Sales Reports</h1>
              <button onClick={() => setView('admin')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                Back to Admin
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <button onClick={() => setReportView('daily')}
                      className={`px-4 py-2 rounded-lg ${reportView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                Today
              </button>
              <button onClick={() => setReportView('weekly')}
                      className={`px-4 py-2 rounded-lg ${reportView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                This Week
              </button>
              <button onClick={() => setReportView('monthly')}
                      className={`px-4 py-2 rounded-lg ${reportView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                This Month
              </button>
              <button onClick={() => setReportView('all')}
                      className={`px-4 py-2 rounded-lg ${reportView === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                All Time
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Total Orders</h3>
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{reportData.totalOrders}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Total Revenue</h3>
                <DollarSign className="text-green-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-green-600">${reportData.totalRevenue.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Completed</h3>
                <CheckCircle className="text-emerald-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-gray-800">{reportData.completedOrders}</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-600">Avg Order Value</h3>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <p className="text-3xl font-bold text-purple-600">${reportData.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Selling Items</h2>
            {reportData.topItems.length > 0 ? (
              <div className="space-y-3">
                {reportData.topItems.map(([name, data], idx) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-amber-600 text-white rounded-full font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-lg">{name}</div>
                        <div className="text-sm text-gray-600">{data.quantity} orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">${data.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-600">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No sales data for this period</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'table' && selectedTable) {
    const groupedMenu = categories.map(cat => ({
      category: cat,
      items: menuItems.filter(i => i.category === cat)
    }));

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-amber-900">Table {selectedTable.number}</h1>
                <p className="text-gray-600">Select items to order</p>
              </div>
              <button onClick={() => { setView('admin'); setSelectedTable(null); setCart([]); }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                Exit
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              {groupedMenu.map(group => (
                <div key={group.category} className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-bold text-amber-800 mb-3">{group.category}</h2>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 hover:bg-amber-50 rounded transition">
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-amber-600">${item.price.toFixed(2)}</div>
                        </div>
                        <button onClick={() => addToCart(item)}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition">
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4">
                <h2 className="text-xl font-bold text-amber-800 mb-4">Your Order</h2>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="border-b pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold">{item.name}</div>
                              <div className="text-sm text-gray-600">${item.price.toFixed(2)} each</div>
                            </div>
                            <button onClick={() => removeFromCart(item.id)}
                                    className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">-</button>
                            <span className="font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">+</button>
                            <span className="ml-auto font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold mb-4">
                        <span>Total:</span>
                        <span className="text-amber-600">
                          ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                      <button onClick={placeOrder}
                              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition">
                        Place Order
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'orders') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
              <button onClick={() => setView('admin')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                Back to Admin
              </button>
            </div>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 border rounded-lg">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No orders found
              </div>
            ) : (
              filteredOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold">Table {order.tableNumber}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(order.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-600">${order.total.toFixed(2)}</div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold cursor-pointer ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Items:</h4>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Cafe Management System</h1>
              <p className="text-gray-600">Manage tables, menu, orders and view reports</p>
            </div>
            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm text-gray-600">Sound</span>
              </label>
              <button
                onClick={() => { setShowNotifications(!showNotifications); if (showNotifications) markNotificationsRead(); }}
                className="relative p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Bell size={24} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {showNotifications && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-h-96 overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex items-start gap-2">
                      {notif.type === 'new_order' && <AlertCircle className="text-orange-600" size={20} />}
                      {notif.type === 'preparing' && <Clock className="text-blue-600" size={20} />}
                      {notif.type === 'completed' && <CheckCircle className="text-green-600" size={20} />}
                      <div className="flex-1">
                        <p className="font-semibold">{notif.message}</p>
                        <p className="text-xs text-gray-500">{new Date(notif.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <button onClick={() => setView('orders')}
                  className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3 transition transform hover:scale-105">
            <Eye size={24} />
            <span className="text-xl font-semibold">View Orders ({orders.length})</span>
          </button>
          <button onClick={() => setView('reports')}
                  className="p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-3 transition transform hover:scale-105">
            <TrendingUp size={24} />
            <span className="text-xl font-semibold">Sales Reports</span>
          </button>
          <div className="p-6 bg-amber-600 text-white rounded-lg flex items-center justify-center gap-3">
            <Filter size={24} />
            <span className="text-xl font-semibold">Pending: {orders.filter(o => o.status === 'pending').length}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Tables</h2>
              <button onClick={addTable}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition">
                <Plus size={20} /> Add Table
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tables.map(table => (
                <div key={table.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                  <div>
                    <div className="font-semibold text-lg">Table {table.number}</div>
                    <div className={`text-sm inline-block px-2 py-1 rounded ${
                      table.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {table.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedTable(table); setView('table'); }}
                            className="px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition">
                      Open
                    </button>
                    <button onClick={() => downloadQR(table)}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                      <QrCode size={20} />
                    </button>
                    <button onClick={() => deleteTable(table.id)}
                            className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {tables.length === 0 && (
                <p className="text-center text-gray-500 py-8">No tables yet. Add one to get started!</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Menu Items</h2>
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                  className="flex-1 px-3 py-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="flex-1 px-3 py-2 border rounded"
                />
              </div>
              <button onClick={addMenuItem}
                      className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                Add Item
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {menuItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-600">{item.category} - ${item.price.toFixed(2)}</div>
                  </div>
                  <button onClick={() => deleteMenuItem(item.id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CafeOrderingSystem;