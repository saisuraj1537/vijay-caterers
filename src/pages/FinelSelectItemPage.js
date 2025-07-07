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
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  const userMobile = booking?.userMobile || localStorage.getItem('loggedInMobile');
  const customerName = booking?.customerName;

  const customCategoryOrder = [
    'sweets', 'juices', 'vegSnacks', 'hots', 'rotis',
    'kurmaCurries', 'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis',
    'dalItems', 'vegFryItems', 'liquidItems', 'rotiChutneys',
    'avakayalu', 'powders', 'curds', 'papads', 'chatItems', 'chineseList',
    'italianSnacks', 'southIndianTiffins', 'fruits', 'iceCreams','pan','soda',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'seaFoods',
    'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
    'crabItems', 'nonVegBiryanis', 'customItems'
  ];

  const highlightedSweets = [
  "Annamya Laddu – అన్నమ్య లడ్డు", "Poornam – పూర్ణం", "Chakkera Pongali – చక్కెర పంగళి",
  "Apricot Pudding – ఆప్రికాట్ పుడ్డింగ్", "Carrot Halwa – గాజరుల హల్వా",
  "Bobbattlu – బొబ్బట్లు", "Jilebi – జిలేబీ", "Double Ka Meetha – డబుల్ కా మీథా",
  "Gulab Jamun – గులాబ్ జామున్"
];


  useEffect(() => {
    if (!userMobile || !customerName) return;

    const db = getDatabase();

    const itemsRef = ref(db, 'items');
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setVegItemsGrouped(data);
    });

    const nonVegRef = ref(db, 'nonVegItems');
    onValue(nonVegRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setNonVegItemsGrouped(data);
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
      setLoading(false);
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

  const hasMatchingItem = () => {
    const lowerSearch = searchTerm.toLowerCase();

    const matches = (groupedItems) =>
      Object.entries(groupedItems).some(([category, items]) =>
        category.toLowerCase().includes(lowerSearch) ||
        Object.values(items).some(item => item.toLowerCase().includes(lowerSearch))
      );

    if (filter === 'veg') return matches(vegItemsGrouped);
    if (filter === 'nonveg') return matches(nonVegItemsGrouped);
    return matches(vegItemsGrouped) || matches(nonVegItemsGrouped);
  };

  const addCustomItem = () => {
    const trimmedItem = searchTerm.trim();
    if (!trimmedItem) return;

    const db = getDatabase();
    const customItemsRef = ref(db, `finalBookings/${userMobile}/${customerName}/items/customItems`);

    onValue(customItemsRef, (snapshot) => {
      const currentItems = snapshot.val() || {};
      const exists = Object.values(currentItems).some(item => item.toLowerCase() === trimmedItem.toLowerCase());

      if (exists) return;

      const newItemKey = Object.keys(currentItems).length;
      const updatedItems = { ...currentItems, [newItemKey]: trimmedItem };

      set(customItemsRef, updatedItems)
        .then(() => {
          setSearchTerm('');
          alert("Custom item added successfully!");
        })
        .catch((error) => {
          console.error("Error adding custom item:", error);
        });
    }, { onlyOnce: true });
  };

  const renderGroupedItems = (groupedItems) => {
  const lowerSearch = searchTerm.toLowerCase();

  const sortedEntries = Object.entries(groupedItems).sort((a, b) => {
    const indexA = customCategoryOrder.indexOf(a[0]);
    const indexB = customCategoryOrder.indexOf(b[0]);

    if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return sortedEntries.map(([category, itemsObj]) => {
    const categoryMatch = category.toLowerCase().includes(lowerSearch);
    let items;

    if (categoryMatch) {
      items = Object.values(itemsObj); // show all if category matches
    } else {
      items = Object.values(itemsObj).filter((item) =>
        item.toLowerCase().includes(lowerSearch)
      );
    }

    if (!categoryMatch && items.length === 0) return null;

    const selectedCount = selectedItems[category]?.length || 0;

    // 🟡 SPECIAL SWEETS HANDLING
    if (category === 'sweets') {
      const highlightedSet = new Set(highlightedSweets);
      const highlighted = highlightedSweets.filter(item => items.includes(item));
      const nonHighlighted = items.filter(item => !highlightedSet.has(item));
      items = [...highlighted, ...nonHighlighted];
    }

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
          {category} ({selectedCount})
        </h3>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          {items.map((item) => {
            const isChecked = selectedItems[category]?.includes(item) || false;
            const isHighlight = category === 'sweets' && highlightedSweets.includes(item);

            return (
              <label
                key={item}
                style={{
                  flex: '1 1 45%',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isChecked
                    ? '#e1f5fe'
                    : isHighlight
                    ? '#fff8e1'
                    : '#fff',
                  border: isHighlight ? '2px solid #fbc02d' : '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: isHighlight ? '600' : 'normal',
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
    <div style={{
      padding: '16px',
      maxWidth: '700px',
      margin: '0 auto',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
    }}>
      <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>
        Select Food Items for <span style={{ color: '#2b79b5' }}>{customerName}</span>
      </h2>

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
          {/* Combined Search + Filter + Add Custom */}
          <div style={{
            position: 'sticky',
            top: 80,
            backgroundColor: '#fff',
            zIndex: 1000,
            padding: '12px 0',
            marginBottom: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <input
              type="text"
              placeholder="Search or add custom item..."
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

            {!hasMatchingItem() && searchTerm.trim() !== '' && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
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
                  Add "{searchTerm}" as custom item
                </button>
              </div>
            )}
          </div>

          {/* Render Filtered Items */}
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
