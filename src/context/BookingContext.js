// context/BookingContext.js
import React, { createContext, useState } from 'react';

export const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);

  return (
    <BookingContext.Provider value={{ selectedItems, setSelectedItems, eventDetails, setEventDetails }}>
      {children}
    </BookingContext.Provider>
  );
};
