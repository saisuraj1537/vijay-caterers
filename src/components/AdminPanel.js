import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove, set, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import emailjs from 'emailjs-com';
import html2pdf from 'html2pdf.js';

function AdminPanel() {
  const [bookings, setBookings] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [sendingEmailFor, setSendingEmailFor] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'
    const [priceInputs, setPriceInputs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const mobile = localStorage.getItem('loggedInMobile');
    const role = localStorage.getItem('role');
    if (mobile === '9866937747' && role === 'admin') {
      fetchFinalBookings();
      fetchUserNames();
    }
  }, []);

   const CATEGORY_ORDER = [
    'sweets', 'juices', 'vegSnacks', 'hots', 'rotis',
    'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
    'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
    'avakayalu', 'powders', 'curds', 'papads', 'chatItems', 'chineseList',
    'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams','pan','soda',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'seaFoods',
    'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
    'crabItems', 'nonVegBiryanis', 'customItems'
  ];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isPastDate = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    if (isNaN(date)) return false;
    return date < new Date(today.setHours(0, 0, 0, 0));
  };

  const handlePriceChange = (key, value) =>
    setPriceInputs(prev => ({ ...prev, [key]: value }));

  const savePricePerPlate = booking => {
    const price = priceInputs[booking.customerKey];
    if (!price) return alert('Enter a valid price per plate.');
    const db = getDatabase();
    update(ref(db, `finalBookings/${booking.userMobile}/${booking.customerKey}/details`), { pricePerPlate: price })
      .then(() => setBookings(curr =>
        curr.map(b =>
          b.customerKey === booking.customerKey ? {
            ...b,
            details: { ...b.details, pricePerPlate: price }
          } : b
        )
      ))
      .catch(console.error);
  };

  const fetchUserNames = () => {
    const db = getDatabase();
    onValue(ref(db, 'users'), snap => {
      const data = snap.val() || {};
      setUserNames(Object.fromEntries(Object.entries(data).map(([m, u]) => [m, u.name])));
    });
  };

  const fetchFinalBookings = () => {
    const db = getDatabase();
    onValue(ref(db, 'finalBookings'), snap => {
      const data = snap.val() || {};
      const loaded = [];
      Object.entries(data).forEach(([userMobile, customers]) =>
        Object.entries(customers).forEach(([key, value]) =>
          loaded.push({ userMobile, customerKey: key, details: value.details || {}, items: value.items || {} })
        )
      );
      const sorted = loaded.sort((a, b) => new Date(a.details.eventDate) - new Date(b.details.eventDate));
      setBookings(sorted);
    });
  };

   const generatePdf = (booking) => {
    const filename = `Order_${booking.details.name.replace(/\s/g, '_')}_${formatDate(booking.details.eventDate)}.pdf`;
  
  
    const categoryOrder = CATEGORY_ORDER;
  
    const selectedItems = booking.items || {};
    const normalizedSelectedItems = {};
    Object.entries(selectedItems).forEach(([key, value]) => {
      normalizedSelectedItems[key.toLowerCase()] = value;
    });
  
    const inputKeys = Object.keys(normalizedSelectedItems);
    const orderedCategories = categoryOrder.filter(cat =>
      inputKeys.includes(cat.toLowerCase())
    );
    const extraCategories = inputKeys.filter(
      key => !categoryOrder.some(cat => cat.toLowerCase() === key)
    );
    const allCategories = [...orderedCategories, ...extraCategories];
  
    const formatCategory = (text) =>
      text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());
  
    const itemsHtml = allCategories.map(category => {
      const items = normalizedSelectedItems[category.toLowerCase()];
      const itemsArray = Array.isArray(items)
        ? items
        : typeof items === 'object'
          ? Object.keys(items)
          : [];
  
      if (!itemsArray || itemsArray.length === 0) return '';
  
      const formattedItems = itemsArray.map(item =>
        `<li style="margin: 4px 0;">🍽️ ${typeof item === 'string' ? item : item.name}</li>`
      ).join('');
  
      const formattedCategory = formatCategory(category);
  
      return `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h4 style="color: #8B4513; margin: 8px 0; font-size: 15px;">${formattedCategory}</h4>
          <ul style="margin: 0; padding-left: 20px; color: #555; page-break-inside: avoid;">
            ${formattedItems}
          </ul>
        </div>
      `;
    }).join('');
  
    const content = `
    <div style="font-family: 'Georgia', serif; padding: 30px; color: #3c3c3c; background-color: #fffbe6; border: 10px solid #f5e1a4; box-sizing: border-box; height : 100%;">
  
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="font-size: 24px; color: #b8860b;">Vijay Caterers</h1>
        <p style="font-style: italic; color: #555;">"Elevate your event with our exceptional catering services"</p>
      </div>
  
      <hr style="border: 0; border-top: 2px dashed #d2b48c; margin: 20px 0;" />
  
      <!-- Booking Info -->
      <div style="margin-bottom: 25px;">
        <h2 style="color: #8B4513; font-size: 18px; margin-bottom: 12px;">Order Details</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1 1 45%;">
            <p><strong>Name:</strong> ${booking.details.name}</p>
            <p><strong>Mobile:</strong> ${booking.details.mobile}</p>
            <p><strong>Email:</strong> ${booking.details.email || '-'}</p>
            <p><strong>Event Date:</strong> ${formatDate(booking.details.eventDate)}</p>
  
          </div>
          <div style="flex: 1 1 45%;">
            
            <p><strong>Event Time:</strong> ${booking.details.eventTime}</p>
            <p><strong>Event Place:</strong> ${booking.details.eventPlace}</p>
            <p><strong>No. of Plates:</strong> ${booking.details.plates}</p>
            <p><strong>Price Per Plate:</strong> ₹${booking.details.pricePerPlate || '-'}</p>
          </div>
        </div>
      </div>
  
      <hr style="border: 0; border-top: 2px dashed #d2b48c; margin: 20px 0;" />
  
      <!-- Selected Items -->
      <div style="margin-bottom: 30px;">
        <h2 style="color: #8B4513; font-size: 18px;">Selected Items</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
          ${itemsHtml}
        </div>
      </div>
  
      <!-- Terms and Conditions Page -->
    <div style="page-break-before: always; padding: 40px; font-family: 'Georgia', serif; background-color: #fffbe6; border: 10px solid #f5e1a4; box-sizing: border-box; margin-top : 40px;">
      <h2 style="text-align: center; color: #8B4513;">Terms and Conditions</h2>
      <ul style="margin-top: 25px; color: #444; font-size: 14px; line-height: 1.7;">
        <li>Payment can be made by cash, bank transfer, or cheque (cheque clearance is mandatory before event).</li>
        <li>20% advance on the day of booking, 70% before 1 week of the party, and remaining balance to be paid after the event.</li>
        <li>Final menu must be confirmed at least 5 days in advance.</li>
        <li>Extra plates will be charged separately.</li>
      </ul>
      <p style="margin-top: 30px; text-align: center; font-style: italic; color: #777;">Thank you for choosing Vijay Caterers!</p>
    </div>
  
      <!-- Footer -->
      <div style="border-top: 1px solid #f0e1c6; padding-top: 20px; font-size: 0.9em; text-align: center; color: #777; margin-bottom:570px">
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 10px;">
          <span>📍 Kukatpally, Hyderabad, Telangana</span>
          <span>📞 9866937747 / 9959500833 / 9676967747</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
          <span>📧 <a href="mailto:vijaycaterers2005@gmail.com" style="color: #b8860b;">vijaycaterers2005@gmail.com</a></span>
          <span>📸 Instagram: <a href="https://www.instagram.com/vijaycaterers_?igsh=Y2p3NGNmdmhhOXU%3D&utm_source=qr"  style="color: #b8860b;">@vijaycaterers_</a></span>
        </div>
        <p style="margin-top: 10px;">🌟 We appreciate your trust in our services. Have a delicious event! 🌟</p>
      </div>
    </div>
  
    
  `;
  
    html2pdf().from(content).save(filename);
  };

  const handleDelete = (userMobile, customerKey) => {
  const confirmed = window.confirm('Are you sure you want to delete this booking?');
  if (!confirmed) return;

  const db = getDatabase();
  const bookingRef = ref(db, `finalBookings/${userMobile}/${customerKey}`);

  onValue(bookingRef, (snap) => {
    const bookingData = snap.val();
    if (bookingData) {
      const deleteRef = ref(db, `deleteBooking/${userMobile}/${customerKey}`);
      // Write to deleteBooking
      set(deleteRef, bookingData)
        .then(() => {
          // Remove from finalBookings
          remove(bookingRef)
            .then(() => {
              alert('🗑️ Booking moved to deleted bookings.');
            })
            .catch((err) => {
              console.error('Error removing booking:', err);
              alert('❌ Failed to remove booking.');
            });
        })
        .catch((err) => {
          console.error('Error logging deletion:', err);
          alert('❌ Failed to log deleted booking.');
        });
    } else {
      alert('❌ Booking not found.');
    }
  }, {
    onlyOnce: true
  });
};


  const handleEdit = booking => {
    navigate('/final-select-items', {
      state: { booking: { ...booking, customerName: booking.customerKey } }
    });
  };

  const toggleCard = key => {
    setExpandedCustomer(prev => (prev === key ? null : key));
  };

  const sendEmail = async booking => {
    setSendingEmailFor(booking.customerKey);
    const mapping = Object.entries(booking.items)
      .filter(([, list]) => Array.isArray(list) && list.length > 0)
      .map(([category, list]) => `${category}: ${list.join(', ')}`)
      .join('\n');

    const params = {
      to_name: booking.details.name,
      to_email: booking.details.email || "saisuraj2712@gmail.com",
      mobile: booking.details.mobile,
      event_date: booking.details.eventDate,
      event_time: booking.details.eventTime,
      event_place: booking.details.eventPlace,
      plates: booking.details.plates,
      items_list: mapping || 'No items selected'
    };

    try {
      await emailjs.send(
        'service_kivxb5n',
        'template_r4bbtgo',
        params,
        'iUiGZIlVDq2uX3_d0'
      );
      alert('📧 Email sent!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to send email.');
    } finally {
      setSendingEmailFor(null);
    }
  };

  const filteredBookings = bookings.filter(b =>
    filter === 'past' ? isPastDate(b.details.eventDate) : !isPastDate(b.details.eventDate)
  );

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Manage customer bookings</p>
        <div className="filter-buttons">
          <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`} onClick={() => setFilter('upcoming')}>Upcoming Events</button>
          <button className={`filter-btn ${filter === 'past' ? 'active' : ''}`} onClick={() => setFilter('past')}>Past Events</button>
        </div>
      </header>

      <main className="admin-content">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No {filter} bookings</h3>
            <p>{filter === 'upcoming' ? 'Future' : 'Past'} events will be shown here.</p>
          </div>
        ) : (
          <div className="booking-grid">
            {filteredBookings.map(bk => {
              const { userMobile, customerKey, details, items } = bk;
              const takenBy = userNames[userMobile] || userMobile;
              const isExpanded = expandedCustomer === customerKey;
              const isPast = isPastDate(details.eventDate);
              const itemCount = items && typeof items === 'object'
                ? Object.values(items).filter(Array.isArray).reduce((sum, list) => sum + list.length, 0)
                : 0;

              return (
                <div
                  key={customerKey}
                  className={`booking-card ${isExpanded ? 'expanded' : ''} ${isPast ? 'past-event' : ''}`}
                  onClick={(e) => {
  if (isPast) return;
  // prevent toggle if clicking on input, button, or their children
  const tag = e.target.tagName.toLowerCase();
  if (['input', 'button', 'svg', 'path', 'label'].includes(tag)) return;
  toggleCard(customerKey);
}}

                >
                  <div className="booking-card-header">
                    <h3 className="customer-name">{details.name}</h3>
                    <span className="item-count">{itemCount} items</span>
                  </div>

                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">Mobile:</span>
                      <span className="detail-value">{details.mobile}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Event Date:</span>
                      <span className="detail-value">{formatDate(details.eventDate)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Plates:</span>
                      <span className="detail-value">{details.plates}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Agent:</span>
                      <span className="detail-value agent">{takenBy}</span>
                    </div>
                    <div className="detail-row">
  <span className="detail-label">Price/Plate:</span>
  <span className="detail-value">
    ₹{details.pricePerPlate ? details.pricePerPlate : '-'}
  </span>
</div>

                  </div>
                  

                  {isExpanded && !isPast && (
                    <div className="booking-expanded">
                      <div className="price-edit">
                      <label>Price per plate:</label>
                      <input
  type="number"
  value={priceInputs[customerKey] || ''}
  onChange={e => handlePriceChange(customerKey, e.target.value)}
/>
<button onClick={() => savePricePerPlate(bk)}>Save</button>
                    </div>
                      <div className="items-section">
                        <h4 className="section-title">Selected Items</h4>
                        <div className="items-grid">
                          {[
  'sweets', 'juices', 'vegSnacks', 'hots', 'rotis',
  'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
  'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
  'avakayalu', 'powders', 'curds', 'papads', 'chatItems', 'chineseList',
  'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams',
  'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'seaFoods',
  'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
  'crabItems', 'nonVegBiryanis', 'customItems'
].map(cat => {
  const list = items[cat];
  if (!Array.isArray(list) || list.length === 0) return null;
  return (
    <div key={cat} className="category-group">
      <h5 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h5>
      <ul className="item-list">
        {list.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
})}

                        </div>
                      </div>

                      <div className="action-buttons vertical">
      <button className="btn btn-edit" onClick={e => { e.stopPropagation(); handleEdit(bk); }}>
        ✏️ Edit Booking
      </button>

      <button className="btn btn-email" onClick={e => { e.stopPropagation(); sendEmail(bk); }} disabled={sendingEmailFor === customerKey}>
        {sendingEmailFor === customerKey ? <span className="spinner"></span> : '📧 Send Confirmation'}
      </button>

      

      <button className="btn btn-pdf" onClick={e => { e.stopPropagation(); generatePdf(bk); }}>
        📄 Download PDF
      </button>

      <button className="btn btn-whatsapp" onClick={e => {
        e.stopPropagation();
        const phone = bk.details.mobile.replace(/\D/g, '');
        const message = encodeURIComponent(
`*🌟 Booking Confirmation - Vijay Caterers 🌟*

