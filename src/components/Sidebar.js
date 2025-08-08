import React from 'react';
import { vegCategoryGroups, nonVegCategoryGroups } from './AllTextItems';

function Sidebar({
    sidebarVisible,
    screenWidth,
    activeCategory,
    setActiveCategory,
    setSidebarVisible,
    categoryRefs
}) {
    const handleCategoryClick = (cat) => {
        const ref = categoryRefs.current[cat];
        if (ref && ref.current) {
            const offset = 220;
            const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
        setActiveCategory(cat);
        if (window.innerWidth < 768) {
            setTimeout(() => setSidebarVisible(false), 300);
        }
    };

    if (!sidebarVisible) return null;

    return (
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
                            onClick={() => handleCategoryClick(cat.en)}
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
                                fontSize: '12px',
                                color: '#666',
                                fontFamily: 'Arial, sans-serif'
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
                            onClick={() => handleCategoryClick(cat.en)}
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
                                fontSize: '12px',
                                color: '#666',
                                fontFamily: 'Arial, sans-serif'
                            }}>
                                {cat.te}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Sidebar; 