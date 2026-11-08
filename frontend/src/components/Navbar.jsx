import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Upload, LogOut, ShieldCheck, Menu, X, LayoutDashboard, TrendingUp, Calendar, FileText, Smartphone, Sparkles } from 'lucide-react';

const Navbar = ({ onOpenUpload, onOpenAIAssistant, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trends', label: 'Health Trends', icon: TrendingUp },
    { id: 'timeline', label: 'Health Timeline', icon: Calendar },
    { id: 'documents', label: 'Medical Vault', icon: FileText }
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="MediVault AI Logo" 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                objectFit: 'cover',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  MediVault <span style={{ color: '#06b6d4' }}>AI</span>
                </span>
                <span className="badge badge-normal" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                  <ShieldCheck size={10} style={{ marginRight: '3px' }} /> PWA
                </span>
              </div>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Multi-Profile EHR System</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          {user && (
            <nav className="desktop-nav" style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              {navItems.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--accent-blue)' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

          {/* User Action Controls */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isInstallable && (
                <button
                  className="btn btn-secondary desktop-nav"
                  onClick={handleInstallClick}
                  style={{ padding: '6px 12px', fontSize: '0.78rem', border: '1px solid var(--accent-sky)', color: 'var(--accent-sky)' }}
                  title="Install MediVault AI PWA to Device"
                >
                  <Smartphone size={14} /> Install PWA
                </button>
              )}

              {/* Desktop-only Ask AI Assistant Button */}
              <button
                className="btn btn-secondary desktop-nav"
                onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
                style={{
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border-accent)',
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: 'var(--accent-sky)',
                  fontWeight: 700
                }}
              >
                <Sparkles size={15} color="var(--accent-sky)" /> Ask AI Assistant
              </button>

              <button className="btn btn-primary" onClick={onOpenUpload} style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                <Upload size={15} /> <span className="desktop-nav">Smart Upload</span>
              </button>

              <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>

              {/* Mobile Hamburger Menu Toggle Button */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  width: '38px',
                  height: '38px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Hamburger Drawer */}
        {user && mobileMenuOpen && (
          <div className="mobile-menu-drawer" style={{
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            {/* User Profile Header in Drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{user.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <button
                onClick={logout}
                className="btn btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>

            {/* AI Assistant Button in Mobile Hamburger Drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAIAssistant) onOpenAIAssistant();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--border-accent)',
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(6, 182, 212, 0.25))',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <Sparkles size={20} color="var(--accent-sky)" />
              <span>Ask AI Assistant</span>
            </button>

            {/* Navigation Options in Hamburger Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map(tab => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavClick(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--border-accent)' : '1px solid transparent',
                      background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? 'var(--accent-sky)' : 'var(--text-primary)',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={20} color={isSelected ? 'var(--accent-sky)' : 'var(--text-muted)'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {isInstallable && (
              <button
                className="btn btn-secondary"
                onClick={handleInstallClick}
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: 'var(--accent-sky)', borderColor: 'var(--accent-sky)' }}
              >
                <Smartphone size={16} /> Install MediVault AI App
              </button>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (PWA Mobile View) */}
      {user && (
        <nav className="mobile-bottom-nav" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          background: 'rgba(11, 15, 25, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border-color)',
          zIndex: 150,
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '4px 0'
        }}>
          {navItems.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  color: isSelected ? 'var(--accent-sky)' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  gap: '3px'
                }}
              >
                <Icon size={20} color={isSelected ? 'var(--accent-sky)' : 'var(--text-muted)'} />
                <span>{tab.label.replace('Health ', '').replace('Medical ', '')}</span>
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
};

export default Navbar;
