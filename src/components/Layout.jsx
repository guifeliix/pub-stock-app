import React from 'react';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        <h1 className="header-title">Stock</h1>
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
