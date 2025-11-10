import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

const MainLayout = ({ children, onSearch }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <Header onSearch={onSearch} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;

