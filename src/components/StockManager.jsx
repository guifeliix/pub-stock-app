import React, { useState, useEffect } from 'react';
import './StockManager.css';

const SECTIONS = ['Fridge', 'Keg Room', 'Water Room'];

const StockManager = () => {
    // Current Shopping List
    const [products, setProducts] = useState(() => {
        const saved = localStorage.getItem('pub-stock-list');
        return saved ? JSON.parse(saved) : [];
    });

    // Validated Product Catalog
    const [catalog, setCatalog] = useState([]);

    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    // const [section, setSection] = useState(SECTIONS[0]); // Removed: Auto-detected now

    // Catalog Inputs
    const [catalogInput, setCatalogInput] = useState('');
    const [catalogSection, setCatalogSection] = useState(SECTIONS[0]);

    // Persistence
    useEffect(() => {
        localStorage.setItem('pub-stock-list', JSON.stringify(products));
    }, [products]);

    // Load Catalog from API
    useEffect(() => {
        fetch('/api/catalog')
            .then(res => res.json())
            .then(data => setCatalog(data))
            .catch(err => console.error('Failed to load catalog:', err));
    }, []);

    // HANDLERS

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Try to find section from catalog
        const cleanName = name.trim();
        const catalogItem = catalog.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
        const targetSection = catalogItem ? catalogItem.section : SECTIONS[0]; // Default to first section if unknown

        addOrUpdateProduct(cleanName, quantity || '0', targetSection);

        setName('');
        setQuantity('');
    };

    const addOrUpdateProduct = (productName, qtyStr, productSection) => {
        setProducts(prev => {
            // Check if product already exists (case-insensitive)
            const index = prev.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());

            if (index >= 0) {
                // Update existing
                const newProducts = [...prev];
                const existingQty = parseInt(newProducts[index].quantity) || 0;
                const newQty = existingQty + (parseInt(qtyStr) || 0);

                // Note: We don't update the section of an existing item to avoid confusion, 
                // or we could overwrite it. Let's keep existing section.
                newProducts[index] = { ...newProducts[index], quantity: newQty.toString() };
                return newProducts;
            } else {
                // Add new
                return [{
                    id: Date.now(),
                    name: productName,
                    quantity: qtyStr,
                    section: productSection || SECTIONS[0]
                }, ...prev];
            }
        });
    };

    const removeProduct = (id) => {
        setProducts(prev => prev.filter(p => p.id !== id));
    };

    // CATALOG HANDLERS

    const handleAddToCatalog = (e) => {
        e.preventDefault();
        if (!catalogInput.trim()) return;

        const cleanName = catalogInput.trim();

        if (catalog.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            alert('Product already in catalog');
            return;
        }

        const newItem = {
            name: cleanName,
            section: catalogSection
        };

        // Save to API
        fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        })
            .then(res => res.json())
            .then(savedItem => {
                setCatalog(prev => [...prev, savedItem]);
                setCatalogInput('');
                setCatalogSection(SECTIONS[0]);
            })
            .catch(err => console.error('Error adding to catalog:', err));
    };

    const removeCatalogItem = (e, id) => {
        e.stopPropagation(); // prevent triggering the quick add

        fetch(`/api/catalog/${id}`, { method: 'DELETE' })
            .then(res => {
                if (res.ok) {
                    setCatalog(prev => prev.filter(c => c.id !== id));
                } else {
                    console.error('Failed to delete catalog item:', res.statusText);
                }
            })
            .catch(err => console.error('Error removing catalog item:', err));
    };

    const handleQuickAdd = (catalogItem) => {
        // Quick add implies adding 1 unit, using the section defined in the catalog
        addOrUpdateProduct(catalogItem.name, '1', catalogItem.section);
    };

    // Group products by section for display
    const productsBySection = SECTIONS.reduce((acc, section) => {
        acc[section] = products.filter(p => (p.section || SECTIONS[0]) === section);
        return acc;
    }, {});

    // Handle products with unknown sections (legacy data)
    const unknownProducts = products.filter(p => !SECTIONS.includes(p.section || SECTIONS[0]));
    if (unknownProducts.length > 0) {
        if (!productsBySection['Other']) productsBySection['Other'] = [];
        productsBySection['Other'].push(...unknownProducts);
    }

    const clearList = () => {
        if (products.length === 0) return;

        if (window.confirm('Are you sure you want to clear the entire stock list? This cannot be undone.')) {
            setProducts([]);
        }
    };

    return (
        <div className="stock-manager-wrapper">
            {/* Top Bar: Input Form */}
            <div className="input-bar">
                <h2 className="bar-title">Add to Stock List</h2>
                <form onSubmit={handleSubmit} className="stock-form-inline">
                    <div className="form-group-inline" style={{ flex: 2 }}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Product Name..."
                            className="form-input-compact"
                        />
                    </div>
                    <div className="form-group-inline" style={{ flex: '0 0 80px' }}>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Qty"
                            className="form-input-compact"
                        />
                    </div>
                    <button type="submit" className="add-button-compact">
                        Add
                    </button>
                </form>
            </div>

            {/* Main Content: List + Catalog */}
            <div className="stock-content-grid">
                <div className="stock-list-container">
                    <div className="section-header-actions">
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Current List</h2>
                        {products.length > 0 && (
                            <button
                                onClick={clearList}
                                className="clear-list-btn"
                                title="Clear all items"
                            >
                                Clear List
                            </button>
                        )}
                    </div>
                    {products.length === 0 ? (
                        <p className="empty-state">No items in the list. Start tracking!</p>
                    ) : (
                        <div className="stock-list-wrapper">
                            {Object.entries(productsBySection).map(([sectionName, sectionProducts]) => {
                                if (sectionProducts.length === 0) return null;
                                return (
                                    <div key={sectionName} className="stock-list-group">
                                        <h3 className="group-title">{sectionName}</h3>
                                        <ul className="stock-list">
                                            {sectionProducts.map(product => (
                                                <li key={product.id} className="stock-item">
                                                    <span className="product-name">{product.name}</span>
                                                    <div className="product-actions">
                                                        <span className="product-quantity">Qty: {product.quantity}</span>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => removeProduct(product.id)}
                                                            aria-label="Remove item"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="catalog-section">
                    <div className="catalog-header">
                        <h2 className="section-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>Quick Catalog</h2>
                    </div>
                    <form onSubmit={handleAddToCatalog} className="catalog-form">
                        <div className="catalog-input-group">
                            <input
                                type="text"
                                className="catalog-input"
                                placeholder="Product name..."
                                value={catalogInput}
                                onChange={(e) => setCatalogInput(e.target.value)}
                            />
                        </div>
                        <div className="catalog-input-group">
                            <select
                                className="catalog-select"
                                value={catalogSection}
                                onChange={(e) => setCatalogSection(e.target.value)}
                            >
                                {SECTIONS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <button type="submit" className="catalog-add-btn" aria-label="Add to catalog">+</button>
                        </div>
                    </form>

                    {catalog.length === 0 ? (
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textAlign: 'center' }}>
                            Add favorite items here for quick access.
                        </p>
                    ) : (
                        <div className="catalog-grid">
                            {[...catalog].sort((a, b) => {
                                const sectionIndexA = SECTIONS.indexOf(a.section);
                                const sectionIndexB = SECTIONS.indexOf(b.section);
                                // If section not found (legacy or error), put at end
                                const idxA = sectionIndexA === -1 ? 999 : sectionIndexA;
                                const idxB = sectionIndexB === -1 ? 999 : sectionIndexB;

                                if (idxA !== idxB) return idxA - idxB;
                                return a.name.localeCompare(b.name);
                            }).map(item => (
                                <button
                                    key={item.id}
                                    className="catalog-item-btn"
                                    onClick={() => handleQuickAdd(item)}
                                    title={`Add ${item.name} to ${item.section}`}
                                >
                                    <div className="catalog-item-top">
                                        <span>{item.name}</span>
                                        <span
                                            className="catalog-item-delete"
                                            onClick={(e) => removeCatalogItem(e, item.id)}
                                            title="Remove from catalog"
                                        >
                                            &times;
                                        </span>
                                    </div>
                                    <span className="catalog-item-section">{item.section}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockManager;
