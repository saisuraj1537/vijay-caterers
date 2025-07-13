import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, set } from 'firebase/database';

function EditCustomerForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [eventTime, setEventTime] = useState('Lunch');
  const [noOfPlates, setNoOfPlates] = useState('');

  useEffect(() => {
    if (booking) {
      const details = booking.details;
      setCustomerName(details.name || '');
      setEventDate(details.eventDate || '');
      setVenue(details.eventPlace || '');
      setContactNumber(details.mobile || '');
      setEmail(details.email || '');
      setEventTime(details.eventTime || 'Lunch');
      setNoOfPlates(details.plates || '');
    }
  }, [booking]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!customerName || !eventDate || !venue || !contactNumber || !eventTime || !noOfPlates) {
      setError('Please fill in all required fields.');
      return;
    }

    const db = getDatabase();
    const userMobile = localStorage.getItem('loggedInMobile');

    const updatedRef = ref(db, `bookings/${userMobile}/${booking.customerName}/details`);

    try {
      await set(updatedRef, {
        ...booking.details,
        name: customerName,
        eventDate,
        eventPlace: venue,
        mobile: contactNumber,
        email: email || 'vijaycaterer2005@gmail.com',
        eventTime,
        plates: noOfPlates,
      });

      navigate(-1); // go back to bookings page
    } catch (err) {
      console.error('Error updating booking:', err);
      setError('Failed to update booking details.');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Edit Booking Details</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleUpdate}>
        <InputField label="Customer Name" value={customerName} onChange={setCustomerName} id="customerName" />
        <InputField label="Contact Number" value={contactNumber} onChange={setContactNumber} id="contactNumber" />
        <InputField label="Email" value={email} onChange={setEmail} id="email" required={false} />
        <InputField label="Venue" value={venue} onChange={setVenue} id="venue" />
        <InputField label="Event Date" value={eventDate} onChange={setEventDate} id="eventDate" type="date" />
        <SelectField value={eventTime} onChange={setEventTime} />
        <InputField label="No. of Plates" value={noOfPlates} onChange={setNoOfPlates} id="noOfPlates" type="number" />

        <button
          type="submit"
          style={{
            padding: '12px 24px',
            backgroundColor: '#2b79b5',
            color: '#fff',
            borderRadius: '20px',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Update Details
        </button>
      </form>
    </div>
  );
}

// Reusable Input Field Component
function InputField({ label, value, onChange, id, placeholder = '', type = 'text', required = true }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>{label}</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '12px 14px',
          width: '100%',
          borderRadius: '10px',
          border: '1px solid #ccc',
          fontSize: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        required={required}
      />
    </div>
  );
}

// Reusable Select Field Component
function SelectField({ value, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor="eventTime" style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>Event Time</label>
      <select
        id="eventTime"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '12px 14px',
          width: '100%',
          borderRadius: '10px',
          border: '1px solid #ccc',
          fontSize: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
        required
      >
        <option value="Breakfast">Breakfast</option>
        <option value="Lunch">Lunch</option>
        <option value="Dinner">Dinner</option>
      </select>
    </div>
  );
}


// You can reuse the InputField and SelectField components from CustomerForm
export default EditCustomerForm;
