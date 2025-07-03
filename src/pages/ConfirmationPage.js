// pages/ConfirmationPage.js
import React, { useContext } from 'react';
import { ref, push } from 'firebase/database';
import { database } from '../firebase';
import { BookingContext } from '../context/BookingContext';

const ConfirmationPage = () => {
  const { selectedItems, eventDetails } = useContext(BookingContext);

  const handleConfirm = () => {
    const bookingRef = ref(database, 'fullBookings/');
    push(bookingRef, {
      eventDetails,
      selectedItems,
      timestamp: Date.now(),
    });
    alert('Booking confirmed!');
  };

  if (!selectedItems.length || !eventDetails) {
    return <p>Please complete previous steps first.</p>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Review Your Booking</h2>

      <h3>Event Details</h3>
      <ul>
        {Object.entries(eventDetails).map(([key, value]) => (
          <li key={key}><strong>{key.replace(/([A-Z])/g, ' $1')}:</strong> {value}</li>
        ))}
      </ul>

      <h3>Selected Items</h3>
      <ul>
        {selectedItems.map((item, index) => (
          <li key={index}>{item.name} - Qty: {item.quantity} ({item.category})</li>
        ))}
      </ul>

      <button onClick={handleConfirm} style={{ marginTop: '20px', backgroundColor: 'green', color: 'white', padding: '10px' }}>
        Confirm Booking
      </button>
    </div>
  );
};

export default ConfirmationPage;
