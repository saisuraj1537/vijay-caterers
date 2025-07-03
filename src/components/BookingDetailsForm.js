// BookingDetailsForm.js
import React, { useState, useContext } from 'react';
import { getDatabase, ref, push } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { BookingContext } from '../context/BookingContext';
import { getAuth } from 'firebase/auth';

function BookingDetailsForm() {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [numberOfPlates, setNumberOfPlates] = useState('');
  const [eventTime, setEventTime] = useState('');
  const { selectedItems } = useContext(BookingContext);  // Get selected catering items
  const navigate = useNavigate();
  
  // Firebase authentication to get the logged-in user ID
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSubmit = (e) => {
    e.preventDefault();

    const db = getDatabase();
    const bookingRef = ref(db, 'bookings');

    const bookingData = {
      customerName,
      mobileNumber,
      eventDate,
      eventPlace,
      numberOfPlates,
      eventTime,
      selectedItems,  // Storing selected items
      userId: user.uid,  // Storing user ID who added the booking
    };

    // Add new booking to Firebase database
    push(bookingRef, bookingData)
      .then(() => {
        // Navigate to confirmation page after successful submission
        navigate('/confirmation');
      })
      .catch((error) => {
        console.error('Error submitting booking:', error);
      });
  };

  return (
    <div>
      <h2>Enter Customer Event Details</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Customer Name:
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </label><br />
        <label>
          Mobile Number:
          <input
            type="text"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
          />
        </label><br />
        <label>
          Event Date:
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
          />
        </label><br />
        <label>
          Event Place:
          <input
            type="text"
            value={eventPlace}
            onChange={(e) => setEventPlace(e.target.value)}
            required
          />
        </label><br />
        <label>
          Number of Plates:
          <input
            type="number"
            value={numberOfPlates}
            onChange={(e) => setNumberOfPlates(e.target.value)}
            required
          />
        </label><br />
        <label>
          Event Time:
          <input
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            required
          />
        </label><br />
        <button type="submit">Submit Booking</button>
      </form>
    </div>
  );
}

export default BookingDetailsForm;
