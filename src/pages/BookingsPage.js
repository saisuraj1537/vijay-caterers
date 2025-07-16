import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import html2pdf from 'html2pdf.js';
import {counters,CATEGORY_ORDER,getImageBase64} from '../components/AllTextItems'



function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [priceInputs, setPriceInputs] = useState({});

  

  const userPhone = localStorage.getItem("loggedInMobile");

  const NON_VEG_SNACKS = ['chickenSnacks', 'prawnSnacks', 'eggSnacks', 'muttonSnacks'];

  const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-'); // assumes date is in YYYY-MM-DD
  return `${day}/${month}/${year}`;
};


  useEffect(() => {
    const db = getDatabase();
    const bookingsRef = ref(db, `bookings/${userPhone}`);
    const finalBookingsRef = ref(db, `finalBookings/${userPhone}`);

    const unsubscribeBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsList = Object.entries(data).map(([customerName, bookingData]) => ({
          customerName,
          ...bookingData,
        }));
        setBookings(bookingsList);
      } else {
        setBookings([]);
      }
      setLoading(false);
    });

    const unsubscribeFinal = onValue(finalBookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const completedList = Object.entries(data).map(([customerName, bookingData]) => ({
          customerName,
          ...bookingData,
        }));
        setCompletedBookings(completedList);
      } else {
        setCompletedBookings([]);
      }
    });

    return () => {
      unsubscribeBookings();
      unsubscribeFinal();
    };
  }, [userPhone]);

  const handleCardClick = (customerName) => {
  setSelectedCustomer(prev => (prev === customerName ? null : customerName));
  const selectedBooking = bookings.find(b => b.customerName === customerName);
  setPriceInputs(prev => ({
    ...prev,
    [customerName]: selectedBooking?.details?.pricePerPlate || ''
  }));
};

const handlePriceChange = (customerName, value) => {
  setPriceInputs(prev => ({ ...prev, [customerName]: value }));
};

const savePricePerPlate = (booking) => {
  const db = getDatabase();
  const bookingRef = ref(db, `bookings/${userPhone}/${booking.customerName}/details`);

  set(bookingRef, {
    ...booking.details,
    pricePerPlate: priceInputs[booking.customerName],
  });
};

