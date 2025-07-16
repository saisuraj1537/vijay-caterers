import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import { ref, onValue, set, runTransaction } from 'firebase/database';
import { database } from '../firebase';
import emailjs from 'emailjs-com';
import html2pdf from 'html2pdf.js';
import {CATEGORY_ORDER} from './AllTextItems' // Assuming counters is not used in rendering

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
      return eventDates.includes(dateStr) ? 'highlight' : null; // 'highlight' class would need to be defined externally
    }
    return null;
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

    const selectedItems = booking.selectedItems || {};

    // Normalize input keys to lowercase map for safe matching
    const normalizedSelectedItems = {};
    Object.entries(selectedItems).forEach(([key, value]) => {
      normalizedSelectedItems[key.toLowerCase()] = value;
    });

    const inputKeys = Object.keys(normalizedSelectedItems);

    // 1. Match known categories (case-insensitive)
    const orderedCategories = CATEGORY_ORDER.filter((cat) =>
      inputKeys.includes(cat.toLowerCase())
    );

    // 2. Add unknown categories (not in CATEGORY_ORDER)
    const extraCategories = inputKeys.filter(
      (inputKey) =>
        !CATEGORY_ORDER.some(
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
            `<li>🍽️ ${typeof item === 'string' ? item : item.name}</li>`
          )
          .join('');

        const formattedCategory = formatCategory(category);

        return `
          <div>
            <h4>${formattedCategory}</h4>
            <ul>
              ${formattedItems}
            </ul>
          </div>
        `;
      })
      .join('');

    const content = `
    <div>

      <div>
        <h1>Vijay Caterers</h1>
        <p>"Elevate your event with our exceptional catering services"</p>
      </div>

      <hr />

      <div>
        <h2>Order Details</h2>
        <div>
          <div>
            <p><strong>Name:</strong> ${booking.name}</p>
            <p><strong>Mobile:</strong> ${booking.mobile}</p>
            <p><strong>Email:</strong> ${booking.email}</p>
            <p><strong>No. of Plates:</strong> ${booking.plates}</p>
          </div>
          <div>
            <p><strong>Event Date:</strong> ${formatDateDMY(booking.date)}</p>
            <p><strong>Event Time:</strong> ${booking.eventTime}</p>
            <p><strong>Event Place:</strong> ${booking.eventPlace}</p>
            
            <p><strong>Price Per Plate:</strong> ₹${booking.pricePerPlate || '-'}</p>
          </div>
        </div>
      </div>

      <hr />

      <div>
        <h2>Selected Items</h2>
        <div>
          ${itemsHtml}
        </div>
      </div>

    <div>
      <h2>Terms and Conditions</h2>
      <ul>
        <li>Payment can be made by cash, bank transfer, or cheque (cheque clearance is mandatory before event).</li>
        <li>20% advance on the day of booking, 70% before 1 week of the party, and remaining balance to be paid after the event.</li>
        <li>Final menu must be confirmed at least 5 days in advance.</li>
        <li>Extra plates will be charged separately.</li>
      </ul>
      <p>Thank you for choosing Vijay Caterers!</p>
    </div>

      <div>
        <div>
          <span>📍 Kukatpally, Hyderabad, Telangana</span>
          <span>📞 9866937747 / 9959500833 / 9676967747</span>
        </div>
        <div>
          <span>📧 <a href="mailto:vijaycaterers2005@gmail.com">vijaycaterers2005@gmail.com</a></span>
          <span>📸 Instagram: <a href="https://www.instagram.com/vijaycaterers_?igsh=Y2p3NGNmdmhhOXU%3D&utm_source=qr">@vijaycaterers_</a></span>
        </div>
        <p>🌟 We appreciate your trust in our services. Have a delicious event! 🌟</p>
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

    // Define your category groups with titles
    const categoryGroups = [
      {
        title: 'Non Veg Snacks',
        categories: ['chickenSnacks', 'prawnSnacks', 'eggSnacks', 'muttonSnacks'],
      },
      {
        title: 'Main Veg Course',
        categories: [
          'sweets', 'juices',
          'vegSnacks', 'hots', 'rotis',
          'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
          'dalItems', 'vegFryItems',
          'liquidItems', 'rotiChutneys', 'avakayalu', 'powders', 'curds', 'papads', 'customItems'
        ]
      },
      {
        title: 'Main Non-Veg Course',
        categories: ['nonVegSoups', 'nonVegBiryanis', 'chickenCurries', 'muttonCurries', 'eggItems', 'prawnItems', 'crabItems', 'seaFoods', 'fishFry']
      },
      {
        title: 'Counter 1',
        categories: ['chatItems', 'chineseList', 'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams', 'pan', 'soda'],
      },
    ];

    return (
      <div
        key={booking.key}
        onClick={() => setExpandedIndex(index === expandedIndex ? null : index)}
      >
        <div>
          <h4>{booking.name}</h4>
          <span>
            {isCompleted ? '✅ Completed' : '🟡 Pending'}
          </span>
        </div>

        <div>
          <p><span>📱 Mobile:</span> {booking.mobile}</p>
          <p><span>⏰ Time:</span> {booking.eventTime}</p>
          <p><span>📍 Place:</span> {booking.eventPlace}</p>
          <p><span>🍽️ Plates:</span> {booking.plates}</p>
          <p><span>💰 Price/Plate:</span> {booking.pricePerPlate}</p>
          <p><span>👨‍💻 Agent/Manager:</span><span>{booking.agentName}</span></p>
          {notesMap[booking.key] && (
            <p><span>📝 Notes:</span> {notesMap[booking.key]}</p>
          )}
        </div>

        {expandedIndex === index && (
          <div>
            <div>
              <div>
                <label htmlFor={`note-${booking.key}`}>📝 Admin Notes:</label>
                <textarea
                  id={`note-${booking.key}`}
                  value={notesMap[booking.key] || ''}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    setNotesMap((prev) => ({
                      ...prev,
                      [booking.key]: e.target.value,
                    }))
                  }
                  placeholder="Write any admin-specific notes here..."
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    saveNote(booking.key, notesMap[booking.key] || '');
                  }}
                >
                  ✅ Save Note
                </button>
              </div>

              <h4>Selected Items</h4>

              <div>
                {categoryGroups.map((group, groupIndex) => {
                  const selectedItems = booking.selectedItems || {};

                  // Filter categories that exist in this booking and have items
                  const validCategories = group.categories.filter(category => {
                    const items = selectedItems[category];
                    if (!items) return false;

                    const itemsArray = Array.isArray(items)
                      ? items
                      : typeof items === 'object'
                        ? Object.keys(items).filter(item => items[item])
                        : [];

                    return itemsArray.length > 0;
                  });

                  if (validCategories.length === 0) return null;

                  return (
                    <div key={groupIndex}>
                      <h5>{group.title}</h5>
                      <div>
                        {validCategories.map((category) => {
                          const items = selectedItems[category];
                          const itemsArray = Array.isArray(items)
                            ? items
                            : typeof items === 'object'
                              ? Object.keys(items).filter(item => items[item])
                              : [];

                          return (
                            <div key={category}>
                              <h6>
                                {category.replace(/([a-z])([A-Z])/g, '$1 $2')
                                  .replace(/\b\w/g, char => char.toUpperCase())}
                              </h6>
                              <ul>
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
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generatePdf(booking);
                }}
              >
                📄 Generate PDF
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sendThankYouEmail(booking);
                }}
              >
                ✉️ Send Thank You
              </button>

              <button
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
    <div>
      <header>
        <h1>Orders Calendar</h1>
        <p>Manage and track all customer orders with ease.</p>
      </header>

      <div>
        <Calendar
          onClickDay={handleDateClick}
          tileClassName={tileClassName}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '2rem 0' }}>
        <button
          onClick={() => setShowDateRangePopup(true)}
        >
          ⬇️ Download Excel
        </button>
      </div>

      {showDateRangePopup && (
        <div onClick={() => setShowDateRangePopup(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>Download Bookings as CSV</h3>
            <div>
              <label htmlFor="startDate">Start Date:</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <label htmlFor="endDate">End Date:</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <button
                onClick={() => {
                  handleDownloadDateRange(startDate, endDate, 'Custom_Range');
                  setShowDateRangePopup(false);
                }}
              >
                ⬇️ Download Custom Range CSV
              </button>
            </div>

            <div>
              <button
                onClick={() => {
                  handleDownloadCurrentMonth();
                  setShowDateRangePopup(false);
                }}
              >
                ⬇️ Download Current Month CSV
              </button>
              <button
                onClick={() => {
                  handleDownloadLastMonth();
                  setShowDateRangePopup(false);
                }}
              >
                ⬇️ Download Last Month CSV
              </button>
            </div>
            <button onClick={() => setShowDateRangePopup(false)}>
              ❌ Close
            </button>
          </div>
        </div>
      )}

      <div>
        <h2>
          {selectedDate
            ? `Bookings for ${formatDateDMY(selectedDate)}`
            : 'Select a date to view bookings'}
        </h2>

        {selectedDateBookings.length === 0 ? (
          <div>
            <p>No bookings found for this date. Select a highlighted date on the calendar.</p>
          </div>
        ) : (
          <div>
            {selectedDateBookings.map(renderBookingCard)}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;