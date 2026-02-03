import React, { useState, useEffect } from 'react';
import { isSimilar } from '../utils/stringUtils';
import './StockTake.css';

const BARS = ['Main Bar', 'Upstairs Bar', 'Outside Bar'];

const StockTake = ({ catalog }) => {
    // Inventory State
    const [inventory, setInventory] = useState(() => {
        const saved = localStorage.getItem('pub-stock-inventory');
        return saved ? JSON.parse(saved) : [];
    });

    // Form inputs
    const [bar, setBar] = useState(BARS[0]);
    const [name, setName] = useState('');
    const [fullBottles, setFullBottles] = useState('');
    const [crates, setCrates] = useState('');
    const [crateSize, setCrateSize] = useState('24');
    const [usage, setUsage] = useState('');

    // Persistence
    useEffect(() => {
        localStorage.setItem('pub-stock-inventory', JSON.stringify(inventory));
    }, [inventory]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const cleanName = name.trim();

        // 1. Check for Exact Duplicate IN THE SAME BAR
        const exactMatch = inventory.find(i =>
            i.name.toLowerCase() === cleanName.toLowerCase() && i.bar === bar
        );

        if (exactMatch) {
            alert(`"${cleanName}" is already listed for ${bar}.`);
            return;
        }

        // 2. Check for Fuzzy Duplicate (Global consistency check)
        // We warn if a similar name exists anywhere to encourage consistent naming
        const similarItem = inventory.find(i => isSimilar(i.name, cleanName));
        if (similarItem && similarItem.name.toLowerCase() !== cleanName.toLowerCase()) {
            const proceed = window.confirm(
                `Similar item "${similarItem.name}" exists in the list. \nAre you sure you want to add "${cleanName}" (new spelling)?`
            );
            if (!proceed) return;
        }

        // Validation
        let usageFloat = parseFloat(usage);
        if (isNaN(usageFloat)) usageFloat = 0;
        if (usageFloat < 0) usageFloat = 0;
        if (usageFloat > 1) usageFloat = 1;

        const newItem = {
            id: Date.now(),
            bar,
            name: cleanName,
            full: parseInt(fullBottles) || 0,
            crates: parseInt(crates) || 0,
            crateSize: parseInt(crateSize) || 24,
            usage: usageFloat.toFixed(1)
        };

        setInventory(prev => [...prev, newItem]);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setFullBottles('');
        setCrates('');
        setUsage('');
        // Don't reset Bar or CrateSize as likely entered in batches
    };

    const removeItem = (id) => {
        setInventory(prev => prev.filter(item => item.id !== id));
    };

    const clearInventory = () => {
        if (window.confirm('Are you sure you want to clear the current stock take?')) {
            setInventory([]);
        }
    };

    const getTotalUnits = (item) => {
        const bottleCount = item.full + (item.crates * item.crateSize);
        return (bottleCount + parseFloat(item.usage)).toFixed(1);
    };

    // Group items by Bar
    const inventoryByBar = BARS.reduce((acc, barName) => {
        acc[barName] = inventory.filter(i => i.bar === barName);
        return acc;
    }, {});

    return (
        <div className="stock-take-container">
            {/* Input Section */}
            <div className="stock-take-input-card">
                <h2 className="card-title">Record Stock</h2>
                <form onSubmit={handleSubmit} className="stock-take-form">

                    <div className="form-group">
                        <label htmlFor="barLocation">Bar Location</label>
                        <select
                            id="barLocation"
                            value={bar}
                            onChange={(e) => setBar(e.target.value)}
                            className="form-input"
                        >
                            {BARS.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="productName">Product Name</label>
                        <input
                            id="productName"
                            type="text"
                            list="catalog-suggestions"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jameson"
                            className="form-input"
                            autoComplete="off"
                        />
                        <datalist id="catalog-suggestions">
                            {catalog.map(item => (
                                <option key={item.id} value={item.name} />
                            ))}
                        </datalist>
                    </div>

                    <div className="form-row">
                        <div className="form-group third">
                            <label htmlFor="fullStock">Full Bottles</label>
                            <input
                                id="fullStock"
                                type="number"
                                min="0"
                                value={fullBottles}
                                onChange={(e) => setFullBottles(e.target.value)}
                                placeholder="0"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group third">
                            <label htmlFor="usageStock">Open (0.0-1.0)</label>
                            <input
                                id="usageStock"
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={usage}
                                onChange={(e) => setUsage(e.target.value)}
                                placeholder="0.0"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label htmlFor="crates">Crates</label>
                            <input
                                id="crates"
                                type="number"
                                min="0"
                                value={crates}
                                onChange={(e) => setCrates(e.target.value)}
                                placeholder="0"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group half">
                            <label htmlFor="crateSize">Bottles/Crate</label>
                            <input
                                id="crateSize"
                                type="number"
                                min="1"
                                value={crateSize}
                                onChange={(e) => setCrateSize(e.target.value)}
                                placeholder="24"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <button type="submit" className="action-btn primary">
                        Add to Stock Take
                    </button>
                </form>
            </div>

            {/* List Section */}
            <div className="stock-take-list-container">
                <div className="list-header">
                    <h3>Inventory List</h3>
                    {inventory.length > 0 && (
                        <button onClick={clearInventory} className="text-btn danger">
                            Clear All
                        </button>
                    )}
                </div>

                {inventory.length === 0 ? (
                    <div className="empty-state-small">
                        No items recorded yet.
                    </div>
                ) : (
                    <div className="inventory-groups">
                        {BARS.map(barName => {
                            const barItems = inventoryByBar[barName];
                            if (!barItems || barItems.length === 0) return null;

                            return (
                                <div key={barName} className="stock-group">
                                    <h4 className="group-header">{barName}</h4>
                                    <div className="inventory-table-wrapper">
                                        <table className="inventory-table">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th className="text-center">Count</th>
                                                    <th className="text-right">Total</th>
                                                    <th className="text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {barItems.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="fw-bold">{item.name}</td>
                                                        <td>
                                                            <div className="stock-badges">
                                                                {item.full > 0 && (
                                                                    <span className="badge badge-full">{item.full} Full</span>
                                                                )}
                                                                {item.crates > 0 && (
                                                                    <span className="badge badge-crates">
                                                                        {item.crates} Crate{item.crates > 1 ? 's' : ''} ({item.crateSize})
                                                                    </span>
                                                                )}
                                                                {parseFloat(item.usage) > 0 && (
                                                                    <span className={`badge badge-usage usage-${(parseFloat(item.usage) * 10).toFixed(0)}`}>
                                                                        {item.usage} Open
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="text-right total-cell">
                                                            {getTotalUnits(item)}
                                                        </td>
                                                        <td className="text-right">
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="icon-btn delete"
                                                                title="Remove"
                                                            >
                                                                &times;
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockTake;