const handleDeleteBooking = (booking) => {
  const db = getDatabase();
  const bookingRef = ref(db, `bookings/${userPhone}/${booking.customerName}`);
  const deleteRef = ref(db, `deleteBooking/${userPhone}/${booking.customerName}`);

  set(deleteRef, {
    details: booking.details,
    items: booking.items || {},
  }).then(() => {
    remove(bookingRef);
  });
};





 const generatePdf = async (booking) => {
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
      `<li style="margin: 2px 0; font-size: 17px; color:black; ">🍽️ ${typeof item === 'string' ? item : item.name}</li>`
    ).join('');

    const formattedCategory = formatCategory(category);

    return `
      <div style="margin-bottom: 10px; page-break-inside: avoid;">
        <h4 style="color: #8B4513; margin: 4px 0; font-size: 15px; font-weight:bold;">${formattedCategory}</h4>
        <ul style="margin: 0; padding-left: 16px; color: #555; page-break-inside: avoid;">
          ${formattedItems}
        </ul>
      </div>
    `;
  }).join('');

  const logoUrl = "https://res.cloudinary.com/dnllne8qr/image/upload/v1735446856/WhatsApp_Image_2024-12-27_at_8.13.22_PM-removebg_m3863q.png";
  const logoBase64 = await getImageBase64(logoUrl);
  const logoImageTag = logoBase64
    ? `<img src="${logoBase64}" alt="Vijay Caterers Logo" style="max-width: 140px; height: auto; margin-bottom: 5px;">`
    : '';

  const content = `
    <div style="font-family: 'Georgia', serif; font-size: 16px; color: #3c3c3c; background-color: #fffbe6; border: 8px solid #f5e1a4; box-sizing: border-box; min-height: 100vh; display: flex; flex-direction: column; padding-bottom:470px;">
      
      <div style="text-align: center; padding: 15px; border-bottom: 2px dashed #d2b48c;">
        ${logoImageTag}
        <h1 style="font-size: 26px; color: #b8860b; margin: 4px 0;">Vijay Caterers</h1>
        <p style="font-style: italic; color: #555; margin-top: 4px;">"Elevate your event with our exceptional catering services"</p>
      </div>

      <div style="flex-grow: 1; padding: 20px;">
        <div style="margin-bottom: 15px;">
          <h2 style="color: #8B4513; font-size: 17px; margin-bottom: 8px;">Order Details</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 16px;">
            <div style="flex: 1 1 45%;">
              <p style="margin: 2px 0;"><strong>Name:</strong> ${booking.details.name}</p>
              <p style="margin: 2px 0;"><strong>Mobile:</strong> ${booking.details.mobile}</p>
              <p style="margin: 2px 0;"><strong>Email:</strong> ${booking.details.email || '-'}</p>
              <p style="margin: 2px 0;"><strong>Event Date:</strong> ${formatDate(booking.details.eventDate)}</p>
            </div>
            <div style="flex: 1 1 45%;">
              <p style="margin: 2px 0;"><strong>Event Time:</strong> ${booking.details.eventTime}</p>
              <p style="margin: 2px 0;"><strong>Event Place:</strong> ${booking.details.eventPlace}</p>
              <p style="margin: 2px 0;"><strong>No. of Plates:</strong> ${booking.details.plates}</p>
              <p style="margin: 2px 0;"><strong>Price Per Plate:</strong> ₹${booking.details.pricePerPlate || '-'}</p>
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 1px dashed #d2b48c; margin: 15px 0;" />

        <div style="margin-bottom: 20px;">
          <h2 style="color: #8B4513; font-size: 17px; margin-bottom: 6px;">Selected Items</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            ${itemsHtml}
          </div>
        </div>
      </div>

      <div style="page-break-before: always; padding: 30px; font-family: 'Georgia', serif; background-color: #fffbe6;  margin-top:20px; ">
      <div style="text-align: center; padding: 15px; border-bottom: 2px dashed #d2b48c;">
        ${logoImageTag}
        <h1 style="font-size: 26px; color: #b8860b; margin: 4px 0;">Vijay Caterers</h1>
        <p style="font-style: italic; color: #555; margin-top: 4px;">"Elevate your event with our exceptional catering services"</p>
      </div>
        <h2 style="text-align: center; color: #8B4513; margin: 10px 0;">Terms and Conditions</h2>
        <ul style="margin-top: 15px; color: #444; font-size: 14px; line-height: 1.5; padding-left: 20px;">
          <li style="margin: 4px 0;">Payment can be made by cash, bank transfer, or cheque (cheque clearance is mandatory before event).</li>
          <li style="margin: 4px 0;">20% advance on the day of booking, 70% before 1 week of the party, and remaining balance to be paid after the event.</li>
          <li style="margin: 4px 0;">Final menu must be confirmed at least 5 days in advance.</li>
          <li style="margin: 4px 0;">Extra plates will be charged separately.</li>
        </ul>
        <p style="margin-top: 20px; text-align: center; font-style: italic; color: #777;">Thank you for choosing Vijay Caterers!</p>
      </div>

      <div style="border-top: 1px solid #f0e1c6; padding-top: 20px; font-size: 0.9em; text-align: center; color: #777;  ">
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-bottom: 10px;">
          <span>📍 Kukatpally, Hyderabad, Telangana</span>
          <span>📞 9866937747 / 9959500833 / 9676967747</span>
        </div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
          <span>📧 <a href="mailto:vijaycaterers2005@gmail.com" style="color: #b8860b;">vijaycaterers2005@gmail.com</a></span>
          <span>📸 Instagram: <a href="https://www.instagram.com/vijaycaterers_?igsh=Y2p3NGNmdmhhOXU%3D&utm_source=qr" style="color: #b8860b;">@vijaycaterers_</a></span>
        </div>
        <p style="margin-top: 10px;">🌟 We appreciate your trust in our services. Have a delicious event! 🌟</p>
      </div>
    </div>
    </div>
  `;

  html2pdf().from(content).save(filename);
};



  const handleEditClick = (booking) => {
    navigate('/select-items', { state: { booking } });
  };

  const handleSendToAdmin = (booking) => {
  const { name, mobile, eventPlace } = booking.details;

  if (
    name.trim().toLowerCase() === 'instant order' &&
    mobile.trim() === '0000000000' &&
    eventPlace.trim().toLowerCase() === 'unknown venue'
  ) {
    alert('Please edit the booking details before sending to admin.');
    return;
  }

  const db = getDatabase();
  const bookingRef = ref(db, `bookings/${userPhone}/${booking.customerName}`);
  const finalBookingRef = ref(db, `finalBookings/${userPhone}/${booking.customerName}`);

  set(finalBookingRef, {
    details: booking.details,
    items: booking.items || {},
  }).then(() => {
    remove(bookingRef);
  });
};


