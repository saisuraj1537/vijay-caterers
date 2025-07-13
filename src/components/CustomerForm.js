import React, { useState } from 'react';
import { getDatabase, ref, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';

function CustomerForm() {
  const [customerName, setCustomerName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [venue, setVenue] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [eventTime, setEventTime] = useState('Lunch');
  const [noOfPlates, setNoOfPlates] = useState('');
  const [userMobile, setUserMobile] = useState(localStorage.getItem('loggedInMobile') || '');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !eventDate || !venue || !contactNumber || !eventTime || !noOfPlates) {
      setError('Please fill in all required fields.');
      return;
    }

    const db = getDatabase();

    try {
      const userRef = ref(db, `users/${userMobile}`);
      const snapshot = await get(userRef);

      const agentName = snapshot.exists() && snapshot.val().name
        ? snapshot.val().name
        : userMobile;

      // Trim and use fallback email if empty
      const trimmedEmail = email.trim();
      const emailToSave = trimmedEmail === '' ? 'vijaycaterer2005@gmail.com' : trimmedEmail;

      const customerKey = `${customerName}-${contactNumber}`;
      const customerRef = ref(db, `bookings/${userMobile}/${customerKey}`);

      await set(customerRef, {
        details: {
          name: customerName,
          eventDate,
          eventPlace: venue,
          mobile: contactNumber,
          email: emailToSave,
          eventTime,
          plates: noOfPlates,
          agentName,
        },
        items: {
          veg: [],
          nonVeg: [],
          customItems: {},
        },
      });

      navigate('/select-items', {
        state: {
          booking: {
            userMobile,
            customerName: customerKey,
          },
        },
      });

    } catch (error) {
      console.error('Error saving customer event:', error);
      setError('Failed to save customer details.');
    }
  };


  const handleInstantOrder = async () => {
  const db = getDatabase();

  try {
    const userRef = ref(db, `users/${userMobile}`);
    const snapshot = await get(userRef);

    const agentName = snapshot.exists() && snapshot.val().name
      ? snapshot.val().name
      : userMobile;

    const timestamp = Date.now();
    const instantCustomerKey = `InstantCustomer-${timestamp}`;

    const defaultContact = '0000000000';
    const defaultEmail = 'vijaycaterer2005@gmail.com';
    const todayDate = new Date().toISOString().split('T')[0];

    const customerRef = ref(db, `bookings/${userMobile}/${instantCustomerKey}`);

    await set(customerRef, {
      details: {
        name: 'Instant Order',
        eventDate: todayDate,
        eventPlace: 'Unknown Venue',
        mobile: defaultContact,
        email: defaultEmail,
        eventTime: 'Lunch',
        plates: '0',
        agentName,
      },
      items: {
        veg: [],
        nonVeg: [],
        customItems: {},
      },
    });

    navigate('/select-items', {
      state: {
        booking: {
          userMobile,
          customerName: instantCustomerKey,
        },
      },
    });

  } catch (error) {
    console.error('Error creating instant order:', error);
    setError('Failed to create instant order.');
  }
};


  return (
    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Segoe UI, Roboto, sans-serif' }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>
        Enter Customer Event Details
      </h2>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      <button
  onClick={handleInstantOrder}
  style={{
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    borderRadius: '20px',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '20px',
  }}
>
  Instant Order
</button>


      <form onSubmit={handleSubmit}>
        <InputField label="Customer Name" value={customerName} onChange={setCustomerName} id="customerName" placeholder="Enter customer's name" />
        <InputField label="Contact Number" value={contactNumber} onChange={setContactNumber} id="contactNumber" placeholder="Enter contact number" type="tel" />
        <InputField
          label="Email Address"
          value={email}
          onChange={setEmail}
          id="email"
          placeholder="Enter email address (optional)"
          type="email"
          required={false}
        />
        <InputField label="Event Place" value={venue} onChange={setVenue} id="venue" placeholder="Enter event venue" />
        <InputField label="Event Date" value={eventDate} onChange={setEventDate} id="eventDate" type="date" />
        <SelectField value={eventTime} onChange={setEventTime} />
        <InputField label="No. of Plates" value={noOfPlates} onChange={setNoOfPlates} id="noOfPlates" placeholder="Enter number of plates" type="number" />

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
          Submit
        </button>
      </form>
    </div>
  );
}

// Reusable Input Field Component
function InputField({ label, value, onChange, id, placeholder, type = 'text', required = true }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>{label}</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        required={required}
      />
    </div>
  );
}

// Dropdown Select Component
function SelectField({ value, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor="eventTime" style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>Event Time</label>
      <select
        id="eventTime"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        required
      >
        <option value="Breakfast">Breakfast</option>
        <option value="Lunch">Lunch</option>
        <option value="Dinner">Dinner</option>
      </select>
    </div>
  );
}

const inputStyle = {
  padding: '12px 14px',
  width: '100%',
  borderRadius: '10px',
  border: '1px solid #ccc',
  fontSize: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

export default CustomerForm;