Hello *${bk.details.name}*,

📅 *Date:* ${formatDate(bk.details.eventDate)}
📍 *Venue:* ${bk.details.eventPlace}
🕒 *Time:* ${bk.details.eventTime}
🍽️ *Plates:* ${bk.details.plates}
💰 *Price/Plate:* ₹${bk.details.pricePerPlate || 'N/A'}

Thank you for choosing *Vijay Caterers*! 🙏

📞 9866937747 | 📧 vijaycaterers2005@gmail.com`
        );
        window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
      }}>
        📱 WhatsApp
      </button>
      <button className="btn btn-delete" onClick={e => { e.stopPropagation(); handleDelete(userMobile, customerKey); }}>
        🗑️ Delete Booking
      </button>
    </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
      .price-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
  background: #f4f6f8;
  padding: 0.75rem;
  border-radius: 6px;
}

.price-edit label {
  font-weight: 500;
  color: #34495e;
  margin-right: 4px;
}

.price-edit input {
  width: 100px;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.price-edit input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.price-edit button {
  background-color: #2ecc71;
  color: white;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.price-edit button:hover {
  background-color: #27ae60;
}


      .btn-pdf {
  background: #e67e22;
  color: white;
}
.btn-pdf:hover {
  background: #ca6f1e;
}

.btn-whatsapp {
  background: #25D366;
  color: white;
}
.btn-whatsapp:hover {
  background: #1ebe5b;
}

        .filter-buttons {
          margin-top: 1rem;
          display: flex;
          gap: 1rem;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          font-weight: 600;
          border: 1px solid #ccc;
          background-color: white;
          border-radius: 5px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        .filter-btn.active {
          background-color: #3498db;
          color: white;
          border-color: #3498db;
        }

        .filter-btn:hover {
          background-color: #ecf0f1;
        }

        

        .past-event {
          opacity: 0.5;
          pointer-events: none;
          background-color: #f0f0f0 !important;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #2c3e50;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* Keep rest of your CSS below */



        .admin-panel-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
          color: #333;
        }

        .admin-header {
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #eaeaea;
        }

        .admin-title {
          font-size: 2rem;
          font-weight: 600;
          color: #2c3e50;
          margin: 0;
        }

        .admin-subtitle {
          font-size: 1rem;
          color: #7f8c8d;
          margin: 0.5rem 0 0;
        }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          margin-top: 2rem;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .empty-state p {
          color: #7f8c8d;
          margin: 0;
        }

        .booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .booking-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.2s ease;
          border: 1px solid #eaeaea;
        }

        .booking-card:hover {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .booking-card.expanded {
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
        }

        .booking-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: #f8f9fa;
          border-bottom: 1px solid #eaeaea;
        }

        .customer-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .item-count {
          background: #3498db;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .booking-details {
          padding: 1.25rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .detail-value {
          color: #2c3e50;
          text-align: right;
        }

        .detail-value.agent {
          color: #27ae60;
          font-weight: 500;
        }

        .booking-expanded {
          padding: 0 1.25rem 1.25rem;
          background: #f8fafc;
          border-top: 1px solid #eaeaea;
        }

        .items-section {
          margin: 1rem 0;
        }

        .section-title {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7f8c8d;
          margin: 1rem 0;
        }

        .items-grid {
          display: grid;
          gap: 1rem;
        }

        .category-group {
          background: white;
          padding: 0.75rem;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .category-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #3498db;
          margin: 0 0 0.5rem;
        }

        .item-list {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.85rem;
          color: #34495e;
        }

        .item-list li {
          margin-bottom: 0.25rem;
        }

        .item-list li:last-child {
          margin-bottom: 0;
        }

        .action-buttons {
  display: flex;
  flex-direction: column; /* ensure vertical layout */
  gap: 12px;
  margin-top: 1.5rem;
}
  .action-buttons.vertical {
  flex-direction: column !important;
}

        .btn {
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
}

        .btn-edit {
          background: #3498db;
          color: white;
        }

        .btn-edit:hover {
          background: #2980b9;
        }

        .btn-email {
          background: #27ae60;
          color: white;
        }

        .btn-email:hover {
          background: #219653;
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
        }

        .btn-delete:hover {
          background: #c0392b;
        }

        @media (min-width: 768px) {
          .action-buttons {
    flex-direction: row;
    justify-content: space-between;
  }
        }
      `}</style>
    </div>
  );
}

export default AdminPanel;