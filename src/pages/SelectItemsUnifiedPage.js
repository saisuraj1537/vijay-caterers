import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners';
import useSpeechToText from '../components/useSpeechToText';

function SelectItemsUnifiedPage({ mode }) {
  const isFinalMode = mode === 'final';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  const [selectedItems, setSelectedItems] = useState({});
  const [details, setDetails] = useState(null);
  const [vegItemsGrouped, setVegItemsGrouped] = useState({});
  const [nonVegItemsGrouped, setNonVegItemsGrouped] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingCustomItem, setPendingCustomItem] = useState('');
  const [selectedCustomCategory, setSelectedCustomCategory] = useState('');

  const categoryRefs = useRef({});
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  const userMobile = booking?.userMobile || localStorage.getItem('loggedInMobile');
  const customerName = booking?.customerName;

  const bookingPath = isFinalMode
    ? `finalBookings/${userMobile}/${customerName}`
    : `bookings/${userMobile}/${customerName}`;

  const customCategoryOrder = [
    'sweets', 'juices', 'vegSnacks', 'hots', 'rotis', 'kurmaCurries',
    'specialGravyCurries', 'specialRiceItems', 'vegDumBiryanis', 'dalItems',
    'vegFryItems', 'liquidItems', 'rotiChutneys', 'avakayalu', 'powders',
    'curds', 'papads', 'chatItems', 'chineseList', 'italianSnacks',
    'southIndianTiffins', 'fruits', 'iceCreams', 'pan', 'soda',
    'chickenSnacks', 'prawnSnacks', 'eggSnacks', 'muttonSnacks', 'seaFoods',
    'muttonCurries', 'eggItems', 'prawnsItems', 'chickenCurries',
    'crabItems', 'nonVegBiryanis', 'nonVegSoups', 'customItems'
  ];

  const highlightedSweets = [
    "Annamayya Laddu – అన్నమ్య లడ్డు", "Poornam – పూర్ణం", "Chakkara Pongali – చక్కెర పంగళి",
    "Apricot Pudding – ఆప్రికాట్ పుడ్డింగ్", "Carrot Halwa – గాజరుల హల్వా", "Bobbattlu – బొబ్బట్లు",
    "Jilebi – జిలేబీ", "Double Ka Meetha – డబుల్ కా మీథా", "Gulab Jamun – గులాబ్ జామున్"
  ];

  // Fetch data from Firebase
  useEffect(() => {
    if (!userMobile || !customerName) return;
    const db = getDatabase();

    onValue(ref(db, 'items'), snapshot => {
      const data = snapshot.val();
      if (data) setVegItemsGrouped(data);
    });

    onValue(ref(db, 'nonVegItems'), snapshot => {
      const data = snapshot.val();
      if (data) setNonVegItemsGrouped(data);
    });

    const bookingRef = ref(db, bookingPath);
    const unsubscribe = onValue(bookingRef, snapshot => {
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
  }, [userMobile, customerName, bookingPath]);

  // Sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setSidebarVisible(width >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const bookingRef = ref(db, bookingPath);
    set(bookingRef, {
      details: details || {},
      items: updated,
    }).catch(console.error);
  };

  const hasMatchingItem = () => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    const matches = (groupedItems) =>
      Object.values(groupedItems).some(itemsObj =>
        Object.values(itemsObj).some(item => item.toLowerCase() === lowerSearch)
      );
    if (filter === 'veg') return matches(vegItemsGrouped);
    if (filter === 'nonveg') return matches(nonVegItemsGrouped);
    return matches(vegItemsGrouped) || matches(nonVegItemsGrouped);
  };

  const addCustomItem = () => {
    const trimmedItem = searchTerm.trim();
    if (!trimmedItem) return;

    if (isFinalMode) {
      setPendingCustomItem(trimmedItem);
      setShowCategoryModal(true);
    } else {
      const db = getDatabase();
      const customItemsRef = ref(db, `${bookingPath}/items/customItems`);

      onValue(customItemsRef, (snapshot) => {
        const currentItems = snapshot.val() || {};
        const exists = Object.values(currentItems).some(item => item.toLowerCase() === trimmedItem.toLowerCase());
        if (exists) return;

        const newKey = Object.keys(currentItems).length;
        set(customItemsRef, {
          ...currentItems,
          [newKey]: trimmedItem
        });
      }, { onlyOnce: true });

      setSearchTerm('');
      alert("Custom item added successfully!");
    }
  };

  const confirmAddCustomItem = () => {
    if (!selectedCustomCategory) {
      alert("Please select a category.");
      return;
    }

    const db = getDatabase();
    const isVeg = Object.keys(vegItemsGrouped).includes(selectedCustomCategory);
    const categoryRef = ref(db, `${isVeg ? 'items' : 'nonVegItems'}/${selectedCustomCategory}`);

    onValue(categoryRef, (snapshot) => {
      const existing = snapshot.val() || {};
      const values = Object.values(existing);
      if (values.includes(pendingCustomItem)) {
        alert("Item already exists in this category.");
        return;
      }

      const newKey = Object.keys(existing).length;
      const updatedCategory = { ...existing, [newKey]: pendingCustomItem };

      set(categoryRef, updatedCategory)
        .then(() => {
          const updatedSelected = { ...selectedItems };
          if (!updatedSelected[selectedCustomCategory]) updatedSelected[selectedCustomCategory] = [];
          updatedSelected[selectedCustomCategory].push(pendingCustomItem);

          return set(ref(db, bookingPath), {
            details: details || {},
            items: updatedSelected
          });
        })
        .then(() => {
          alert("Item added to booking.");
          setSelectedItems(prev => ({
            ...prev,
            [selectedCustomCategory]: [...(prev[selectedCustomCategory] || []), pendingCustomItem]
          }));
        });
    }, { onlyOnce: true });

    setShowCategoryModal(false);
    setPendingCustomItem('');
    setSelectedCustomCategory('');
  };

  const renderGroupedItems = (groupedItems) => {
    const lowerSearch = searchTerm.toLowerCase();
    const sortedEntries = Object.entries(groupedItems).sort(([a], [b]) => {
      const indexA = customCategoryOrder.indexOf(a);
      const indexB = customCategoryOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedEntries.map(([category, itemsObj]) => {
      const categoryMatch = category.toLowerCase().includes(lowerSearch);
      let items = categoryMatch
        ? Object.values(itemsObj)
        : Object.values(itemsObj).filter(item => item.toLowerCase().includes(lowerSearch));

      if (!categoryMatch && items.length === 0) return null;

      const selectedCount = selectedItems[category]?.length || 0;

      if (category === 'sweets') {
        const highlightedSet = new Set(highlightedSweets);
        const highlighted = highlightedSweets.filter(item => items.includes(item));
        const nonHighlighted = items.filter(item => !highlightedSet.has(item));
        items = [...highlighted, ...nonHighlighted];
      }

      return (
        <div key={category}>
          <h3>{category} ({selectedCount})</h3>
          <div>
            {items.map(item => (
              <label key={item}>
                <input
                  type="checkbox"
                  checked={selectedItems[category]?.includes(item) || false}
                  onChange={() => toggleItem(category, item)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      );
    });
  };

  const normalizeSearchTerm = (term) => {
    const lowered = term.toLowerCase().trim();
    return useSpeechToText[lowered] || term;
  };

  const startListening = () => {
    if (!recognition) {
      alert("Voice recognition not supported.");
      return;
    }
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      const normalized = useSpeechToText[transcript] || transcript;
      setSearchTerm(normalized);
    };
    recognition.onerror = (e) => console.error("Voice error:", e.error);
  };

  return (
    <div>
      <h2>Select Food Items for {customerName}</h2>

      <input
        type="text"
        value={searchTerm}
        placeholder="Search or speak..."
        onChange={(e) => setSearchTerm(normalizeSearchTerm(e.target.value))}
      />
      <button onClick={startListening}>🎤</button>

      {!hasMatchingItem() && (
        <button onClick={addCustomItem}>Add "{searchTerm}" as custom item</button>
      )}

      {filter === 'all' && (
        <>
          {renderGroupedItems(vegItemsGrouped)}
          {renderGroupedItems(nonVegItemsGrouped)}
        </>
      )}
      {filter === 'veg' && renderGroupedItems(vegItemsGrouped)}
      {filter === 'nonveg' && renderGroupedItems(nonVegItemsGrouped)}

      {showCategoryModal && (
        <div>
          <h4>Add "{pendingCustomItem}" to which category?</h4>
          <select value={selectedCustomCategory} onChange={e => setSelectedCustomCategory(e.target.value)}>
            <option value="">-- Choose --</option>
            {customCategoryOrder.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button onClick={() => setShowCategoryModal(false)}>Cancel</button>
          <button onClick={confirmAddCustomItem}>Confirm</button>
        </div>
      )}
    </div>
  );
}

export default SelectItemsUnifiedPage;
