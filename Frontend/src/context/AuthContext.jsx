import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token and username already exist in localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('payflow_token');
      const username = localStorage.getItem('payflow_username');

      if (token && username) {
        try {
          // Verify token by loading profile
          const res = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            const profileData = await res.json();
            setUser({
              token,
              username,
              ...profileData
            });
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (e) {
          console.error("Auth initialization failed", e);
          // Keep local user details but might be offline
          setUser({ token, username });
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: errorText || 'Invalid credentials' };
      }

      const data = await res.json(); // { token, username }
      localStorage.setItem('payflow_token', data.token);
      localStorage.setItem('payflow_username', data.username);

      // Fetch full profile details
      const profileRes = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });

      let profileData = {};
      if (profileRes.ok) {
        profileData = await profileRes.json();
      }

      setUser({
        token: data.token,
        username: data.username,
        ...profileData
      });

      return { success: true };
    } catch (e) {
      console.error("Login request failed", e);
      return { success: false, error: 'Connection to server failed. Please check if services are running.' };
    }
  };

  const register = async (registerData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: errorText || 'Registration failed' };
      }

      const data = await res.json(); // { token, username }
      localStorage.setItem('payflow_token', data.token);
      localStorage.setItem('payflow_username', data.username);

      setUser({
        token: data.token,
        username: data.username,
        fullName: registerData.fullName,
        email: registerData.email,
        mobileNumber: registerData.mobileNumber
      });

      return { success: true };
    } catch (e) {
      console.error("Registration request failed", e);
      return { success: false, error: 'Connection to server failed. Please check if services are running.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('payflow_token');
    localStorage.removeItem('payflow_username');
    setUser(null);
  };

  // Helper fetch method that includes the authorization header
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('payflow_token');
    
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Auto logout if unauthorized
      logout();
    }

    return response;
  };

  const updateProfile = async (updateData) => {
    try {
      const res = await fetchWithAuth('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, error: errorText || 'Failed to update profile' };
      }

      const profileData = await res.json();
      setUser(prev => ({
        ...prev,
        ...profileData
      }));

      return { success: true };
    } catch (e) {
      console.error("Update profile failed", e);
      return { success: false, error: 'Connection failed' };
    }
  };

  const deactivateAccount = async (email, password) => {
    try {
      const res = await fetch('/api/auth/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = text; }
      if (!res.ok) {
        return { success: false, error: typeof data === 'string' ? data : (data.message || 'Deactivation failed') };
      }
      return { success: true, message: typeof data === 'string' ? data : data.message };
    } catch (e) {
      console.error('Deactivation error', e);
      return { success: false, error: 'Connection failed' };
    }
  };

  const reactivateAccount = async (email, password, transactionPin) => {
    try {
      const res = await fetch('/api/auth/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, transactionPin })
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = text; }
      if (!res.ok) {
        return { success: false, error: typeof data === 'string' ? data : (data.message || 'Reactivation failed') };
      }
      return { success: true, message: typeof data === 'string' ? data : data.message };
    } catch (e) {
      console.error('Reactivation error', e);
      return { success: false, error: 'Connection failed' };
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.username) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const eventSource = new EventSource(`/api/notifications/stream?username=${user.username}`);

    eventSource.addEventListener("NOTIFICATION", (event) => {
      try {
        const newNotif = JSON.parse(event.data);
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((c) => c + 1);
      } catch (err) {
        console.error("Error parsing notification", err);
      }
    });

    eventSource.addEventListener("INIT", (event) => {
      console.log("SSE Connection Initialized globally:", event.data);
    });

    eventSource.onerror = (err) => {
      console.error("SSE Error globally:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user?.username]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchWithAuth,
    updateProfile,
    deactivateAccount,
    reactivateAccount,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
