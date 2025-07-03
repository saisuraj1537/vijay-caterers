import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from "react-spinners";

function FinalSelectItemsPage() {
  const [selectedItems, setSelectedItems] = useState({});
  const [details, setDetails] = useState(null);
  const [vegItemsGrouped, setVegItemsGrouped] = useState({});
  const [nonVegItemsGrouped, setNonVegItemsGrouped] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [customItem, setCustomItem] = useState('');  // State for custom item input
  const [loading, setLoading] = useState(true);  // State for loading

  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  const userMobile = booking?.userMobile || localStorage.getItem('loggedInMobile');
  const customerName = booking?.customerName;

  useEffect(() => {
    if (!userMobile || !customerName) return;

    const db = getDatabase();

    const itemsRef = ref(db, 'items');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVegItemsGrouped(data);
      }
    });

    const nonVegRef = ref(db, 'nonVegItems');
    onValue(nonVegRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setNonVegItemsGrouped(data);
      }
    });

    const bookingRef = ref(db, `finalBookings/${userMobile}/${customerName}`);
    const unsubscribe = onValue(bookingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDetails(data.details || booking?.details || null);
        setSelectedItems(data.items || {});
      } else {
        setDetails(booking?.details || null);
      }
      setLoading(false);  // Set loading to false when data is loaded
    });

    return () => unsubscribe();
  }, [userMobile, customerName, booking?.details]);

  const toggleItem = (category, item) => {
    const updated = { ...selectedItems };
    if (!updated[category]) updated[category] = [];

    if (updated[category].includes(item)) {
      updated[category] = updated[category].filter(i => i !== item);
      if (updated[category].length === 0) delete updated[category];
    } else {
      updated[category].push(item);
    }

    setSelectedItems(updated);

    const db = getDatabase();
    const bookingRef = ref(db, `finalBookings/${userMobile}/${customerName}`);
    set(bookingRef, {
      details: details || {},
      items: updated,
    }).catch((error) => {
      console.error("Error updating booking items:", error);
    });
  };

  const handleFilterChange = (category) => {
    setFilter(category);
  };

  // Function to handle adding custom item
  const addCustomItem = () => {
    if (!customItem.trim()) return; // Do not add empty custom items

    const db = getDatabase();
    const customItemsRef = ref(db, `finalBookings/${userMobile}/${customerName}/items/customItems`); // Path where custom items are stored

    // Get current custom items from the database
    onValue(customItemsRef, (snapshot) => {
      const currentItems = snapshot.val() || {};

      // Check if the custom item already exists
      const existingItemKey = Object.values(currentItems).findIndex(item => item.toLowerCase() === customItem.trim().toLowerCase());

      if (existingItemKey !== -1) {
        return; // Stop if the item already exists
      }

      // Get the next available key for the new item
      const newItemKey = Object.keys(currentItems).length;

      // Create the updated custom items object with the new item
      const updatedItems = { ...currentItems, [newItemKey]: customItem.trim() };

      // Update the custom items in the database
      set(customItemsRef, updatedItems)
        .then(() => {
          setCustomItem(''); // Clear the input after adding
          alert("Custom item added successfully!");
        })
        .catch((error) => {
          console.error("Error adding custom item:", error);
        });
    });
  };

  const renderGroupedItems = (groupedItems) => {
    return Object.entries(groupedItems).map(([category, itemsObj]) => {
      const lowerSearch = searchTerm.toLowerCase();
      const categoryMatch = category.toLowerCase().includes(lowerSearch);

      const filteredItems = Object.values(itemsObj).filter((item) =>
        item.toLowerCase().includes(lowerSearch)
      );

      if (!categoryMatch && filteredItems.length === 0) return null;

      const itemsToDisplay = categoryMatch ? Object.values(itemsObj) : filteredItems;

      // Count the number of selected items for the current category
      const selectedCount = selectedItems[category]?.length || 0;

      return (
        <div key={category} style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#2b79b5',
            marginBottom: '12px',
            borderBottom: '2px solid #e0e0e0',
            paddingBottom: '4px',
          }}>
            {category} ({selectedCount}) {/* Display the selected count */}
          </h3>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            {itemsToDisplay.map((item) => {
              const isChecked = selectedItems[category]?.includes(item) || false;

              return (
                <label
                  key={item}
                  style={{
                    flex: '1 1 45%',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isChecked ? '#e1f5fe' : '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(category, item)}
                    style={{
                      marginRight: '10px',
                      transform: 'scale(1.3)',
                    }}
                  />
                  {item}
                </label>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    // Adjusted to prevent layout shifting
<div style={{
  padding: '16px',
  maxWidth: '700px',
  margin: '0 auto',
  fontFamily: 'Segoe UI, Roboto, sans-serif',
}}>
  <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>
    Select Food Items for <span style={{ color: '#2b79b5' }}>{customerName}</span>
  </h2>

  {/* Loading UI */}
  {loading ? (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
      fontSize: '18px',
      color: '#2b79b5',
    }}>
      <ClipLoader />
    </div>
  ) : (
    <>
      {/* Search + Filter */}
      <div style={{
        position: 'sticky',
        top: 50,
        backgroundColor: '#fff',
        zIndex: 1000,
        padding: '12px 0',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',  // Optional for shadow effect
      }}>
        <input
          type="text"
          placeholder="Search item or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '12px 14px',
            width: '100%',
            marginBottom: '12px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            fontSize: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        />

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '10px'
        }}>
          {['all', 'veg', 'nonveg'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              style={{
                padding: '8px 16px',
                backgroundColor: filter === cat ? '#2b79b5' : '#f0f0f0',
                color: filter === cat ? '#fff' : '#333',
                borderRadius: '20px',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Item Input */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={customItem}
          onChange={(e) => setCustomItem(e.target.value)}
          placeholder="Add custom item..."
          style={{
            padding: '12px 14px',
            width: '100%',
            marginBottom: '8px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            fontSize: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        />
        <button
          onClick={addCustomItem}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2b79b5',
            color: '#fff',
            borderRadius: '20px',
            border: 'none',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Add Custom Item
        </button>
      </div>

      {/* Render Items */}
      <div>
        {filter === 'all' && (
          <>
            {renderGroupedItems(vegItemsGrouped)}
            {renderGroupedItems(nonVegItemsGrouped)}
          </>
        )}
        {filter === 'veg' && renderGroupedItems(vegItemsGrouped)}
        {filter === 'nonveg' && renderGroupedItems(nonVegItemsGrouped)}
      </div>
    </>
  )}
</div>

  );
}

export default FinalSelectItemsPage;
