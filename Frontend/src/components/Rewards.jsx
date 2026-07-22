import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, Zap, Shield, Crown, RefreshCw, Clock } from 'lucide-react';
import '../styles/rewards.css';

const Rewards = () => {
  const { fetchWithAuth } = useAuth();
  const [rewards, setRewards] = useState({ balance: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRewardsData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Fetch Rewards Balance
      const balanceRes = await fetchWithAuth('/api/rewards/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setRewards(balanceData);
      }

      // Fetch Rewards History
      const historyRes = await fetchWithAuth('/api/rewards/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const sortedHistory = historyData.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt));
        setHistory(sortedHistory);
      }
    } catch (e) {
      console.error("Failed to load rewards details", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const getTierInfo = (points) => {
    if (points < 100) {
      return {
        name: 'Bronze Member',
        icon: Shield,
        color: '#cd7f32',
        nextTier: 'Silver Member',
        nextTierPoints: 100,
        progress: (points / 100) * 100,
        perks: 'Earn 1 point per ₹10 spent on transactions.'
      };
    } else if (points < 500) {
      return {
        name: 'Silver Member',
        icon: Zap,
        color: '#c0c0c0',
        nextTier: 'Gold Member',
        nextTierPoints: 500,
        progress: ((points - 100) / 400) * 100,
        perks: 'Earn 1.5 points per ₹10 spent + Exclusive partner discounts.'
      };
    } else if (points < 2000) {
      return {
        name: 'Gold Member',
        icon: Crown,
        color: '#ffd700',
        nextTier: 'Platinum Member',
        nextTierPoints: 2000,
        progress: ((points - 500) / 1500) * 100,
        perks: 'Earn 2 points per ₹10 spent + Priority customer support + Cash back options.'
      };
    } else {
      return {
        name: 'Platinum Member',
        icon: Crown,
        color: '#e5e7eb',
        nextTier: 'Ultimate Member',
        nextTierPoints: 99999,
        progress: 100,
        perks: 'Earn 3 points per ₹10 spent + Zero transfer fees + Invite-only community events.'
      };
    }
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day}/${month}/${year}, ${time}`;
  };

  const tier = getTierInfo(rewards.balance);
  const TierIcon = tier.icon;

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '220px', height: '2.5rem' }}></div>
          <div className="skeleton" style={{ width: '40px', height: '2.5rem' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="rewards-grid">
          <div className="skeleton" style={{ height: '320px', borderRadius: '20px' }}></div>
          <div className="skeleton" style={{ height: '320px', borderRadius: '20px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }}></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Rewards Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Loyalty Rewards</h1>
          <p style={{ color: 'var(--text-muted)' }}>Check your membership tier level, perks, and loyalty points logs.</p>
        </div>
        <button 
          onClick={() => fetchRewardsData(true)} 
          className="btn btn-secondary" 
          style={{ padding: '0.6rem', minWidth: '40px' }}
          disabled={refreshing}
          title="Refresh Rewards"
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} style={{ width: '1.2rem', height: '1.2rem', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }} className="rewards-grid">
        {/* Card 1: Active Tier Status */}
        <div className="glass-card tier-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="card-lbl">Membership Level</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div className="tier-avatar" style={{ backgroundColor: `${tier.color}15`, border: `2px solid ${tier.color}` }}>
                <TierIcon style={{ color: tier.color, width: '2.25rem', height: '2.25rem' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)', color: tier.color }}>{tier.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Perks unlocked</p>
              </div>
            </div>
          </div>

          <div className="tier-progress-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progress to {tier.nextTier}</span>
              <span style={{ fontWeight: '600' }}>{rewards.balance} / {tier.nextTierPoints} pts</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${tier.progress}%`, backgroundColor: tier.color }}></div>
            </div>
            {rewards.balance < tier.nextTierPoints && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', display: 'block' }}>
                Earn {tier.nextTierPoints - rewards.balance} more points to upgrade your status tier.
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Perks Summary & Rules */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Zap style={{ color: 'var(--color-secondary)', width: '1.25rem', height: '1.25rem' }} />
              Active Level Perks
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {tier.perks}
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-glass)', borderRadius: '12px', padding: '1rem' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How to earn points?</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Every time you transfer money out of your wallet using PayFlow, you automatically earn cashback points computed based on the transaction volume.
            </span>
          </div>
        </div>
      </div>

      {/* Rewards History log */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
          Points Ledger
        </h3>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Award style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem auto', opacity: '0.3', display: 'block' }} />
            <p>No rewards points transactions recorded yet. Complete transfers to generate points!</p>
          </div>
        ) : (
          <div className="history-ledger">
            {history.map((item) => (
              <div key={item.id} className="ledger-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="ledger-avatar">
                    <Award style={{ color: 'var(--warning)', width: '1.15rem', height: '1.15rem' }} />
                  </div>
                  <div>
                    <span className="ledger-desc">{item.description || (item.transactionId ? `Transfer Reward (Tx: ${item.transactionId.substring(0, 8)})` : 'Points Credited')}</span>
                    <span className="ledger-time">{formatDateTime(item.earnedAt)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="ledger-points">+{item.pointsEarned} pts</span>
                  <span className="ledger-status">Earned</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Rewards;
