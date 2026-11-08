import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await profileAPI.list();
      setProfiles(res.data);
      if (res.data.length > 0) {
        // Retain current active profile or select first one
        const currentId = activeProfile?.id;
        const matched = res.data.find(p => p.id === currentId);
        setActiveProfile(matched || res.data[0]);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const selectProfile = (profile) => {
    setActiveProfile(profile);
  };

  const addProfile = async (data) => {
    const res = await profileAPI.create(data);
    await fetchProfiles();
    setActiveProfile(res.data);
    return res.data;
  };

  const updateProfile = async (id, data) => {
    const res = await profileAPI.update(id, data);
    await fetchProfiles();
    if (activeProfile?.id === id) setActiveProfile(res.data);
    return res.data;
  };

  const deleteProfile = async (id) => {
    await profileAPI.delete(id);
    await fetchProfiles();
  };

  return (
    <ProfileContext.Provider value={{
      profiles,
      activeProfile,
      loading,
      selectProfile,
      addProfile,
      updateProfile,
      deleteProfile,
      refreshProfiles: fetchProfiles
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
