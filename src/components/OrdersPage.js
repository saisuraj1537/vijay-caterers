import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ref, onValue, set, runTransaction } from 'firebase/database';
import { database } from '../firebase';
import emailjs from 'emailjs-com';
import html2pdf from 'html2pdf.js';

function OrdersPage() {
  const [eventDates, setEventDates] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [notesMap, setNotesMap] = useState({});
  const [showDateRangePopup, setShowDateRangePopup] = useState(false);


  const [completedBookingsMap, setCompletedBookingsMap] = useState({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New state variables for current and last month dates
  const [currentMonthStartDate, setCurrentMonthStartDate] = useState('');
  const [currentMonthEndDate, setCurrentMonthEndDate] = useState('');
  const [lastMonthStartDate, setLastMonthStartDate] = useState('');
  const [lastMonthEndDate, setLastMonthEndDate] = useState('');

  const formatDateDMY = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};


  useEffect(() => {
    const bookingsRef = ref(database, 'finalBookings');
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const dates = [];
      const bookingsList = [];

      if (data) {
        Object.values(data).forEach((userBookings) => {
          Object.entries(userBookings).forEach(([key, value]) => {
            if (value.details?.eventDate) {
              const eventDate = value.details.eventDate;
              bookingsList.push({
                ...value.details,
                date: eventDate,
                key, // Firebase key for the booking
                selectedItems: value.items || {}, // Keep for other features if needed
              });
              dates.push(eventDate); // Only push date if eventDate exists
            }
          });
        });
      }

      setEventDates(dates);
      setAllBookings(bookingsList);
    });
  }, []);

  useEffect(() => {
  const bookingsRef = ref(database, 'finalBookings');
  const notesRef = ref(database, 'adminNotes');

  onValue(bookingsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const dates = [];
    const bookingsList = [];

    if (data) {
      Object.values(data).forEach((userBookings) => {
        Object.entries(userBookings).forEach(([key, value]) => {
          if (value.details?.eventDate) {
            const eventDate = value.details.eventDate;
            bookingsList.push({
              ...value.details,
              date: eventDate,
              key,
              selectedItems: value.items || {},
            });
            dates.push(eventDate);
          }
        });
      });
    }

    setEventDates(dates);
    setAllBookings(bookingsList);
  });

  // Fetch notes separately
  onValue(notesRef, (snapshot) => {
    setNotesMap(snapshot.val() || {});
  });
}, []);

