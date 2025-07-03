import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userPhone = localStorage.getItem("loggedInMobile");

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
  };

  const handleEditClick = (booking) => {
    navigate('/select-items', { state: { booking } });
  };

  const handleSendToAdmin = (booking) => {
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
    const itemCount = booking.items
      ? Object.values(booking.items).reduce(
          (total, categoryItems) => total + Object.keys(categoryItems).length,
          0
        )
      : 0;

    return (
      <div
        key={booking.customerName}
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '20px',
          width: '300px',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onClick={() => handleCardClick(booking.customerName)}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        }}
      >
        <p><strong>Name:</strong> {booking.details.name}</p>
        <p><strong>Mobile:</strong> {booking.details.mobile}</p>
        <p><strong>Event:</strong> {booking.details.eventDate} at {booking.details.eventTime}, {booking.details.eventPlace}</p>
        <p><strong>Plates:</strong> {booking.details.plates}</p>
        <p><strong>Items Selected:</strong> {itemCount}</p>

        {selectedCustomer === booking.customerName && (
          <div style={{
            marginTop: '15px',
            backgroundColor: '#f0f8ff',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <h4 style={{ color: '#2b79b5', marginBottom: '10px' }}>🍽️ Selected Items:</h4>
            {booking.items && Object.entries(booking.items).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '10px' }}>
                <strong>{category}:</strong>
                <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                  {Object.values(items).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}

            {!isCompleted && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(booking);
                  }}
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#2b79b5',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                >
                  ✏️ Edit Items
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendToAdmin(booking);
                  }}
                  style={{
                    marginTop: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  ✅ Send to Admin
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial' }}>
      <h2 style={{ color: '#2b79b5', fontWeight: 'bold' }}>📋 My Bookings</h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <ClipLoader color="#2b79b5" size={60} />
        </div>
      ) : bookings.length === 0 ? (
        <p style={{ color: '#888', fontSize: '18px' }}>No bookings found.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
          {bookings.map(booking => renderBookingCard(booking, false))}
        </div>
      )}

      {completedBookings.length > 0 && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ color: '#2b79b5', fontWeight: 'bold' }}>✅ Completed Bookings</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
            {completedBookings.map(booking => renderBookingCard(booking, true))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingsPage;
