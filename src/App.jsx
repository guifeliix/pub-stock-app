import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StockManager from './components/StockManager';
import StockTake from './components/StockTake';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('daily');
  const [catalog, setCatalog] = useState([]);

  // Load Catalog from API (Shared Source of Truth)
  useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => console.error('Failed to load catalog:', err));
  }, []);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'daily' && (
        <StockManager catalog={catalog} setCatalog={setCatalog} />
      )}
      {activeTab === 'stocktake' && (
        <StockTake catalog={catalog} />
      )}
    </Layout>
  );
}

export default App;
