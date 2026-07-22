import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Send, 
  Award, 
  User, 
  LogOut, 
  Menu, 
  X, 
  CreditCard,
  Clock
} from 'lucide-react';
import '../styles/sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Send Money', path: '/transfer', icon: Send },
    { name: 'Transaction History', path: '/history', icon: Clock },
    { name: 'Rewards', path: '/rewards', icon: Award },
    { name: 'Profile Settings', path: '/profile', icon: User },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile Navbar Header */}
      <header className="mobile-header">
        <div className="mobile-brand">
          <CreditCard className="brand-icon" />
          <span>PayFlow</span>
        </div>
        <button className="mobile-toggle" onClick={toggleSidebar}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

      {/* Sidebar Container */}
      <aside className={`sidebar-container ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <CreditCard className="brand-icon" />
          <span>PayFlow</span>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `menu-link ${isActive ? 'menu-link-active' : ''}`
                }
                onClick={() => setIsOpen(false)}
              >
                <Icon className="menu-icon" />
                <span className="menu-text">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.fullName || 'User'}</span>
              <span className="user-username">@{user.username}</span>
            </div>
          </div>
          
          <button onClick={logout} className="logout-btn" title="Logout">
            <LogOut className="logout-icon" />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
