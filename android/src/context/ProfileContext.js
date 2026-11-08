import React, { createContext, useState, useEffect, useContext } from 'react';
import { profileAPI } from '../services/api';
import { AuthContext } from './AuthContext';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await profileAPI.getProfiles();
      setProfiles(data);
      if (data.length > 0) {
        const selfProfile = data.find(p => p.relationship === 'Self') || data[0];
        setActiveProfile(prev => prev ? (data.find(p => p.id === prev.id) || selfProfile) : selfProfile);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfiles();
    } else {
      setProfiles([]);
      setActiveProfile(null);
    }
  }, [user]);

  const selectProfile = (profile) => {
    setActiveProfile(profile);
  };

  const addProfile = async (profileData) => {
    try {
      const newProfile = await profileAPI.createProfile(profileData);
      await fetchProfiles();
      setActiveProfile(newProfile);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to add profile' };
    }
  };

  const updateProfile = async (profileId, profileData) => {
    try {
      const updated = await profileAPI.updateProfile(profileId, profileData);
      await fetchProfiles();
      setActiveProfile(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update profile' };
    }
  };

  const deleteProfile = async (profileId) => {
    try {
      await profileAPI.deleteProfile(profileId);
      await fetchProfiles();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to delete profile.' };
    }
  };

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, selectProfile, addProfile, updateProfile, deleteProfile, fetchProfiles, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};