const saveNote = (bookingKey, note) => {
  const noteRef = ref(database, `adminNotes/${bookingKey}`);
  set(noteRef, note)
    .then(() => {
      setNotesMap((prev) => ({ ...prev, [bookingKey]: note }));
      alert('Note saved!');
    })
    .catch((err) => alert('Failed to save note: ' + err.message));
};



  // Effect to calculate current and last month dates on component mount
  useEffect(() => {
    const today = new Date();

    // Calculate current month
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setCurrentMonthStartDate(firstDayCurrentMonth.toLocaleDateString('en-CA'));
    setCurrentMonthEndDate(lastDayCurrentMonth.toLocaleDateString('en-CA'));

    // Calculate last month
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    setLastMonthStartDate(firstDayLastMonth.toLocaleDateString('en-CA'));
    setLastMonthEndDate(lastDayLastMonth.toLocaleDateString('en-CA'));
  }, []); // Run only once on mount

  useEffect(() => {
    if (selectedDate) {
      const completedRef = ref(database, `completedOrders/${selectedDate}`);
      onValue(completedRef, (snapshot) => {
        const data = snapshot.val() || {};
        setCompletedBookingsMap(data);
      });
    }
  }, [selectedDate]);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); // returns 'YYYY-MM-DD'
      return eventDates.includes(dateStr) ? 'highlight' : null;
    }
  };

  const handleDateClick = (date) => {
    const dateStr = date.toLocaleDateString('en-CA'); // returns 'YYYY-MM-DD'
    setSelectedDate(dateStr);
    const filtered = allBookings.filter((booking) => booking.date === dateStr);
    setSelectedDateBookings(filtered);
    setExpandedIndex(null);
  };

  const sendThankYouEmail = (booking) => {
    const templateParams = {
      to_email: booking.email,
      to_name: booking.name,
      event_date: booking.date,
      event_time: booking.eventTime,
      event_place: booking.eventPlace,
      plates: booking.plates,
      mobile: booking.mobile,
    };

    emailjs
      .send(
        'service_kivxb5n',
        'template_98au647',
        templateParams,
        'iUiGZIlVDq2uX3_d0'
      )
      .then(() => alert('Thank you email sent!'))
      .catch((error) => {
        console.error('EmailJS Error:', error);
        alert('Failed to send email');
      });
  };

  const markAsCompleted = (booking) => {
    if (completedBookingsMap[booking.key]) {
      return;
    }

    const completedPath = `completedOrders/${booking.date}/${booking.key}`;
    const statsPath = `stats/servedCount`;

    const bookingData = {
      ...booking,
      selectedItems: booking.selectedItems || {},
    };

    set(ref(database, completedPath), bookingData)
      .then(() => {
        return runTransaction(ref(database, statsPath), (currentValue) => {
          return (currentValue || 0) + 1;
        });
      })
      .then(() => {
        // No alert needed here
      })
      .catch((err) => {
        alert('Failed to complete operation: ' + err.message);
      });
  };

  const generatePdf = (booking) => {
  const filename = `Order_${booking.name.replace(/\s/g, '_')}_${booking.date}.pdf`;

  const categoryOrder = [
    'sweets', 'juices', 'vegSnacks', 'hots', 'rotis',
    'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
    'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
    'avakayalu', 'powders', 'curds', 'papads', 'chatItems', 'chineseList',
    'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams','pan','soda',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'seaFoods',
    'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
    'crabItems', 'nonVegBiryanis', 'customItems'
  ];

  const selectedItems = booking.selectedItems || {};

  // Normalize input keys to lowercase map for safe matching
  const normalizedSelectedItems = {};
  Object.entries(selectedItems).forEach(([key, value]) => {
    normalizedSelectedItems[key.toLowerCase()] = value;
  });

  const inputKeys = Object.keys(normalizedSelectedItems);

  // 1. Match known categories (case-insensitive)
  const orderedCategories = categoryOrder.filter((cat) =>
    inputKeys.includes(cat.toLowerCase())
  );

  // 2. Add unknown categories (not in categoryOrder)
  const extraCategories = inputKeys.filter(
    (inputKey) =>
      !categoryOrder.some(
        (orderedCat) => orderedCat.toLowerCase() === inputKey
      )
  );

  // 3. Final combined list
  const allCategories = [...orderedCategories, ...extraCategories];

  // Convert camelCase to spaced and capitalized
  const formatCategory = (text) =>
    text
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital
      .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize

  const itemsHtml = allCategories
    .map((category) => {
      const items = normalizedSelectedItems[category.toLowerCase()];
      const itemsArray = Array.isArray(items)
        ? items
        : typeof items === 'object'
          ? Object.keys(items).filter((item) => items[item])
          : [];

      if (!itemsArray || itemsArray.length === 0) return '';

      const formattedItems = itemsArray
        .map((item) =>
          `<li style="margin: 4px 0;">🍽️ ${typeof item === 'string' ? item : item.name}</li>`
        )
        .join('');

      const formattedCategory = formatCategory(category);

      return `
        <div style="margin-bottom: 15px; page-break-inside: avoid;">
          <h4 style="color: #8B4513; margin: 8px 0; font-size: 15px;">${formattedCategory}</h4>
          <ul style="margin: 0; padding-left: 20px; color: #555; page-break-inside: avoid;">
            ${formattedItems}
          </ul>
        </div>
      `;
    })
    .join('');

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
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Mobile:</strong> ${booking.mobile}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>No. of Plates:</strong> ${booking.plates}</p>
        </div>
        <div style="flex: 1 1 45%;">
          <p><strong>Event Date:</strong> ${formatDateDMY(booking.date)}</p>
          <p><strong>Event Time:</strong> ${booking.eventTime}</p>
          <p><strong>Event Place:</strong> ${booking.eventPlace}</p>
          
          <p><strong>Price Per Plate:</strong> ₹${booking.pricePerPlate || '-'}</p>
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



  const handleDownloadDateRange = (start, end, rangeName = 'Selected Range') => {
    if (!start || !end) {
      alert(`Please select both a start and an end date for the ${rangeName} download.`);
      return;
    }

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    // Adjust end date to include the whole day
    endDateObj.setHours(23, 59, 59, 999);

    const filteredBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDateObj && bookingDate <= endDateObj;
    });

    if (filteredBookings.length === 0) {
      alert(`No bookings found in the ${rangeName} date range.`);
      return;
    }

    // Sort bookings by date for better organization
    filteredBookings.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Define CSV headers (the order you want them in Excel)
    const headers = [
      "Booking ID",
      "Customer Name",
      "Mobile",
      "Email",
      "Event Date",
      "Event Time",
      "Event Place",
      "Number of Plates"
    ];

    // Create CSV rows
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add headers as the first row

    filteredBookings.forEach(booking => {
      const row = [
        `"${booking.key}"`, // Enclose ID in quotes to ensure it's treated as text
        `"${booking.name.replace(/"/g, '""')}"`, // Handle commas/quotes in names
        `"${booking.mobile}"`,
        `"${booking.email}"`,
        `"${formatDateDMY(booking.date)}"`,
        `"${booking.eventTime}"`,
        `"${booking.eventPlace.replace(/"/g, '""')}"`, // Handle commas/quotes in places
        booking.plates
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const filename = `VijayCaterers_BookingDetails_${rangeName.replace(/\s/g, '_')}_${start}_to_${end}.csv`;

    // Create a Blob and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    } else {
      // Fallback for older browsers
      window.open('data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    }
    alert(`Bookings for ${rangeName} downloaded successfully as CSV!`);
  };

  // New handlers for current and last month
  const handleDownloadCurrentMonth = () => {
    handleDownloadDateRange(currentMonthStartDate, currentMonthEndDate, 'Current_Month');
  };

  const handleDownloadLastMonth = () => {
    handleDownloadDateRange(lastMonthStartDate, lastMonthEndDate, 'Last_Month');
  };

  const renderBookingCard = (booking, index) => {
  const isCompleted = !!completedBookingsMap[booking.key];

  // Define your preferred order for categories
  const categoryOrder = [
    'sweets', 'juices', 'vegSnacks', 'hots', 'rotis',
    'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
    'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
    'avakayalu', 'powders', 'curds', 'papads', 'chatItems', 'chineseList',
    'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams','pan','soda',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'seaFoods',
    'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
    'crabItems', 'nonVegBiryanis', 'customItems'
  ];

  const lowerCaseCategoryOrder = categoryOrder.map(cat => cat.toLowerCase());

  return (
    <div
      key={booking.key}
      className={`booking-card ${isCompleted ? 'completed' : ''} ${
        expandedIndex === index ? 'expanded' : ''
      }`}
      onClick={() => setExpandedIndex(index === expandedIndex ? null : index)}
    >
      <div className="booking-header">
        <h4 className="booking-name">{booking.name}</h4>
        <span className="booking-status">
          {isCompleted ? '✅ Completed' : '🟡 Pending'}
        </span>
      </div>

      <div className="booking-details">
        <p><span className="detail-label">📱 Mobile:</span> {booking.mobile}</p>
        <p><span className="detail-label">⏰ Time:</span> {booking.eventTime}</p>
        <p><span className="detail-label">📍 Place:</span> {booking.eventPlace}</p>
        <p><span className="detail-label">🍽️ Plates:</span> {booking.plates}</p>
        <p><span className="detail-label">💰 Price/Plate:</span> {booking.pricePerPlate}</p>
        <p><span className="detail-label">👨‍💻 Agent/Manager:</span><span  className='agent'>{booking.agentName}</span></p>
        {notesMap[booking.key] && (
  <p><span className="detail-label">📝 Notes:</span> {notesMap[booking.key]}</p>
)}
      </div>

      {expandedIndex === index && (
        <div className="booking-expanded">
          <div className="items-section">
            <div className="note-section">
  <label htmlFor={`note-${booking.key}`} className="note-label">📝 Admin Notes:</label>
  <textarea
  id={`note-${booking.key}`}
  className="note-textarea"
  value={notesMap[booking.key] || ''}
  onClick={(e) => e.stopPropagation()} // <- This stops bubbling
  onChange={(e) =>
    setNotesMap((prev) => ({
      ...prev,
      [booking.key]: e.target.value,
    }))
  }
  placeholder="Write any admin-specific notes here..."
/>

  <button
  className="note-save-btn mb-3"
  onClick={(e) => {
    e.stopPropagation(); // Prevent card from collapsing
    saveNote(booking.key, notesMap[booking.key] || '');
  }}
>
  ✅ Save Note
</button>

</div>
            <h4 className="section-title">Selected Items</h4>
            <div className="items-grid">
              {(() => {
                const selectedItems = booking.selectedItems || {};

                // Sort categories by the preferred order
                const sortedCategories = Object.keys(selectedItems).sort((a, b) => {
                  const indexA = lowerCaseCategoryOrder.indexOf(a.toLowerCase());
                  const indexB = lowerCaseCategoryOrder.indexOf(b.toLowerCase());
                  return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
                });

                return sortedCategories.map((category) => {
                  const items = selectedItems[category];
                  const itemsArray = Array.isArray(items)
                    ? items
                    : typeof items === 'object'
                    ? Object.keys(items).filter(item => items[item])
                    : [];

                  if (!itemsArray.length) return null;

                  return (
                    <div key={category} className="category-group">
                      <h5 className="category-title">
                        {category.replace(/([a-z])([A-Z])/g, '$1 $2')
                                 .replace(/\b\w/g, char => char.toUpperCase())}
                      </h5>
                      <ul className="item-list">
                        {itemsArray.map((item, i) => (
                          <li key={i}>
                            {typeof item === 'string'
                              ? item
                              : `${item.name} (${item.count})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="action-btn pdf-btn"
              onClick={(e) => {
                e.stopPropagation();
                generatePdf(booking);
              }}
            >
              📄 Generate PDF
            </button>
            <button
              className="action-btn email-btn"
              onClick={(e) => {
                e.stopPropagation();
                sendThankYouEmail(booking);
              }}
            >
              ✉️ Send Thank You
            </button>
            
            <button
              className={`action-btn complete-btn ${isCompleted ? 'completed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                markAsCompleted(booking);
              }}
            >
              {isCompleted ? '✔️ Order Completed' : '✓ Mark as Completed'}
            </button>
          </div>
          

        </div>
      )}
    </div>
  );
};


  return (
    <div className="orders-page">
      <header className="page-header">
        <h1>Orders Calendar</h1>
        <p>Manage and track all customer orders with ease.</p>
      </header>

      <div className="calendar-container">
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
          className="custom-calendar"
        />
      </div>

      <div style={{  display: 'flex', justifyContent: 'flex-end', margin: '2rem 0' }}>
  <button
    onClick={() => setShowDateRangePopup(true)}
    className="download-range-btn"
  >
    ⬇️ Download Excel
  </button>
</div>

{showDateRangePopup && (
  <div className="modal-overlay" onClick={() => setShowDateRangePopup(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h3>Download Bookings as CSV</h3>
      <div className="date-inputs">
        <label htmlFor="startDate">Start Date:</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="date-input-field"
        />
        <label htmlFor="endDate">End Date:</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="date-input-field"
        />
        <button
          onClick={() => {
            handleDownloadDateRange(startDate, endDate, 'Custom_Range');
            setShowDateRangePopup(false);
          }}
          className="download-range-btn"
        >
          ⬇️ Download Custom Range CSV
        </button>
      </div>

      <div className="quick-download-buttons">
        <button
          onClick={() => {
            handleDownloadCurrentMonth();
            setShowDateRangePopup(false);
          }}
          className="download-range-btn"
        >
          ⬇️ Download Current Month CSV
        </button>
        <button
          onClick={() => {
            handleDownloadLastMonth();
            setShowDateRangePopup(false);
          }}
          className="download-range-btn"
        >
          ⬇️ Download Last Month CSV
        </button>
      </div>
      <button className="close-modal-btn" onClick={() => setShowDateRangePopup(false)}>
        ❌ Close
      </button>
    </div>
  </div>
)}


      <div className="bookings-container">
        <h2 className="bookings-title">
  {selectedDate
    ? `Bookings for ${formatDateDMY(selectedDate)}`
    : 'Select a date to view bookings'}
</h2>


        {selectedDateBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found for this date. Select a highlighted date on the calendar.</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {selectedDateBookings.map(renderBookingCard)}
          </div>
        )}
      </div>

      <style>{`
      .agent {
          color: #27ae60;
          font-weight: 500;
        }
        .orders-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #34495e;
          background-color: #f8faff;
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #ebf2fa;
        }

        .page-header h1 {
          font-size: 3rem;
          color: #2c3e50;
          margin-bottom: 0.8rem;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .page-header p {
          font-size: 1.2rem;
          color: #7f8c8d;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .calendar-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          margin-bottom: 3rem;
          max-width: 450px;
          margin-left: auto;
          margin-right: auto;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .calendar-container:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        }

        .custom-calendar {
          width: 100%;
          border: none;
          background: none;
        }

        /* --- Calendar Styling --- */
        .custom-calendar {
          font-family: 'Inter', sans-serif;
        }

        .react-calendar__navigation button {
          color: #4a90e2;
          font-weight: 600;
          font-size: 1.2em;
          background: none;
          border-radius: 10px;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .react-calendar__navigation button:hover {
          background-color: #e6f0fa;
          color: #3478c9;
        }

        .react-calendar__navigation__label {
          color: #2c3e50;
          font-weight: 700;
          font-size: 1.2em;
        }

        .react-calendar__month-view__weekdays__weekday {
          color: #6c5ce7;
          font-weight: 600;
          font-size: 0.9em;
          text-transform: uppercase;
          opacity: 0.8;
        }

        .react-calendar__tile {
          color: #555;
          border-radius: 10px;
          padding: 0.7em 0.5em;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background: #ffecc6;
          color: #333;
          border-radius: 10px;
        }

        .react-calendar__month-view__days__day--neighboringMonth {
          color: #aeb6bf;
        }

        .react-calendar__tile--active {
          background: #ff7272 !important;
          color: white !important;
          border-radius: 50% !important;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(255, 114, 114, 0.4);
        }

        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #f15c5c !important;
          color: white;
        }

        .custom-calendar .highlight {
          background: #f39c12 !important;
          color: white !important;
          border-radius: 50% !important;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(243, 156, 18, 0.4);
        }

        .custom-calendar .highlight:hover {
          background: #e67e22 !important;
        }

        .react-calendar__tile--now {
          background: #90d7ff;
          color: #333;
          border-radius: 10px;
          font-weight: bold;
        }

        .react-calendar__tile--now:enabled:hover,
        .react-calendar__tile--now:enabled:focus {
          background: #62b0e6;
        }

        /* --- End Calendar Styling --- */

        /* --- Date Range Selector Styling --- */
        .date-range-selector {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  padding: 1.2rem 1rem;
  margin-bottom: 2rem;
  text-align: center;
}

.date-range-selector h3 {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 600;
}

.date-inputs,
.quick-download-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
}

.quick-download-buttons {
  margin-top: 1rem;
}

.date-inputs label {
  font-weight: 500;
  color: #555;
  font-size: 0.95em;
}

.date-input-field {
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  border: 1px solid #ccd6e0;
  border-radius: 6px;
  color: #34495e;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.date-input-field:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.15);
}

.download-range-btn {
  background: #27ae60;
  color: white;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.25);
}

.download-range-btn:hover {
  background: #229954;
  transform: translateY(-1px);
  box-shadow: 0 5px 12px rgba(39, 174, 96, 0.35);
}
        /* --- End Date Range Selector Styling --- */


        .bookings-container {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          padding: 2.5rem;
          margin-top: 2rem;
        }

        .bookings-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 2rem;
          padding-bottom: 0.8rem;
          border-bottom: 2px solid #ebf2fa;
          font-weight: 600;
        }

        .no-bookings {
          text-align: center;
          padding: 3rem;
          color: #95a5a6;
          font-style: italic;
          font-size: 1.1em;
          background-color: #fdfdfd;
          border-radius: 10px;
          border: 1px dashed #e0e6eb;
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .booking-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          border: 1px solid #eef2f6;
          overflow: hidden;
          transition: all 0.3s ease-in-out;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .booking-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .booking-card.completed {
          border-left: 6px solid #28a745;
          background-color: #f7fcf9;
        }

        .booking-card.completed .booking-status {
          color: #28a745;
          font-weight: 700;
        }

        .booking-card.expanded {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.2rem 1.5rem;
          background: #f8f9fa;
          border-bottom: 1px solid #e7ecef;
        }

        .booking-name {
          margin: 0;
          font-size: 1.35rem;
          color: #2c3e50;
          font-weight: 600;
        }

        .booking-status {
          font-size: 0.9rem;
          font-weight: 700;
          color: #f39c12;
          background-color: #fff8eb;
          padding: 0.3em 0.7em;
          border-radius: 5px;
        }

        .booking-card.completed .booking-status {
            background-color: #e6faed;
        }

        .booking-details {
          padding: 1.2rem 1.5rem;
          flex-grow: 1;
        }

        .booking-details p {
            margin-bottom: 0.6rem;
            font-size: 1.05rem;
            line-height: 1.5;
            color: #555;
        }

        .detail-label {
          font-weight: 700;
          color: #7f8c8d;
          margin-right: 0.6rem;
          min-width: 80px;
          display: inline-block;
        }

        .booking-expanded {
          padding: 0 1.5rem 1.5rem;
          background: #fdfefe;
          border-top: 1px solid #e7ecef;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Items Section Styles */
        .items-section {
          margin: 1.5rem 0;
        }

        .section-title {
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #7f8c8d;
          margin: 0 0 1rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #eee;
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
          font-size: 0.9rem;
          color: #34495e;
        }

        .item-list li {
          margin-bottom: 0.25rem;
          list-style-type: disc;
        }
        
        .item-list li:last-child {
            margin-bottom: 0;
        }

        /* Action Buttons */
        .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

        .action-btn {
  flex: 1 1 30%; /* Allows buttons to shrink if needed but maintain horizontal flow */
  min-width: 120px;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
}

        .email-btn {
          background: #4a90e2;
          color: white;
          box-shadow: 0 4px 10px rgba(74, 144, 226, 0.3);
        }

        .email-btn:hover {
          background: #3a7bd8;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(74, 144, 226, 0.4);
        }
        
        .pdf-btn {
            background: #e74c3c;
            color: white;
            box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3);
        }

        .pdf-btn:hover {
            background: #c0392b;
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
        }

        .complete-btn {
          background: #aeb6bf;
          color: white;
          box-shadow: 0 4px 10px rgba(174, 182, 191, 0.3);
        }

        .complete-btn.completed {
          background: #28a745;
          box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
        }

        .complete-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(174, 182, 191, 0.4);
        }
        .complete-btn.completed:hover {
          background: #218838;
          box-shadow: 0 6px 15px rgba(40, 167, 69, 0.4);
        }

        @media (max-width: 768px) {
          .orders-page {
            padding: 1.5rem;
          }
          .page-header h1 {
            font-size: 2.2rem;
          }
          .page-header p {
            font-size: 1em;
          }
          .bookings-grid {
            grid-template-columns: 1fr;
          }
          .action-buttons {
            flex-direction: column;
          }
          .calendar-container {
            padding: 1rem;
          }
          .bookings-container {
            padding: 1.5rem;
          }
          .bookings-title {
            font-size: 1.5rem;
          }
          .date-inputs,
  .quick-download-buttons {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .date-input-field {
    width: 100%;
  }

  .download-range-btn {
    width: 100%;
    justify-content: center;
  }
        }
  .note-section {
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
}

.note-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.note-textarea {
  padding: 0.7rem;
  font-size: 0.95rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  background-color: #fefefe;
  margin-bottom: 0.6rem;
  font-family: inherit;
  color: #333;
}

.note-save-btn {
  align-self: flex-start;
  background: #2980b9;
  color: white;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.note-save-btn:hover {
  background: #2471a3;
}
  .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
  position: relative;
}

.close-modal-btn {
  background: #e74c3c;
  color: white;
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1.5rem;
  display: block;
  width: 100%;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: #c0392b;
}


          
      `}</style>
    </div>
  );
}

export default OrdersPage;