const renderBookingCard = (booking, isCompleted = false) => {
  const itemCount = Object.values(booking.items || {}).reduce((total, categoryItems) => {
  if (Array.isArray(categoryItems)) return total + categoryItems.length;
  if (typeof categoryItems === 'object') return total + Object.keys(categoryItems).length;
  return total;
}, 0);


  const allItems = booking.items || {};

  // Separate categories
  const nonVegItems = NON_VEG_SNACKS.filter(cat => allItems[cat]);
  const vegSnacksItems = allItems['vegSnacks'];
  const otherCategories = Object.entries(allItems)
    .filter(([key]) => key !== 'vegSnacks' && !NON_VEG_SNACKS.includes(key))
    .sort(([a], [b]) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
    });

  return (
    <div
      key={booking.customerName}
      className={`booking-card ${selectedCustomer === booking.customerName ? 'expanded' : ''}`}
      onClick={() => handleCardClick(booking.customerName)}
    >
      <div className="booking-card-header">
        <h3 className="customer-name">{booking.details.name}</h3>
        <span className="item-count">{itemCount} items</span>
      </div>

      <div className="booking-details">
        <div className="detail-row">
          <span className="detail-label">Mobile:</span>
          <span className="detail-value">{booking.details.mobile}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Event:</span>
          <span className="detail-value">
  {formatDate(booking.details.eventDate)} for {booking.details.eventTime}, {booking.details.eventPlace}
</span>

        </div>
        <div className="detail-row">
          <span className="detail-label">Plates:</span>
          <span className="detail-value">{booking.details.plates}</span>
        </div>
        {booking.details.pricePerPlate && (
  <div className="detail-row">
    <span className="detail-label">Price/Plate:</span>
    <span className="detail-value">₹{booking.details.pricePerPlate}</span>
  </div>
)}

      </div>

      {selectedCustomer === booking.customerName && (
        <div className="booking-expanded">
          {!isCompleted && (
  <div
    className="price-input-container"
    style={{ marginBottom: '1rem' }}
    onClick={(e) => e.stopPropagation()}
  >
    <label
      style={{ fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}
    >
      💰 Price Per Plate (₹):
    </label>
    <input
      type="number"
      value={priceInputs[booking.customerName] || ''}
      onChange={(e) => handlePriceChange(booking.customerName, e.target.value)}
      placeholder="Enter price per plate"
      style={{
        padding: '0.5rem',
        borderRadius: '5px',
        border: '1px solid #ccc',
        marginRight: '10px',
        width: '150px',
      }}
    />
    <button
      onClick={(e) => {
        e.stopPropagation();
        savePricePerPlate(booking);
      }}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      OK
    </button>
  </div>
)}



          <div className="items-section">
  <h4 className="section-title">🍽️ Selected Items</h4>
  {counters.map((group) => {
    const groupItems = group.categories
      .map((category) => ({ category, items: allItems[category] }))
      .filter((entry) => entry.items && Object.keys(entry.items).length > 0);

    if (groupItems.length === 0) return null;

    return (
      <div key={group.title} className="category-group" style={{ marginBottom: '1rem' }}>
        <h5 className="category-title">{group.title}</h5>
        <div style={{ paddingLeft: '1rem' }}>
          {groupItems.map(({ category, items }) => (
            <div key={category} style={{ marginBottom: '0.75rem' }}>
              <h6 style={{ fontSize: '0.9rem', color: '#555', marginBottom: '0.25rem' }}>
                {category.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase())}
              </h6>
              <ul className="item-list">
                {Object.values(items).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>


          {!isCompleted && (
            <div className="action-buttons">
              <button
  className="btn btn-edit-details"
  onClick={(e) => {
    e.stopPropagation();
    navigate('/edit-details', {
      state: {
        booking, // contains details and customerName
      },
    });
  }}
>
  📝 Edit Details
</button>

              <button
                className="btn btn-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(booking);
                }}
              >
                ✏️ Edit Items
              </button>
              <button
                className="btn btn-email"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendToAdmin(booking);
                }}
              >
                ✅ Send to Admin
              </button>
              <button
                className="btn btn-pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePdf(booking);
                }}
              >
                📄 Download PDF
              </button>
              <button
                className="btn btn-whatsapp"
                onClick={(e) => {
                  e.stopPropagation();
                  const phone = booking.details.mobile.replace(/\D/g, '');
                  const message = encodeURIComponent(
  `*🌟 Booking Confirmation - Vijay Caterers 🌟*\n\n` +
  `Hello *Mr/Ms ${booking.details.name}*,\n\n` +
  `This is a confirmation of your booking with *Vijay Caterers*.\n\n` +
  `📅 *Date:* ${formatDate(booking.details.eventDate)}\n` +
  `📍 *Venue:* ${booking.details.eventPlace}\n` +
  `🕒 *Time:* ${booking.details.eventTime}\n` +
  `🍽️ *Plates:* ${booking.details.plates}\n` +
  `💰 *Price/Plate:* ₹${booking.details.pricePerPlate || 'N/A'}\n\n` +
  `Thank you for choosing *Vijay Caterers*! We look forward to serving you.\n\n` +
  `If you have any updates feel free to contact us:\n` +
  `📞 9866937747 | 9959500833\n` +
  `📧 vijaycaterers2005@gmail.com`
);

window.open(`https://wa.me/91${booking.details.mobile.replace(/\D/g, '')}?text=${message}`, '_blank');


                }}
              >
                📱 WhatsApp
              </button>
              <button
  className="btn btn-delete"
  onClick={(e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete the booking for ${booking.details.name}?`);
    if (confirmDelete) {
      handleDeleteBooking(booking);
    }
  }}
>
  🗑️ Delete Booking
</button>

            </div>
          )}
        </div>
      )}
    </div>
  );
};



  return (
    <div className="admin-panel-container">
      <h2 className="admin-title">📋 My Bookings</h2>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <ClipLoader color="#2b79b5" size={60} />
        </div>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#888', fontSize: '18px' }}>No bookings found.</p>
      ) : (
        <div className="booking-grid">
          {bookings.map((booking) => renderBookingCard(booking))}
        </div>
      )}

      {completedBookings.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 className="admin-title">✅ Completed Bookings</h2>
          <div className="booking-grid">
            {completedBookings.map((booking) => renderBookingCard(booking, true))}
          </div>
        </div>
      )}


      <style>
        {
          `
          /* Shared card styles */

          .btn-delete {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}


          .category-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e2e2e2;
  padding-bottom: 0.25rem;
}


          .btn-edit-details {
  background: #9b59b6;
  color: white;
}
.btn-edit-details:hover {
  background: #8e44ad;
}


.admin-panel-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
  color: #333;
}

.admin-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.5rem;
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
  transition: all 0.2s ease;
  border: 1px solid #eaeaea;
  cursor: pointer;
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

.detail-label {
  color: #7f8c8d;
  font-weight: 500;
}

.detail-value {
  color: #2c3e50;
  text-align: right;
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
  margin-bottom: 0.5rem;
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

.action-buttons {
  display: flex;
  flex-direction: column; /* force vertical */
  gap: 12px; /* space between buttons */
  margin-top: 1.5rem;
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

// @media (min-width: 768px) {
//   .action-buttons {
//     flex-direction: row;
//     justify-content: space-between;
//   }
// }

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

`
        }
      </style>
    </div>
  );
}

export default BookingsPage;
