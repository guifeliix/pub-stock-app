import React from 'react';
import './Layout.css';

const Layout = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="header-title">Stock</h1>
        <nav className="header-tabs">
          <button
            className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => onTabChange('daily')}
          >
            Daily Stock List
          </button>
          <button
            className={`tab-btn ${activeTab === 'stocktake' ? 'active' : ''}`}
            onClick={() => onTabChange('stocktake')}
          >
            Stock Take
          </button>
        </nav>
      </header>
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>This app was developed by Guilherme</p>
      </footer>
    </div>
  );
};

export default Layout;
