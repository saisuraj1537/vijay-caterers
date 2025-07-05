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
  const [completedBookingsMap, setCompletedBookingsMap] = useState({});

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // New state variables for current and last month dates
  const [currentMonthStartDate, setCurrentMonthStartDate] = useState('');
  const [currentMonthEndDate, setCurrentMonthEndDate] = useState('');
  const [lastMonthStartDate, setLastMonthStartDate] = useState('');
  const [lastMonthEndDate, setLastMonthEndDate] = useState('');

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
      "sweets", "juices", "veg snacks", "hots", "rotis", "kurma curries", "special greavy curryis",
      "special rice items", "veg dum biryani", "dal items", "veg fry items", "liquid items",
      "roti chutneys", "avakayalu", "powders", "curds", "papads", "chat items", "chinese",
      "italian snacks", "south indian tiffin items", "fruits", "ice creams", "chicken snacks",
      "prawn snacks", "egg snacks", "sea food", "mutton curries", "egg", "prawns",
      "chicken curries", "crabs", "non veg biryanis"
    ];

    const selectedItems = booking.selectedItems || {};

    const normalizedSelectedItems = Object.entries(selectedItems).reduce((acc, [key, val]) => {
      acc[key.toLowerCase()] = val;
      return acc;
    }, {});

    const itemsHtml = categoryOrder
      .filter((category) => normalizedSelectedItems[category])
      .map((category) => {
        const items = normalizedSelectedItems[category];
        const itemsArray = Array.isArray(items)
          ? items
          : typeof items === 'object'
            ? Object.keys(items).filter((item) => items[item])
            : [];

        if (itemsArray.length === 0) return '';

        const formattedItems = itemsArray
          .map(
            (item) =>
              `<li style="margin: 4px 0;">🍽️ ${typeof item === 'string' ? item : item.name}</li>`
          )
          .join('');

        const formattedCategory = category.replace(/\b\w/g, c => c.toUpperCase());

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
      <div style="font-family: 'Georgia', serif; padding: 30px; color: #3c3c3c; background-color: #fffbe6; border: 10px solid #f5e1a4;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://res.cloudinary.com/dnllne8qr/image/upload/v1735446856/WhatsApp_Image_2024-12-27_at_8.13.22_PM-removebg_m3863q.png" alt="Vijay Caterers" style="width: 150px; margin-bottom: 10px;" />
          <h1 style="font-size: 24px; color: #b8860b;">Vijay Caterers</h1>
          <p style="font-style: italic; color: #555;">"Elevate your event with our exceptional catering services"</p>
        </div>

        <hr style="border: 0; border-top: 2px dashed #d2b48c; margin: 20px 0;" />

        <div style="margin-bottom: 25px;">
          <h2 style="color: #8B4513; font-size: 18px; margin-bottom: 12px;">Order Details</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1 1 45%;">
              <p><strong>Name:</strong> ${booking.name}</p>
              <p><strong>Mobile:</strong> ${booking.mobile}</p>
              <p><strong>Email:</strong> ${booking.email}</p>
            </div>
            <div style="flex: 1 1 45%;">
              <p><strong>Event Date:</strong> ${booking.date}</p>
              <p><strong>Event Time:</strong> ${booking.eventTime}</p>
              <p><strong>Event Place:</strong> ${booking.eventPlace}</p>
              <p><strong>No. of Plates:</strong> ${booking.plates}</p>
            </div>
          </div>
        </div>

        <hr style="border: 0; border-top: 2px dashed #d2b48c; margin: 20px 0;" />

        <div style="margin-bottom: 30px;">
          <h2 style="color: #8B4513; font-size: 18px;">Selected Items</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            ${itemsHtml}
          </div>
        </div>

        <div style="border-top: 1px solid #f0e1c6; padding-top: 20px; font-size: 0.9em; text-align: center; color: #777;">
          <p>📍 Hyderabad, Telangana</p>
          <p>📞 9866973747 / 9959500833</p>
          <p>📧 <a href="mailto:darwaen1211@gmail.com" style="color: #b8860b;">darwaen1211@gmail.com</a></p>
          <p>📸 Instagram: <a href="https://instagram.com/vijaycaterers_" style="color: #b8860b;">@vijaycaterers_</a></p>
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
        `"${booking.date}"`,
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
        </div>

        {expandedIndex === index && (
          <div className="booking-expanded">
            <div className="items-section">
              <h4 className="section-title">Selected Items</h4>
              <div className="items-grid">
                {Object.entries(booking.selectedItems || {}).map(([category, items]) => {
                  const itemsArray = Array.isArray(items) ? items :
                    (typeof items === 'object' ? Object.keys(items).filter(item => items[item]) : []);

                  if (itemsArray.length > 0) {
                    return (
                      <div key={category} className="category-group">
                        <h5 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                        <ul className="item-list">
                          {itemsArray.map((item, i) => (
                            <li key={i}>
                              {typeof item === 'string' ? item : `${item.name} (${item.count})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="action-buttons">
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
                className="action-btn pdf-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  generatePdf(booking);
                }}
              >
                📄 Generate PDF
              </button>
              <button
                className={`action-btn complete-btn ${
                  isCompleted ? 'completed' : ''
                }`}
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

      <div className="date-range-selector">
        <h3>Download Bookings as CSV</h3>
        {/* Date Range Selector */}
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
          <button onClick={() => handleDownloadDateRange(startDate, endDate, 'Custom_Range')} className="download-range-btn">
            ⬇️ Download Custom Range CSV
          </button>
        </div>

        {/* New buttons for Current and Last Month */}
        <div className="quick-download-buttons">
          <button onClick={handleDownloadCurrentMonth} className="download-range-btn">
            ⬇️ Download Current Month CSV
          </button>
          <button onClick={handleDownloadLastMonth} className="download-range-btn">
            ⬇️ Download Last Month CSV
          </button>
        </div>
      </div>

      <div className="bookings-container">
        <h2 className="bookings-title">
          {selectedDate
            ? `Bookings for ${new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`
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
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          margin-bottom: 3rem;
          text-align: center;
        }

        .date-range-selector h3 {
          font-size: 1.6rem;
          color: #2c3e50;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .date-inputs, .quick-download-buttons {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem; /* Space between custom range and quick buttons */
        }
        
        .quick-download-buttons {
            margin-top: 1.5rem;
        }


        .date-inputs label {
          font-weight: 600;
          color: #555;
          font-size: 1.1em;
        }

        .date-input-field {
          padding: 0.8rem 1rem;
          border: 1px solid #ccd6e0;
          border-radius: 8px;
          font-size: 1rem;
          color: #34495e;
          outline: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .date-input-field:focus {
          border-color: #4a90e2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
        }

        .download-range-btn {
          background: #27ae60;
          color: white;
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3);
        }

        .download-range-btn:hover {
          background: #229954;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(39, 174, 96, 0.4);
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
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .action-btn {
          flex: 1;
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
          .date-inputs, .quick-download-buttons {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default OrdersPage;