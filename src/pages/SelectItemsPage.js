import React, { useState, useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaBars } from 'react-icons/fa'; // hamburger icon
import { ClipLoader } from "react-spinners";
import useSpeechToText from '../components/useSpeechToText'; // Adjust path if needed
import { counters, CATEGORY_ORDER, getImageBase64, vegCategoryGroups, nonVegCategoryGroups } from '../components/AllTextItems'


function SelectItemsPage() {
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
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [pendingCustomItem, setPendingCustomItem] = useState('');
  const [selectedCustomCategory, setSelectedCustomCategory] = useState('');
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  const userMobile = booking?.userMobile || localStorage.getItem('loggedInMobile');
  const customerName = booking?.customerName;

  const highlightedSweets = [
    "Annamayya Laddu – అన్నమ్య లడ్డు", "Poornam – పూర్ణం", "Chakkara Pongali – చక్కెర పంగళి", "Apricot Pudding – ఆప్రికాట్ పుడ్డింగ్", "Carrot Halwa – గాజరుల హల్వా", "Bobbattlu – బొబ్బట్లు", "Jilebi – జిలేబీ", "Double Ka Meetha – డబుల్ కా మీథా", "Gulab Jamun – గులాబ్ జామున్"
  ];

  useEffect(() => {
    if (showCategoryModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showCategoryModal]);

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

    const bookingRef = ref(db, `bookings/${userMobile}/${customerName}`);
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

  useEffect(() => {
    const handleScroll = () => {
      // Only hide sidebar on mobile devices (width < 768px) and only if it's currently visible
      if (sidebarVisible && window.innerWidth < 768) {
        setSidebarVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sidebarVisible]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      // Only show sidebar by default on larger screens (>= 768px)
      if (width >= 768) {
        setSidebarVisible(true);
      } else {
        setSidebarVisible(false);
      }
    };

    handleResize(); // Initial check
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
    const bookingRef = ref(db, `bookings/${userMobile}/${customerName}`);
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

  const normalizeSearchTerm = (term) => {
    const lowered = term.toLowerCase().trim();
    return useSpeechToText[lowered] || term;
  };

  const startListening = () => {
    if (!recognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const normalized = useSpeechToText[transcript] || transcript;
      setSearchTerm(normalized);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };
  };

  const confirmAddCustomItem = () => {
    if (!selectedCustomCategory) {
      alert("Please select a category.");
      return;
    }

    const db = getDatabase();
    const isVeg = Object.keys(vegItemsGrouped).includes(selectedCustomCategory);

    const saveToCategory = window.confirm(
      `Do you want to permanently add "${pendingCustomItem}" to "${selectedCustomCategory}" category?`
    );

    if (saveToCategory) {
      const categoryRef = ref(db, `${isVeg ? 'items' : 'nonVegItems'}/${selectedCustomCategory}`);
      onValue(categoryRef, (snapshot) => {
        const existing = snapshot.val() || {};
        const values = Object.values(existing);
        if (values.includes(pendingCustomItem)) {
          alert("Item already exists in this category.");
          return;
        }

        const newKey = Object.keys(existing).length;
        const updatedCategory = {
          ...existing,
          [newKey]: pendingCustomItem,
        };

        set(categoryRef, updatedCategory)
          .then(() => {
            const updatedSelected = { ...selectedItems };
            if (!updatedSelected[selectedCustomCategory]) updatedSelected[selectedCustomCategory] = [];
            if (!updatedSelected[selectedCustomCategory].includes(pendingCustomItem)) {
              updatedSelected[selectedCustomCategory].push(pendingCustomItem);
            }

            const bookingRef = ref(db, `bookings/${userMobile}/${customerName}`);
            return set(bookingRef, {
              details: details || {},
              items: updatedSelected,
            });
          })
          .then(() => {
            alert("Item added to category and booking.");
            setSelectedItems(prev => ({
              ...prev,
              [selectedCustomCategory]: [...(prev[selectedCustomCategory] || []), pendingCustomItem],
            }));
          })
          .catch((error) => {
            console.error("Error saving item to category:", error);
          });
      }, { onlyOnce: true });
    } else {
      const customItemsRef = ref(db, `bookings/${userMobile}/${customerName}/items/customItems`);

      onValue(customItemsRef, (snapshot) => {
        const currentItems = snapshot.val() || {};
        const exists = Object.values(currentItems).some(item => item.toLowerCase() === pendingCustomItem.toLowerCase());

        if (exists) {
          alert("Custom item already exists.");
          return;
        }

        const newKey = Object.keys(currentItems).length;
        const updatedItems = {
          ...currentItems,
          [newKey]: pendingCustomItem,
        };

        set(customItemsRef, updatedItems)
          .then(() => {
            alert("Custom item added to booking (not saved in main category).");
            setSearchTerm('');
          })
          .catch((error) => {
            console.error("Error adding custom item:", error);
          });
      }, { onlyOnce: true });
    }

    setShowCategoryModal(false);
    setPendingCustomItem('');
    setSelectedCustomCategory('');
  };

  const hasMatchingItem = () => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) return true;

    const matches = (groupedItems) =>
      Object.values(groupedItems).some(itemsObj =>
        Object.values(itemsObj).some(item =>
          item.trim().toLowerCase() === lowerSearch
        )
      );

    if (filter === 'veg') return matches(vegItemsGrouped);
    if (filter === 'nonveg') return matches(nonVegItemsGrouped);
    return matches(vegItemsGrouped) || matches(nonVegItemsGrouped);
  };

  const addCustomItem = () => {
    const trimmedItem = searchTerm.trim();
    if (!trimmedItem) return;

    setPendingCustomItem(trimmedItem);
    setShowCategoryModal(true);
  };

  const renderGroupedItems = (groupedItems) => {
    const lowerSearch = searchTerm.toLowerCase();

    const sortedEntries = Object.entries(groupedItems).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a[0]);
      const indexB = CATEGORY_ORDER.indexOf(b[0]);

      if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return sortedEntries.map(([category, itemsObj]) => {
      const categoryMatch = category.toLowerCase().includes(lowerSearch);
      let items;

      if (categoryMatch) {
        items = Object.values(itemsObj);
      } else {
        items = Object.values(itemsObj).filter((item) =>
          item.toLowerCase().includes(lowerSearch)
        );
      }

      if (!categoryMatch && items.length === 0) return null;

      const selectedCount = selectedItems[category]?.length || 0;

      if (category === 'Sweets') {
        const highlightedSet = new Set(highlightedSweets);
        const highlighted = highlightedSweets.filter(item => items.includes(item));
        const nonHighlighted = items.filter(item => !highlightedSet.has(item));
        items = [...highlighted, ...nonHighlighted];
      }

      if (!categoryRefs.current[category]) {
        categoryRefs.current[category] = React.createRef();
      }

      return (
        <div key={category} ref={categoryRefs.current[category]} style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: screenWidth >= 768 && screenWidth < 1024 ? '22px' : '18px',
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
              const isHighlight = category === 'Sweets' && highlightedSweets.includes(item);

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
                    border: isHighlight ? '3px solid #fbc02d' : '3px solid #7d5647',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px',
                    cursor: 'pointer',
                    fontWeight: 550,
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
      paddingLeft: sidebarVisible && screenWidth >= 768 ? '220px' : '16px',
      transition: 'padding-left 0.3s ease',
    }}>
      <h2 style={{
        fontSize: screenWidth >= 768 && screenWidth < 1024 ? '26px' : '22px',
        fontWeight: '600',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
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
          <div style={{
            position: 'sticky',
            top: 80,
            backgroundColor: '#fff',
            zIndex: 1000,
            padding: '12px 0',
            marginBottom: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder="Search or add custom item..."
                value={searchTerm}
                onChange={(e) => {
                  const input = e.target.value;
                  setSearchTerm(normalizeSearchTerm(input));
                }}
                style={{
                  flexGrow: 1,
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #ccc',
                  fontSize: screenWidth >= 768 && screenWidth < 1024 ? '18px' : '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  marginBottom: '7px'
                }}
              />
              <button
                onClick={startListening}
                title="Speak"
                style={{
                  background: '#2b79b5',
                  border: 'none',
                  borderRadius: '50%',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                }}
              >
                🎤
              </button>
            </div>

            {sidebarVisible && (
              <div style={{
                position: screenWidth < 768 ? 'absolute' : 'fixed',
                top: 70,
                left: 0,
                width: '240px',
                height: screenWidth < 768 ? '250px' : '90%',
                backgroundColor: '#f7f7f7',
                borderRight: '1px solid #ccc',
                padding: '16px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
              }}>
                <h4 style={{ marginBottom: '8px' }}>Veg Categories</h4>
                {vegCategoryGroups.map((group, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '12px',
                    backgroundColor: '#fff',
                  }}>
                    {group.map(cat => (
                      <div
                        key={cat.en}
                        onClick={() => {
                          const ref = categoryRefs.current[cat.en];
                          if (ref && ref.current) {
                            const offset = 220;
                            const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
                            window.scrollTo({ top, behavior: 'smooth' });
                          }
                          setActiveCategory(cat.en);
                          if (window.innerWidth < 768) {
                            setTimeout(() => setSidebarVisible(false), 300);
                          }
                        }}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          backgroundColor: activeCategory === cat.en ? '#e0f7fa' : 'transparent',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          ➤ {cat.en}
                        </div>
                        <div style={{
                          fontSize: '15px',
                          color: '#666',
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 'bold'
                        }}>
                          {cat.te}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                <h4 style={{ margin: '16px 0 8px' }}>Non-Veg Categories</h4>
                {nonVegCategoryGroups.map((group, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #ffa726',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '12px',
                    backgroundColor: '#fffaf0',
                  }}>
                    {group.map(cat => (
                      <div
                        key={cat.en}
                        onClick={() => {
                          const ref = categoryRefs.current[cat.en];
                          if (ref && ref.current) {
                            const offset = 220;
                            const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
                            window.scrollTo({ top, behavior: 'smooth' });
                          }
                          setActiveCategory(cat.en);
                          if (window.innerWidth < 768) {
                            setTimeout(() => setSidebarVisible(false), 300);
                          }
                        }}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          backgroundColor: activeCategory === cat.en ? '#ffe0b2' : 'transparent',
                          borderRadius: '6px',
                          marginBottom: '4px',
                          fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                          ➤ {cat.en}
                        </div>
                        <div style={{
                          fontSize: '15px',
                          color: '#666',
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 'bold'
                        }}>
                          {cat.te}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              marginBottom: '10px'
            }}>
              {window.innerWidth < 768 && (
                <button
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  style={{
                    position: 'fixed',
                    top: '100px',
                    left: '0px',
                    zIndex: 1100,
                    backgroundColor: '#2b79b5',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0%',
                    padding: '10px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                  aria-label="Toggle menu"
                >
                  <FaBars />
                </button>
              )}

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
                    fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px',
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
                    fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px',
                    cursor: 'pointer',
                  }}
                >
                  Add "{searchTerm}" as custom item
                </button>
              </div>
            )}
          </div>

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

          {showCategoryModal && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 2000,
            }}>
              <div style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '12px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
              }}>
                <h3 style={{
                  marginBottom: '12px',
                  fontSize: screenWidth >= 768 && screenWidth < 1024 ? '20px' : '16px'
                }}>
                  Add "<span style={{ color: '#2b79b5' }}>{pendingCustomItem}</span>" to which category?
                </h3>

                <select
                  value={selectedCustomCategory}
                  onChange={(e) => setSelectedCustomCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    marginBottom: '16px',
                    fontSize: screenWidth >= 768 && screenWidth < 1024 ? '18px' : '16px'
                  }}
                >
                  <option value="">-- Select Category --</option>
                  {CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ccc',
                      color: '#333',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmAddCustomItem}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2b79b5',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: screenWidth >= 768 && screenWidth < 1024 ? '16px' : '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SelectItemsPage;