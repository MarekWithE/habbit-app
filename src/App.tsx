import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import CommunityChat from './components/CommunityChat';
import CommunityInfo from './components/CommunityInfo';
import Dashboard from './components/Dashboard';
import RankBadge from './components/RankBadge';
import DailyTasks from './components/DailyTasks';

function getRankInfo(points: number) {
  const ranks = [
    { tier: 'Bronze', division: 1, points: 0, icon: '🥉', color: '#CD7F32', max_points: 49 },
    { tier: 'Bronze', division: 2, points: 50, icon: '🥉', color: '#CD7F32', max_points: 99 },
    { tier: 'Bronze', division: 3, points: 100, icon: '🥉', color: '#CD7F32', max_points: 149 },
    
    { tier: 'Silver', division: 1, points: 150, icon: '🥈', color: '#E3E3E3', max_points: 199 },
    { tier: 'Silver', division: 2, points: 200, icon: '🥈', color: '#E3E3E3', max_points: 249 },
    { tier: 'Silver', division: 3, points: 250, icon: '🥈', color: '#E3E3E3', max_points: 299 },
    
    { tier: 'Gold', division: 1, points: 300, icon: '🥇', color: '#FFB800', max_points: 349 },
    { tier: 'Gold', division: 2, points: 350, icon: '🥇', color: '#FFB800', max_points: 399 },
    { tier: 'Gold', division: 3, points: 400, icon: '🥇', color: '#FFB800', max_points: 449 },
    
    { tier: 'Platinum', division: 1, points: 450, icon: '🏅', color: '#78c900', max_points: 524 },
    { tier: 'Platinum', division: 2, points: 525, icon: '🏅', color: '#78c900', max_points: 599 },
    { tier: 'Platinum', division: 3, points: 600, icon: '🏅', color: '#78c900', max_points: 674 },
    
    { tier: 'Diamond', division: 1, points: 675, icon: '💎', color: '#1caff5', max_points: 749 },
    { tier: 'Diamond', division: 2, points: 750, icon: '💎', color: '#1caff5', max_points: 824 },
    { tier: 'Diamond', division: 3, points: 825, icon: '💎', color: '#1caff5', max_points: 899 },
    
    { tier: 'Master', division: 1, points: 900, icon: '👑', color: '#ff4b4d', max_points: 1049 },
    { tier: 'Master', division: 2, points: 1050, icon: '👑', color: '#ff4b4d', max_points: 1199 },
    { tier: 'Master', division: 3, points: 1200, icon: '👑', color: '#ff4b4d', max_points: 1349 },
    
    { tier: 'Grandmaster', division: 1, points: 1350, icon: '⚔️', color: '#ce82ff', max_points: 1549 },
    { tier: 'Grandmaster', division: 2, points: 1550, icon: '⚔️', color: '#ce82ff', max_points: 1749 },
    { tier: 'Grandmaster', division: 3, points: 1750, icon: '⚔️', color: '#ce82ff', max_points: 1999 },
    
    { tier: 'Legend', division: null, points: 2000, icon: '🌟', color: '#9de7e8', max_points: 2400 }
  ];

  // Find current rank - look for the first rank that requires more points than the user has
  const currentRank = ranks.find(rank => points < rank.max_points) || ranks[ranks.length - 1];
  const currentRankIndex = ranks.indexOf(currentRank);
  
  // If user has more points than the last rank's max points, they are at max rank
  if (points >= ranks[ranks.length - 1].max_points) {
    return {
      current: ranks[ranks.length - 1],
      next: null,
      progress: 100,
      pointsToNext: 0
    };
  }

  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  
  // Calculate progress to next rank
  let progress = 0;
  let pointsToNext = 0;
  
  if (nextRank) {
    const rangeStart = currentRank.points;
    const rangeEnd = currentRank.max_points;
    const pointsInRange = points - rangeStart;
    const totalRangeSize = rangeEnd - rangeStart;
    progress = (pointsInRange / totalRangeSize) * 100;
    // Calculate points needed to reach the minimum points requirement of the next rank
    pointsToNext = nextRank.points - points;
  } else {
    progress = 100;
  }

  return {
    current: currentRank,
    next: nextRank,
    progress,
    pointsToNext
  };
}

async function uploadAvatar(file: File) {
  try {
    // 1) Get the user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) throw new Error('No authenticated user found');

    // 2) Build the storage path
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    console.log('Uploading avatar for user:', user.id, 'Path:', path);

    // 3) Upload
    const { error: uploadErr } = await supabase
      .storage
      .from('avatars')
      .upload(path, file, { 
        upsert: true,
        cacheControl: '3600'
      });
    
    if (uploadErr) {
      console.error('Upload error:', uploadErr);
      throw uploadErr;
    }
    console.log('Upload successful');

    // 4) Grab the public URL
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(path);
    
    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    const publicUrl = urlData.publicUrl;
    console.log('Got public URL:', publicUrl);

    // 5) UPDATE the existing users_meta row
    const { data: metaData, error: metaErr } = await supabase
      .from('users_meta')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    
    if (metaErr) {
      console.error('Metadata update error:', metaErr);
      throw metaErr;
    }
    console.log('Updated users_meta:', metaData);

    return publicUrl;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

function ProfilePage({ 
  timeRemaining, 
  isChallengeCompleted, 
  isAnimating, 
  handleCompleteChallenge,
  points,
  onPointsUpdate,
  onTimeRemainingChange,
  onIsAnimatingChange,
  onIsChallengeCompletedChange,
  onRankUpdate,
  onTasksUpdate
}: { 
  timeRemaining: string;
  isChallengeCompleted: boolean;
  isAnimating: boolean;
  handleCompleteChallenge: () => Promise<void>;
  points: number;
  onPointsUpdate: (points: number) => void;
  onTimeRemainingChange: (time: string) => void;
  onIsAnimatingChange: (isAnimating: boolean) => void;
  onIsChallengeCompletedChange: (isCompleted: boolean) => void;
  onRankUpdate: (rankInfo: ReturnType<typeof getRankInfo>) => void;
  onTasksUpdate: (tasks: string[]) => void;
}) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | 'month'>('7d');
  const [weeklyPoints, setWeeklyPoints] = useState(0);
  const rankInfo = getRankInfo(points);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [lastTaskReset, setLastTaskReset] = useState<Date | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [isRankUpdating, setIsRankUpdating] = useState(false);
  const [rankProgress, setRankProgress] = useState(0);
  const [userPosition, setUserPosition] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user metadata including current_day
      const { data: userMeta } = await supabase.from('users_meta')
        .select('last_task_reset, current_day')
        .eq('user_id', user.id)
        .single();

      if (userMeta) {
        setLastTaskReset(userMeta.last_task_reset ? new Date(userMeta.last_task_reset) : null);
        setCurrentDay(userMeta.current_day || 1);
      }

      // Load completed tasks
      const { data: tasks } = await supabase
        .from('completed_tasks')
        .select('task_id')
        .eq('user_id', user.id)
        .gte('completed_at', new Date().setHours(0, 0, 0, 0));

      if (tasks) {
        setCompletedTasks(tasks.map(t => t.task_id));
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const checkTaskReset = async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check if we need to reset tasks (if last reset was before today)
      if (!lastTaskReset || lastTaskReset < startOfDay) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Clear completed tasks for the new day
        await supabase
          .from('completed_tasks')
          .delete()
          .eq('user_id', user.id)
          .lt('completed_at', startOfDay);

        // Update user metadata with new day and reset time
        const { data: userMeta } = await supabase
          .from('users_meta')
          .update({
            last_task_reset: startOfDay.toISOString(),
            current_day: currentDay + 1
          })
          .eq('user_id', user.id)
          .select()
          .single();

        // Update local state
        setCompletedTasks([]);
        setLastTaskReset(startOfDay);
        if (userMeta) {
          setCurrentDay(userMeta.current_day);
        }
        
        // Notify parent components
        onTasksUpdate([]);
      }
    };

    checkTaskReset();
  }, [lastTaskReset, currentDay, onTasksUpdate]);

  const handleTaskToggle = async (taskId: string, currentPoints: number, onPointsUpdate: (points: number) => void, onIsAnimatingChange: (isAnimating: boolean) => void) => {
    const isCompleting = !completedTasks.includes(taskId);
    const newCompletedTasks = isCompleting
      ? [...completedTasks, taskId]
      : completedTasks.filter(id => id !== taskId);
    
    setCompletedTasks(newCompletedTasks);
    
    // Calculate points change
    const pointChange = isCompleting ? 5 : -5;
    let pointsToUpdate = Math.max(0, currentPoints + pointChange);
    
    // Handle bonus points
    if (isCompleting && newCompletedTasks.length === 5) {
      pointsToUpdate += 10;
      onIsAnimatingChange(true);
      setTimeout(() => onIsAnimatingChange(false), 2000);
    } else if (!isCompleting && completedTasks.length === 5) {
      pointsToUpdate -= 10;
    }
    
    // Update points in database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update completed tasks in database
    if (isCompleting) {
      const { error: taskError } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: user.id,
          task_id: taskId,
          completed_at: new Date().toISOString()
        });

      if (taskError) {
        console.error('Error saving completed task:', taskError);
        return;
      }
    } else {
      const { error: taskError } = await supabase
        .from('completed_tasks')
        .delete()
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .gte('completed_at', new Date().setHours(0, 0, 0, 0));

      if (taskError) {
        console.error('Error removing completed task:', taskError);
        return;
      }
    }

    // Update points
    const { error: updateError } = await supabase
      .from('users_meta')
      .upsert({ 
        id: user.id,
        points: pointsToUpdate 
      });
      
    if (!updateError) {
      onPointsUpdate(pointsToUpdate);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user found');

        // Fetch all data in parallel
        const [
          { data: userMeta },
          { data: weekPoints }
        ] = await Promise.all([
          supabase
            .from('users_meta')
            .select('full_name, bio, country, points, avatar_url')
            .eq('id', user.id)
            .single(),
          supabase
            .from('points_history')
            .select('points')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .single()
        ]);

        if (userMeta) {
          setUsername(userMeta.full_name || '');
          setBio(userMeta.bio || '');
          setCountry(userMeta.country || '');
          onPointsUpdate(userMeta.points || 0);
          setProfileImage(userMeta.avatar_url);
        }
        
        setWeeklyPoints(weekPoints?.points || 0);
        setDataLoaded(true);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // Effect to handle first render state
  useEffect(() => {
    if (!isLoading && dataLoaded) {
      const timer = setTimeout(() => {
        setIsFirstRender(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, dataLoaded]);

  // Generate daily data for the current month
  const generateMonthData = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthData = [];
    
    const startPoints = points - 50;
    const endPoints = points;
    const pointsIncrement = (endPoints - startPoints) / (daysInMonth - 1);

    for (let day = 1; day <= daysInMonth; day++) {
      monthData.push({
        day: `${day}`,
        points: Math.round(startPoints + (pointsIncrement * (day - 1)))
      });
    }
    return monthData;
  };

  const weekData = [
    { day: 'Mon', points: points - 20 },
    { day: 'Tue', points: points - 15 },
    { day: 'Wed', points: points - 10 },
    { day: 'Thu', points: points - 5 },
    { day: 'Fri', points: points - 2 },
    { day: 'Sat', points: points - 1 },
    { day: 'Sun', points: points },
  ];

  const monthData = generateMonthData();

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication failed');
      }
      if (!user) throw new Error('No user found');

      console.log('Attempting to save profile for user:', user.id);
      console.log('Profile data:', {
        id: user.id,
        full_name: username,
        bio,
        country
      });

      const { data, error: upsertError } = await supabase
        .from('users_meta')
        .upsert({
          id: user.id,
          full_name: username,
          bio: bio,
          country: country,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Database error:', upsertError);
        throw new Error(upsertError.message || 'Failed to save profile');
      }

      if (!data) {
        throw new Error('No data returned from save operation');
      }

      console.log('Save successful:', data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
      setSaveSuccess(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadAvatar(file);
      setProfileImage(publicUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      
      // Calculate days until next Sunday (0 = Sunday, 1 = Monday, etc)
      const daysUntilSunday = (7 - now.getDay()) % 7;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999); // Set to end of Sunday
      
      const diff = nextSunday.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      let countdownStr = '';
      
      if (days > 0) {
        countdownStr += `${days}:`;
      }
      
      countdownStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      onTimeRemainingChange(countdownStr);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [onTimeRemainingChange]);

  useEffect(() => {
    const checkChallengeStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userMeta } = await supabase
        .from('users_meta')
        .select('last_weekly_challenge_completed')
        .eq('user_id', user.id)
        .single();

      if (userMeta?.last_weekly_challenge_completed) {
        const lastCompleted = new Date(userMeta.last_weekly_challenge_completed);
        const now = new Date();
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + (7 - now.getDay()));
        nextSunday.setHours(0, 0, 0, 0);

        if (lastCompleted >= new Date(now.setDate(now.getDate() - now.getDay())) && 
            lastCompleted < nextSunday) {
          onIsChallengeCompletedChange(true);
        }
      }
    };

    checkChallengeStatus();
  }, [onIsChallengeCompletedChange]);

  // Update rank info when points change
  useEffect(() => {
    const newRankInfo = getRankInfo(points);
    const oldRankInfo = rankInfo;
    
    // Check if rank changed
    if (oldRankInfo.current.tier !== newRankInfo.current.tier || 
        oldRankInfo.current.division !== newRankInfo.current.division) {
      setIsRankUpdating(true);
      
      // Animate progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= newRankInfo.progress) {
          progress = newRankInfo.progress;
          clearInterval(interval);
          onRankUpdate(newRankInfo);
          setIsRankUpdating(false);
        }
        setRankProgress(progress);
      }, 20);
      
      return () => clearInterval(interval);
    } else {
      setRankProgress(newRankInfo.progress);
      onRankUpdate(newRankInfo);
    }
  }, [points, rankInfo, onRankUpdate]);

  // Update points and handle rank changes
  const handlePointsUpdate = async (newPoints: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update points in database
    const { error: updateError } = await supabase
      .from('users_meta')
      .upsert({ 
        id: user.id,
        points: newPoints 
      });
      
    if (!updateError) {
      onPointsUpdate(newPoints);
    }
  };

  useEffect(() => {
    const fetchUserPosition = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: allUsers, error: usersError } = await supabase
          .from('users_meta')
          .select('id, points')
          .order('points', { ascending: false });

        if (usersError) {
          console.error('Error fetching users:', usersError);
          return;
        }

        if (!allUsers) return;

        setTotalUsers(allUsers.length);
        const position = allUsers.findIndex(u => u.id === user.id) + 1;
        setUserPosition(position);
      } catch (error) {
        console.error('Error fetching user position:', error);
      }
    };

    fetchUserPosition();
  }, [points]);

  return (
    <div className="flex-1 pr-[10px]">
      <div className="flex gap-2.5 h-full">
        {/* Left Side - Account Settings */}
        <div className="w-[60%]">
          <div className="bg-[#111111] h-full rounded-2xl overflow-auto border border-[#2a2a2a]">
            <div className="bg-[#111111] p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">👤</span>
                <h3 className="text-xl font-bold text-white">Account Settings</h3>
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center gap-4 pb-8 border-b border-[#2a2a2a]">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#2a2a2a] hover:border-[#ffffff30] transition-colors">
                    {isLoading ? (
                      <div className="w-full h-full bg-[#191919] animate-pulse" />
                    ) : profileImage ? (
                      <img
                        src={profileImage}
                        alt="My avatar"
                        style={{ width: 128, height: 128, borderRadius: '50%' }}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-red-500 flex items-center justify-center text-white text-3xl font-medium">
                        {username.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`px-4 py-1.5 bg-[#191919] text-white text-[11px] font-bold rounded-[8px] hover:bg-[#ffffff0f] transition-colors border border-[#2a2a2a] ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </button>
                    {uploadError && (
                      <span className="text-red-500 text-xs">{uploadError}</span>
                    )}
                    <span className="text-gray-400 text-xs">Recommended: Square image, at least 400x400px</span>
                  </div>
                </div>

                {/* Profile Details Section */}
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Username</label>
                    {isLoading ? (
                      <div className="h-10 bg-[#191919] animate-pulse rounded-lg" />
                    ) : (
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191919] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2a2a2a]"
                        placeholder={username || "Enter your username"}
                      />
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Bio</label>
                    {isLoading ? (
                      <div className="h-24 bg-[#191919] animate-pulse rounded-lg" />
                    ) : (
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191919] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] min-h-[80px] resize-none border border-[#2a2a2a]"
                        placeholder="Tell us about yourself..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Country</label>
                    {isLoading ? (
                      <div className="h-10 bg-[#191919] animate-pulse rounded-lg" />
                    ) : (
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-[#191919] text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2a2a2a] border border-[#2a2a2a]"
                      >
                        <option value="">Select your country</option>
                        <option value="AF">Afghanistan</option>
                        <option value="AL">Albania</option>
                        <option value="DZ">Algeria</option>
                        <option value="AD">Andorra</option>
                        <option value="AO">Angola</option>
                        <option value="AG">Antigua and Barbuda</option>
                        <option value="AR">Argentina</option>
                        <option value="AM">Armenia</option>
                        <option value="AU">Australia</option>
                        <option value="AT">Austria</option>
                        <option value="AZ">Azerbaijan</option>
                        <option value="BS">Bahamas</option>
                        <option value="BH">Bahrain</option>
                        <option value="BD">Bangladesh</option>
                        <option value="BB">Barbados</option>
                        <option value="BY">Belarus</option>
                        <option value="BE">Belgium</option>
                        <option value="BZ">Belize</option>
                        <option value="BJ">Benin</option>
                        <option value="BT">Bhutan</option>
                        <option value="BO">Bolivia</option>
                        <option value="BA">Bosnia and Herzegovina</option>
                        <option value="BW">Botswana</option>
                        <option value="BR">Brazil</option>
                        <option value="BN">Brunei</option>
                        <option value="BG">Bulgaria</option>
                        <option value="BF">Burkina Faso</option>
                        <option value="BI">Burundi</option>
                        <option value="CV">Cabo Verde</option>
                        <option value="KH">Cambodia</option>
                        <option value="CM">Cameroon</option>
                        <option value="CA">Canada</option>
                        <option value="CF">Central African Republic</option>
                        <option value="TD">Chad</option>
                        <option value="CL">Chile</option>
                        <option value="CN">China</option>
                        <option value="CO">Colombia</option>
                        <option value="KM">Comoros</option>
                        <option value="CG">Congo</option>
                        <option value="CR">Costa Rica</option>
                        <option value="HR">Croatia</option>
                        <option value="CU">Cuba</option>
                        <option value="CY">Cyprus</option>
                        <option value="CZ">Czech Republic</option>
                        <option value="DK">Denmark</option>
                        <option value="DJ">Djibouti</option>
                        <option value="DM">Dominica</option>
                        <option value="DO">Dominican Republic</option>
                        <option value="EC">Ecuador</option>
                        <option value="EG">Egypt</option>
                        <option value="SV">El Salvador</option>
                        <option value="GQ">Equatorial Guinea</option>
                        <option value="ER">Eritrea</option>
                        <option value="EE">Estonia</option>
                        <option value="SZ">Eswatini</option>
                        <option value="ET">Ethiopia</option>
                        <option value="FJ">Fiji</option>
                        <option value="FI">Finland</option>
                        <option value="FR">France</option>
                        <option value="GA">Gabon</option>
                        <option value="GM">Gambia</option>
                        <option value="GE">Georgia</option>
                        <option value="DE">Germany</option>
                        <option value="GH">Ghana</option>
                        <option value="GR">Greece</option>
                        <option value="GD">Grenada</option>
                        <option value="GT">Guatemala</option>
                        <option value="GN">Guinea</option>
                        <option value="GW">Guinea-Bissau</option>
                        <option value="GY">Guyana</option>
                        <option value="HT">Haiti</option>
                        <option value="HN">Honduras</option>
                        <option value="HU">Hungary</option>
                        <option value="IS">Iceland</option>
                        <option value="IN">India</option>
                        <option value="ID">Indonesia</option>
                        <option value="IR">Iran</option>
                        <option value="IQ">Iraq</option>
                        <option value="IE">Ireland</option>
                        <option value="IL">Israel</option>
                        <option value="IT">Italy</option>
                        <option value="JM">Jamaica</option>
                        <option value="JP">Japan</option>
                        <option value="JO">Jordan</option>
                        <option value="KZ">Kazakhstan</option>
                        <option value="KE">Kenya</option>
                        <option value="KI">Kiribati</option>
                        <option value="KP">North Korea</option>
                        <option value="KR">South Korea</option>
                        <option value="KW">Kuwait</option>
                        <option value="KG">Kyrgyzstan</option>
                        <option value="LA">Laos</option>
                        <option value="LV">Latvia</option>
                        <option value="LB">Lebanon</option>
                        <option value="LS">Lesotho</option>
                        <option value="LR">Liberia</option>
                        <option value="LY">Libya</option>
                        <option value="LI">Liechtenstein</option>
                        <option value="LT">Lithuania</option>
                        <option value="LU">Luxembourg</option>
                        <option value="MG">Madagascar</option>
                        <option value="MW">Malawi</option>
                        <option value="MY">Malaysia</option>
                        <option value="MV">Maldives</option>
                        <option value="ML">Mali</option>
                        <option value="MT">Malta</option>
                        <option value="MH">Marshall Islands</option>
                        <option value="MR">Mauritania</option>
                        <option value="MU">Mauritius</option>
                        <option value="MX">Mexico</option>
                        <option value="FM">Micronesia</option>
                        <option value="MD">Moldova</option>
                        <option value="MC">Monaco</option>
                        <option value="MN">Mongolia</option>
                        <option value="ME">Montenegro</option>
                        <option value="MA">Morocco</option>
                        <option value="MZ">Mozambique</option>
                        <option value="MM">Myanmar</option>
                        <option value="NA">Namibia</option>
                        <option value="NR">Nauru</option>
                        <option value="NP">Nepal</option>
                        <option value="NL">Netherlands</option>
                        <option value="NZ">New Zealand</option>
                        <option value="NI">Nicaragua</option>
                        <option value="NE">Niger</option>
                        <option value="NG">Nigeria</option>
                        <option value="MK">North Macedonia</option>
                        <option value="NO">Norway</option>
                        <option value="OM">Oman</option>
                        <option value="PK">Pakistan</option>
                        <option value="PW">Palau</option>
                        <option value="PA">Panama</option>
                        <option value="PG">Papua New Guinea</option>
                        <option value="PY">Paraguay</option>
                        <option value="PE">Peru</option>
                        <option value="PH">Philippines</option>
                        <option value="PL">Poland</option>
                        <option value="PT">Portugal</option>
                        <option value="QA">Qatar</option>
                        <option value="RO">Romania</option>
                        <option value="RU">Russia</option>
                        <option value="RW">Rwanda</option>
                        <option value="KN">Saint Kitts and Nevis</option>
                        <option value="LC">Saint Lucia</option>
                        <option value="VC">Saint Vincent and the Grenadines</option>
                        <option value="WS">Samoa</option>
                        <option value="SM">San Marino</option>
                        <option value="ST">Sao Tome and Principe</option>
                        <option value="SA">Saudi Arabia</option>
                        <option value="SN">Senegal</option>
                        <option value="RS">Serbia</option>
                        <option value="SC">Seychelles</option>
                        <option value="SL">Sierra Leone</option>
                        <option value="SG">Singapore</option>
                        <option value="SK">Slovakia</option>
                        <option value="SI">Slovenia</option>
                        <option value="SB">Solomon Islands</option>
                        <option value="SO">Somalia</option>
                        <option value="ZA">South Africa</option>
                        <option value="SS">South Sudan</option>
                        <option value="ES">Spain</option>
                        <option value="LK">Sri Lanka</option>
                        <option value="SD">Sudan</option>
                        <option value="SR">Suriname</option>
                        <option value="SE">Sweden</option>
                        <option value="CH">Switzerland</option>
                        <option value="SY">Syria</option>
                        <option value="TW">Taiwan</option>
                        <option value="TJ">Tajikistan</option>
                        <option value="TZ">Tanzania</option>
                        <option value="TH">Thailand</option>
                        <option value="TL">Timor-Leste</option>
                        <option value="TG">Togo</option>
                        <option value="TO">Tonga</option>
                        <option value="TT">Trinidad and Tobago</option>
                        <option value="TN">Tunisia</option>
                        <option value="TR">Turkey</option>
                        <option value="TM">Turkmenistan</option>
                        <option value="TV">Tuvalu</option>
                        <option value="UG">Uganda</option>
                        <option value="UA">Ukraine</option>
                        <option value="AE">United Arab Emirates</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="UY">Uruguay</option>
                        <option value="UZ">Uzbekistan</option>
                        <option value="VU">Vanuatu</option>
                        <option value="VA">Vatican City</option>
                        <option value="VE">Venezuela</option>
                        <option value="VN">Vietnam</option>
                        <option value="YE">Yemen</option>
                        <option value="ZM">Zambia</option>
                        <option value="ZW">Zimbabwe</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Save Changes Button - Fixed position at bottom */}
                <div className="h-[30px]" />
                <div className="flex flex-col items-center gap-3">
                  {error && (
                    <div className="w-full px-4 py-2 text-sm text-red-500 bg-red-500/10 rounded-lg">
                      {error}
                    </div>
                  )}
                  <button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className={`px-8 py-2 text-white font-bold rounded-lg transition-all duration-300 border ${
                      saveSuccess 
                        ? 'bg-green-600 border-green-500' 
                        : isSaving 
                          ? 'bg-[#191919] opacity-50 border-[#2a2a2a] cursor-not-allowed' 
                          : 'bg-[#191919] hover:bg-[#ffffff0f] border-[#2a2a2a]'
                    }`}
                  >
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Statistics */}
        <div className="w-[40%] flex flex-col">
          <div className="bg-[#111111] flex-1 rounded-2xl overflow-auto border border-[#2a2a2a]">
            <div className="bg-[#111111] p-6 shadow-lg flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">📊</span>
                <h3 className="text-xl font-bold text-white">Your Statistics</h3>
              </div>

              {/* Current Rank Card */}
              <div className="bg-[#191919] p-4 rounded-lg border border-[#2a2a2a] mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-400 text-sm">Current Rank</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        <RankBadge rank={rankInfo.current.tier} variant="large" />
                      </span>
                      <div>
                        <h3 className="text-white font-bold">{rankInfo.current.tier} {rankInfo.current.division || ''}</h3>
                        <p className="text-gray-400 text-sm">{points} points</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-gray-400 text-xs mb-1">
                    <span>{rankInfo.current.tier === 'Master' ? 'Master Rank Achieved!' : `Progress to ${rankInfo.next?.tier || 'Master'} ${rankInfo.next?.division || ''}`}</span>
                    <span>{rankInfo.current.tier === 'Master' ? 'Maximum Rank' : `${rankInfo.pointsToNext} points needed`}</span>
                  </div>
                  <div className="h-2 bg-[#00000026] rounded-full border border-[#2a2a2a]">
                    <div 
                      className="h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${rankProgress}%`,
                        backgroundColor: rankInfo.current.color,
                        transition: isRankUpdating ? 'width 0.02s linear' : 'width 0.3s ease-out'
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#191919] p-4 rounded-lg border border-[#2a2a2a]">
                  <div className="text-gray-400 text-sm">Total Points</div>
                  <div className="text-white text-xl font-bold mt-1">{points}</div>
                  <div className="text-green-500 text-xs mt-1">+{weeklyPoints} this week</div>
                </div>
                <div className="bg-[#191919] p-4 rounded-lg border border-[#2a2a2a]">
                  <div className="text-gray-400 text-sm">Days Active</div>
                  <div className="text-white text-xl font-bold mt-1">0</div>
                  <div className="text-green-500 text-xs mt-1">0 day streak</div>
                </div>
                <div className="bg-[#191919] p-4 rounded-lg border border-[#2a2a2a]">
                  <div className="text-gray-400 text-sm">Tasks Completed</div>
                  <div className="text-white text-xl font-bold mt-1">{completedTasks.length}</div>
                  <div className="text-green-500 text-xs mt-1">{completedTasks.length}/5 completed</div>
                </div>
                <div className="bg-[#191919] p-4 rounded-lg border border-[#2a2a2a]">
                  <div className="text-gray-400 text-sm">Global Position</div>
                  <div className="text-white text-xl font-bold mt-1">#{userPosition.toLocaleString()}</div>
                  <div className="text-green-500 text-xs mt-1">
                    {totalUsers > 0 ? `Top ${Math.round((userPosition / totalUsers) * 100)}%` : 'Calculating...'}
                  </div>
                </div>
              </div>

              {/* Points Progress Graph */}
              <div className="flex-1 bg-[#191919] rounded-2xl overflow-hidden flex flex-col border border-[#2a2a2a] min-h-[400px]">
                <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
                  <h3 className="text-white font-medium">Points Progress</h3>
                  <div className="bg-[#111111] rounded-full p-0.5 flex items-center border border-[#2a2a2a]">
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        timeRange === '7d'
                          ? 'bg-[#132d21] text-[#32ab71]'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                      onClick={() => setTimeRange('7d')}
                    >
                      Week
                    </button>
                    <button
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        timeRange === 'month'
                          ? 'bg-[#132d21] text-[#32ab71]'
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                      onClick={() => setTimeRange('month')}
                    >
                      Month
                    </button>
                  </div>
                </div>
                
                {/* Graph */}
                <div className="flex-1 p-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeRange === '7d' ? weekData : monthData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0f" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#666666"
                        tick={{ fill: '#666666' }}
                        interval={timeRange === '7d' ? 0 : 4}
                      />
                      <YAxis 
                        stroke="#666666"
                        tick={{ fill: '#666666' }}
                        domain={['dataMin - 20', 'dataMax + 20']}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#191919',
                          border: '1px solid #ffffff0f',
                          borderRadius: '8px',
                          color: '#ffffff'
                        }}
                        formatter={(value: number) => [`${value} points`, 'Points']}
                        labelFormatter={(label: string) => `Day ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="points"
                        stroke="#1754d8"
                        strokeWidth={2}
                        dot={{ fill: '#1754d8', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#1754d8' }}
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                        animationBegin={0}
                        isAnimationActive={isFirstRender && dataLoaded}
                        animationId={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PLAN_START_DATE = new Date('2025-04-20');

function calculateCurrentDay() {
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - PLAN_START_DATE.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userRankInfo, setUserRankInfo] = useState(getRankInfo(0));
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPage, setCurrentPage] = useState<'home' | 'profile' | 'chat'>('home');
  const [selectedCommunityTab, setSelectedCommunityTab] = useState<'habits' | 'chat' | 'info'>('habits');
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'season' | 'month'>('month');
  const [selectedMenuItem, setSelectedMenuItem] = useState<'habits' | 'chat' | 'info'>('habits');
  const [leaderboardUsers, setLeaderboardUsers] = useState<Array<{username: string, points: number, avatar_url: string | null}>>([]);
  const [rankProgress, setRankProgress] = useState(0);
  const [isRankUpdating, setIsRankUpdating] = useState(false);
  const [lastTaskReset, setLastTaskReset] = useState<Date | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [tasks, setTasks] = useState<any[]>([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState<string>('');
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  // Load weekly challenge based on current date
  useEffect(() => {
    const loadWeeklyChallenge = async () => {
      try {
        setIsLoadingChallenge(true);
        setChallengeError(null);
        
        const today = new Date().toISOString().split('T')[0];
        const { data: taskData, error } = await supabase
          .from('tasks')
          .select('weekly_challenge')
          .eq('date', today)
          .single();

        if (error) {
          console.error('Error loading weekly challenge:', error);
          setChallengeError('Failed to load weekly challenge');
          return;
        }

        if (taskData?.weekly_challenge) {
          setWeeklyChallenge(taskData.weekly_challenge);
        } else {
          setChallengeError('No weekly challenge found for today');
        }
      } catch (error) {
        console.error('Unexpected error loading weekly challenge:', error);
        setChallengeError('An unexpected error occurred');
      } finally {
        setIsLoadingChallenge(false);
      }
    };

    loadWeeklyChallenge();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userMeta } = await supabase
        .from('users_meta')
        .select('points, weekly_challenge_completions, current_day')
        .eq('id', user.id)
        .single();

      if (userMeta) {
        setUserPoints(userMeta.points || 0);
        setUserRankInfo(getRankInfo(userMeta.points || 0));
        setWeeklyCompletions(userMeta.weekly_challenge_completions || 0);
        setCurrentDay(userMeta.current_day || calculateCurrentDay());
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const loadCompletedTasks = async () => {
      if (!session?.user) return;

      const { data: completedTasksData } = await supabase
        .from('completed_tasks')
        .select('task_id')
        .eq('user_id', session.user.id)
        .eq('date', new Date().toISOString().split('T')[0]);

      if (completedTasksData) {
        setCompletedTasks(completedTasksData.map(task => task.task_id));
      }
    };

    loadCompletedTasks();
  }, [session]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!session?.user) return;

      const { data: userMeta } = await supabase
        .from('users_meta')
        .select('current_day')
        .eq('id', session.user.id)
        .single();

      if (userMeta) {
        const day = userMeta.current_day || calculateCurrentDay();
        setCurrentDay(day);

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('date', today)
          .single();

        if (tasksData) {
          setTasks([
            { id: '1', text: tasksData.task1 },
            { id: '2', text: tasksData.task2 },
            { id: '3', text: tasksData.task3 },
            { id: '4', text: tasksData.task4 },
            { id: '5', text: tasksData.task5 }
          ]);
        }
      }
    };

    loadTasks();
  }, [session, currentDay]);

  const handleTaskToggle = async (taskId: string, currentPoints: number, onPointsUpdate: (points: number) => void, onIsAnimatingChange: (isAnimating: boolean) => void) => {
    const isCompleting = !completedTasks.includes(taskId);
    const newCompletedTasks = isCompleting
      ? [...completedTasks, taskId]
      : completedTasks.filter(id => id !== taskId);
    
    setCompletedTasks(newCompletedTasks);
    
    // Calculate points change
    const pointChange = isCompleting ? 5 : -5;
    let pointsToUpdate = Math.max(0, currentPoints + pointChange);
    
    // Handle bonus points
    if (isCompleting && newCompletedTasks.length === 5) {
      pointsToUpdate += 10;
      onIsAnimatingChange(true);
      setTimeout(() => onIsAnimatingChange(false), 2000);
    } else if (!isCompleting && completedTasks.length === 5) {
      // Remove bonus points when deselecting from all tasks completed
      pointsToUpdate -= 10;
    }
    
    // Update points in database
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from('users_meta')
      .upsert({ 
        id: user.id,
        points: pointsToUpdate 
      });
      
    if (!updateError) {
      onPointsUpdate(pointsToUpdate);
    }
  };

  const handleCompleteChallenge = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Check if challenge is already completed
      if (isChallengeCompleted) {
        console.log('Challenge already completed');
        return;
      }

      // Update points immediately
      const newPoints = userPoints + 30;
      setUserPoints(newPoints);
      setUserRankInfo(getRankInfo(newPoints));
      
      // Start animation
      setIsAnimating(true);
      
      // Get current completion count
      const { data: userMeta, error: fetchError } = await supabase
        .from('users_meta')
        .select('weekly_challenge_completions')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching completion count:', fetchError);
        setIsAnimating(false);
        return;
      }

      const currentCompletions = userMeta?.weekly_challenge_completions || 0;
      const newCompletions = currentCompletions + 1;
      
      // Update database with new points and increment completion counter
      const { error: updateError } = await supabase
        .from('users_meta')
        .update({ 
          points: newPoints,
          weekly_challenge_completions: newCompletions,
          last_weekly_challenge_completed: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating completion count:', updateError);
        setIsAnimating(false);
        return;
      }

      // Update local state
      setWeeklyCompletions(newCompletions);

      // Complete the challenge
      setIsChallengeCompleted(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);

    } catch (error) {
      console.error('Error completing challenge:', error);
      setIsAnimating(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      const formattedTime = hours > 0 
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch current user's points and rank
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userMeta } = await supabase
          .from('users_meta')
          .select('points')
          .eq('id', user.id)
          .single();

        if (userMeta) {
          const points = userMeta.points || 0;
          setUserPoints(points);
          setUserRankInfo(getRankInfo(points));
        }
      }
    };

    fetchUserData();
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        if (leaderboardFilter === 'season') {
          // Get all users and their weekly points in a single query
          const { data: allUsers, error: usersError } = await supabase
            .from('users_meta')
            .select(`
              id,
              full_name,
              points,
              avatar_url,
              points_history (
                points,
                created_at
              )
            `)
            .order('points', { ascending: false });

          if (usersError) {
            console.error('Error fetching users:', usersError);
            return;
          }

          if (!allUsers || allUsers.length === 0) {
            console.log('No users found');
            setLeaderboardUsers([]);
            return;
          }

          // Process the data to get weekly points
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const combinedData = allUsers.map(user => {
            const weeklyPoints = user.points_history
              ?.filter(entry => new Date(entry.created_at) >= oneWeekAgo)
              ?.reduce((sum, entry) => sum + (entry.points || 0), 0) || 0;

            return {
              username: user.full_name || 'Anonymous',
              points: weeklyPoints,
              avatar_url: user.avatar_url,
              total_points: user.points || 0
            };
          });

          // Sort by weekly points, then by total points for tiebreakers
          combinedData.sort((a, b) => {
            const aPoints = a.points || 0;
            const bPoints = b.points || 0;
            if (bPoints !== aPoints) {
              return bPoints - aPoints;
            }
            return (b.total_points || 0) - (a.total_points || 0);
          });

          setLeaderboardUsers(combinedData);
        } else {
          // Monthly view remains the same
          const { data: allUsers, error: usersError } = await supabase
            .from('users_meta')
            .select('id, full_name, points, avatar_url')
            .order('points', { ascending: false });

          if (usersError) {
            console.error('Error fetching users:', usersError);
            return;
          }

          if (!allUsers || allUsers.length === 0) {
            console.log('No users found');
            setLeaderboardUsers([]);
            return;
          }

          const sortedUsers = allUsers
            .map(user => ({
              username: user.full_name || 'Anonymous',
              points: user.points || 0,
              avatar_url: user.avatar_url
            }))
            .sort((a, b) => b.points - a.points);

          setLeaderboardUsers(sortedUsers);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboardUsers([]);
      }
    };

    fetchLeaderboard();
  }, [leaderboardFilter]);

  // Add initial fetch when component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: allUsers, error: usersError } = await supabase
          .from('users_meta')
          .select(`
            id,
            full_name,
            points,
            avatar_url,
            points_history (
              points,
              created_at
            )
          `)
          .order('points', { ascending: false });

        if (usersError) {
          console.error('Error fetching initial users:', usersError);
          return;
        }

        // If no users found, add fictional users
        if (!allUsers || allUsers.length === 0) {
          const fictionalUsers = [
            {
              username: 'HabitMaster',
              points: 1250,
              avatar_url: null,
              total_points: 1250
            },
            {
              username: 'ProductivityPro',
              points: 980,
              avatar_url: null,
              total_points: 980
            },
            {
              username: 'MindfulMaster',
              points: 875,
              avatar_url: null,
              total_points: 875
            },
            {
              username: 'GoalGetter',
              points: 720,
              avatar_url: null,
              total_points: 720
            },
            {
              username: 'DailyAchiever',
              points: 650,
              avatar_url: null,
              total_points: 650
            }
          ];
          setLeaderboardUsers(fictionalUsers);
          return;
        }

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const combinedData = allUsers.map(user => {
          const weeklyPoints = user.points_history
            ?.filter(entry => new Date(entry.created_at) >= oneWeekAgo)
            ?.reduce((sum, entry) => sum + (entry.points || 0), 0) || 0;

          return {
            username: user.full_name || 'Anonymous',
            points: weeklyPoints,
            avatar_url: user.avatar_url,
            total_points: user.points || 0
          };
        });

        combinedData.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return b.total_points - a.total_points;
        });

        setLeaderboardUsers(combinedData);
      } catch (error) {
        console.error('Error fetching initial leaderboard:', error);
        setLeaderboardUsers([]);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update rank info when points change
  useEffect(() => {
    const newRankInfo = getRankInfo(userPoints);
    const oldRankInfo = userRankInfo;
    
    // Check if rank changed
    if (oldRankInfo.current.tier !== newRankInfo.current.tier || 
        oldRankInfo.current.division !== newRankInfo.current.division) {
      setIsRankUpdating(true);
      
      // Animate progress bar
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        if (progress >= newRankInfo.progress) {
          progress = newRankInfo.progress;
          clearInterval(interval);
          setUserRankInfo(newRankInfo);
          setIsRankUpdating(false);
        }
        setRankProgress(progress);
      }, 20);
      
      return () => clearInterval(interval);
    } else {
      setRankProgress(newRankInfo.progress);
      setUserRankInfo(newRankInfo);
    }
  }, [userPoints]);

  // Update points and handle rank changes
  const handlePointsUpdate = async (newPoints: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Update points in database
    const { error: updateError } = await supabase
      .from('users_meta')
      .upsert({ 
        id: user.id,
        points: newPoints 
      });
      
    if (!updateError) {
      setUserPoints(newPoints);
    }
  };

  // Add this new useEffect to fetch total users
  useEffect(() => {
    const fetchTotalUsers = async () => {
      try {
        const { count, error } = await supabase
          .from('users_meta')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Error fetching total users:', error);
          return;
        }

        if (count !== null) {
          setTotalUsers(count);
        }
      } catch (error) {
        console.error('Error in fetchTotalUsers:', error);
      }
    };

    fetchTotalUsers();
  }, []);

  const createFictionalUsers = async () => {
    // Create a service role client to bypass RLS
    const serviceRoleClient = supabase.auth.admin;
    
    const fictionalUsers = [
      {
        email: 'habitmaster@example.com',
        password: 'HabitMaster123!',
        full_name: 'HabitMaster',
        points: 1250
      },
      {
        email: 'productivitypro@example.com',
        password: 'ProductivityPro123!',
        full_name: 'ProductivityPro',
        points: 980
      },
      {
        email: 'mindfulmaster@example.com',
        password: 'MindfulMaster123!',
        full_name: 'MindfulMaster',
        points: 875
      },
      {
        email: 'goalgetter@example.com',
        password: 'GoalGetter123!',
        full_name: 'GoalGetter',
        points: 720
      },
      {
        email: 'dailyachiever@example.com',
        password: 'DailyAchiever123!',
        full_name: 'DailyAchiever',
        points: 650
      }
    ];

    for (const user of fictionalUsers) {
      try {
        // Create auth user with service role
        const { data: authData, error: authError } = await serviceRoleClient.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            full_name: user.full_name
          }
        });

        if (authError) {
          console.error('Auth error for', user.email, ':', authError);
          continue;
        }

        if (!authData.user) {
          console.error('No user created for', user.email);
          continue;
        }

        // Create user meta with service role
        const { error: metaError } = await supabase
          .from('users_meta')
          .upsert({
            id: authData.user.id,
            user_id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            points: user.points,
            created_at: new Date().toISOString()
          });

        if (metaError) {
          console.error('Meta error for', user.email, ':', metaError);
        }
      } catch (error) {
        console.error('Error creating user:', user.email, error);
      }
    }

    // Refresh the leaderboard
    const { data: allUsers } = await supabase
      .from('users_meta')
      .select('id, full_name, points, avatar_url')
      .order('points', { ascending: false });

    if (allUsers) {
      setLeaderboardUsers(allUsers.map(user => ({
        username: user.full_name || 'Anonymous',
        points: user.points || 0,
        avatar_url: user.avatar_url
      })));
    }
  };

  // Add this near other useEffect hooks
  useEffect(() => {
    if (session?.user) {
      createFictionalUsers();
    }
  }, [session]);

  // Render Auth component if no session
  if (!session) {
    return <Auth />;
  }

  // Render main app if session exists
  return (
    <div className="flex h-screen bg-black">
      <div className="w-[83px] flex-shrink-0">
        <Sidebar onPageChange={setCurrentPage} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <div className={`flex-1 flex bg-black py-2.5 pb-[55px] ${currentPage === 'chat' ? 'pr-[10px]' : ''}`}>
          {currentPage === 'home' ? (
            <>
              {/* Center Content */}
              <div className="flex-1 flex flex-col">
                {/* Project and Rank Status */}
                <div className="bg-[#111111] rounded-2xl border border-[#2a2a2a]">
                  <div className="bg-[#1a1a1a] p-4 shadow-lg flex rounded-2xl">
                    {/* Left side - Community info (65%) */}
                    <div className="flex-[0.65] flex flex-col justify-between h-[76px]">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">🎯</span>
                        <h2 className="text-4xl font-bold text-white">Project 50</h2>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400">Build better habits in 50 days</p>
                        <p className="text-gray-400 text-sm">👥 {totalUsers} members</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mx-4 w-px bg-[#2a2a2a]"></div>

                    {/* Right side - Rank Progress (35%) */}
                    <div className="flex-[0.35]">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          <RankBadge rank={userRankInfo.current.tier} variant="large" />
                        </span>
                        <div>
                          <h3 className="text-white font-bold">{userRankInfo.current.tier} {userRankInfo.current.division || ''}</h3>
                          <p className="text-gray-400 text-sm">{userPoints} points</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-gray-400 text-xs mb-1">
                          <span>{userRankInfo.current.tier === 'Master' ? 'Master Rank Achieved!' : `Progress to ${userRankInfo.next?.tier || 'Master'} ${userRankInfo.next?.division || ''}`}</span>
                          <span>{userRankInfo.current.tier === 'Master' ? 'Maximum Rank' : `${userRankInfo.pointsToNext} points needed`}</span>
                        </div>
                        <div className="h-1.5 bg-[#00000026] rounded-full border border-[#2a2a2a]">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${rankProgress}%`,
                              backgroundColor: userRankInfo.current.color,
                              transition: isRankUpdating ? 'width 0.02s linear' : 'width 0.3s ease-out'
                            }} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="mt-2.5 bg-[#111111] rounded-2xl border border-[#2a2a2a] flex-1">
                  {/* Community Menu */}
                  <div className="bg-[#1a1a1a] rounded-2xl border border-[#ffffff26] overflow-hidden">
                    <div className="flex space-x-1 p-2">
                      <button
                        onClick={() => setSelectedCommunityTab('habits')}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                          selectedCommunityTab === 'habits'
                            ? 'bg-[#111111] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Habits
                      </button>
                      <button
                        onClick={() => setSelectedCommunityTab('chat')}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                          selectedCommunityTab === 'chat'
                            ? 'bg-[#111111] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Chat
                      </button>
                      <button
                        onClick={() => setSelectedCommunityTab('info')}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                          selectedCommunityTab === 'info'
                            ? 'bg-[#111111] text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Community Info
                      </button>
                    </div>
                  </div>

                  {/* Community Content */}
                  <div className="h-[calc(100%-60px)] pb-[10px]">
                    {selectedCommunityTab === 'habits' && (
                      <div className="flex flex-col h-full">
                        {/* Tasks Section */}
                        <div className="px-6 pt-5">
                          <Dashboard 
                            completedTasks={completedTasks}
                            userPoints={userPoints}
                            onTaskToggle={handleTaskToggle}
                            onPointsUpdate={handlePointsUpdate}
                            onIsAnimatingChange={setIsAnimating}
                          />
                        </div>

                        {/* Weekly Challenge and Plan Progress stacked vertically */}
                        <div className="px-6 pb-5" style={{ marginTop: '15px' }}>
                          {/* Weekly Challenge */}
                          <div className={`h-[135px] rounded-xl border transition-all duration-500 ${
                            isChallengeCompleted 
                              ? 'bg-[#1a1a1a] border-[#2a2a2a]' 
                              : 'bg-[#0f1727] border-[#1753d5]'
                          }`}>
                            <div className="flex flex-col h-full pt-[10px] pb-4 px-4">
                              <div className="flex items-center justify-between mb-auto">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">💫</span>
                                      <h3 className="text-white font-bold text-lg">Weekly Challenge</h3>
                                    </div>
                                    {isLoadingChallenge ? (
                                      <p className="text-gray-400 text-sm">Loading challenge...</p>
                                    ) : challengeError ? (
                                      <p className="text-red-500 text-sm">{challengeError}</p>
                                    ) : (
                                      <p className="text-gray-400 text-sm">{weeklyChallenge}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold transition-colors duration-500 ${
                                    isChallengeCompleted ? 'text-[#32ab71]' : 'text-[#32ab71]'
                                  }`}>+30 points</div>
                                  <p className="text-gray-400 text-sm">Reward</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between w-full">
                                {!isChallengeCompleted ? (
                                  <button 
                                    onClick={() => handleCompleteChallenge()}
                                    className={`bg-[#132d21] text-[#32ab71] py-2 px-4 rounded-xl border border-[#32ab71] hover:bg-[#1a3d2e] transition-all duration-200 flex items-center gap-2 ${
                                      isAnimating ? 'animate-pulse' : ''
                                    }`}
                                  >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-medium text-sm">Complete ({weeklyCompletions} completed)</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 text-[#32ab71]">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="font-medium text-sm">Completed</span>
                                  </div>
                                )}
                                <div className="text-white text-base font-medium">{timeRemaining} left</div>
                              </div>
                            </div>

                            {/* Add a spacer div with exact height */}
                            <div className="h-[10px]"></div>

                            {/* Plan Progress */}
                            <div className="h-[135px] bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a] outline outline-1 outline-[#ffffff1a]">
                              {/* Header with Progress Info */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">📈</span>
                                  <div>
                                    <h3 className="text-white font-bold text-xs">Plan Progress</h3>
                                    <p className="text-gray-400 text-[10px]">Day 1 of 70</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[#1753d5] text-xs font-medium">€20,000/month</div>
                                  <p className="text-gray-400 text-[10px]">Goal</p>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="relative mt-3">
                                <div className="h-3 bg-[#111111] rounded-full relative">
                                  {/* Progress Fill */}
                                  <div 
                                    className="absolute top-0 left-0 h-full bg-[#1753d5] rounded-full transition-all duration-500" 
                                    style={{ width: '1.4%' }}
                                  />
                                  {/* Week Markers */}
                                  <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-between px-[9%]">
                                    {[...Array(9)].map((_, i) => (
                                      <div key={i} className="w-px h-full bg-[#2a2a2a]" />
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Week Labels */}
                                <div className="flex justify-between mt-1">
                                  <span className="text-[10px] text-gray-400">Week 1</span>
                                  <span className="text-[10px] text-gray-400">Week 5</span>
                                  <span className="text-[10px] text-gray-400">Week 10</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedCommunityTab === 'chat' && <CommunityChat />}
                    {selectedCommunityTab === 'info' && <CommunityInfo />}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Leaderboard */}
              <div className="w-[320px] ml-2.5">
                <div className="bg-[#191919] h-full rounded-l-2xl border border-[#2a2a2a] flex flex-col">
                  <div className="p-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Leaderboard</h3>
                    <div className="bg-[#111111] rounded-full p-0.5 flex items-center border border-[#2a2a2a]">
                      <button
                        onClick={() => setLeaderboardFilter('season')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                          leaderboardFilter === 'season' 
                            ? 'bg-[#132d21] text-[#32ab71]' 
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setLeaderboardFilter('month')}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                          leaderboardFilter === 'month' 
                            ? 'bg-[#132d21] text-[#32ab71]' 
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                  </div>

                  <div className="px-4 -mt-1 pb-3">
                    <div className="bg-[#111111] rounded-xl py-2 px-3 flex items-center gap-2 border border-[#2a2a2a]">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search users" 
                        className="bg-transparent w-full text-sm text-gray-300 placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Leaderboard entries */}
                  <div className="flex-1">
                    <div className="divide-y divide-[#2a2a2a]">
                      {leaderboardUsers.map((user, i) => {
                        const userRankInfo = getRankInfo(user.points);
                        return (
                          <div 
                            key={i} 
                            className={`flex items-center px-4 py-3 relative overflow-hidden hover:bg-[#ffffff0f] transition-colors ${
                              i === 0 ? 'bg-gradient-to-r from-[#FFD70030] to-[#ffffff00]' :
                              i === 1 ? 'bg-gradient-to-r from-[#E3E3E330] to-[#ffffff00]' :
                              i === 2 ? 'bg-gradient-to-r from-[#FF9B6330] to-[#ffffff00]' :
                              ''
                            }`}
                          >
                            <div className={`w-5 text-sm font-medium mr-2 ${
                              i === 0 ? 'text-[#FFD700]' :
                              i === 1 ? 'text-[#E3E3E3]' :
                              i === 2 ? 'text-[#FF9B63]' :
                              'text-gray-400'
                            }`}>
                              {i + 1}
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 border border-[#ffffff1a] overflow-hidden">
                              {user.avatar_url ? (
                                <img 
                                  src={user.avatar_url} 
                                  alt={user.username}
                                  className="w-full h-full object-cover object-center"
                                  style={{
                                    imageRendering: 'crisp-edges',
                                    transform: 'scale(1.1)',
                                    filter: 'contrast(1.1)'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-red-500 flex items-center justify-center">
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className="font-medium text-white text-lg flex items-center gap-2">
                                {user.username}
                                <RankBadge rank={userRankInfo.current.tier} variant="large" />
                              </div>
                              <div className="text-sm text-gray-400">{user.points} pts</div>
                            </div>
                            <div className="ml-2">
                              {i === 0 && <span className="text-[#FFD700] text-lg">🏆</span>}
                              {i === 1 && <span className="text-[#E3E3E3] text-lg">🥈</span>}
                              {i === 2 && <span className="text-[#FF9B63] text-lg">🥉</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : currentPage === 'profile' ? (
            <ProfilePage 
              timeRemaining={timeRemaining}
              isChallengeCompleted={isChallengeCompleted}
              isAnimating={isAnimating}
              handleCompleteChallenge={handleCompleteChallenge}
              points={userPoints}
              onPointsUpdate={handlePointsUpdate}
              onTimeRemainingChange={setTimeRemaining}
              onIsAnimatingChange={setIsAnimating}
              onIsChallengeCompletedChange={setIsChallengeCompleted}
              onRankUpdate={setUserRankInfo}
              onTasksUpdate={setCompletedTasks}
            />
          ) : (
            <Chat />
          )}
        </div>
      </div>

      {/* Bottom Container - Positioned absolutely to stretch across sidebar */}
      <div className="fixed bottom-0 left-0 right-0 h-[45px] bg-[#111111] border-t border-[#ffffff0f] flex items-center px-[10px] font-[system-ui,_-apple-system,_BlinkMacSystemFont,'Segoe_UI',_Roboto,_Oxygen,_Ubuntu,_'Helvetica_Neue',_sans-serif]">
        <div className="flex items-center">
          {/* Logout Button */}
          <button 
            onClick={() => {
              supabase.auth.signOut();
              setSession(null);
              localStorage.clear();
              sessionStorage.clear();
              window.location.replace('/');
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2a2a2a] text-white text-[11px] font-bold rounded-lg hover:bg-[#ffffff0f] transition-colors"
          >
            Log out
          </button>

          {/* Divider with spacing */}
          <div className="mx-[10px] w-px h-5 bg-[#ffffff1a]"></div>

          {/* Points and Rank Container */}
          <div className="p-[1px] rounded-lg bg-gradient-to-r from-[#26493a] to-[#ffffff20] to-60%">
            <div className="flex items-center h-[27px] bg-gradient-to-r from-[#163b2b] to-[#1a1a1a] to-60% rounded-lg overflow-hidden">
              {/* Points Section */}
              <div className="flex items-center gap-1 px-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#00bc2c"/>
                  <path fill="#a3ff3b" d="M12 6l1.79 3.63 4.21.61-3 2.93.71 4.13L12 15.13 8.29 17.3 9 13.17 6 10.24l4.21-.61L12 6z"/>
                  <path fill="white" d="M19 13l-1.5-1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-white font-bold text-sm">{userPoints}</span>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-[16px] my-auto bg-[#ffffff20]"></div>

              {/* Rank Section */}
              <div className="flex items-center gap-1 px-2">
                <span className="w-3.5 h-3.5 flex items-center justify-center">
                  <RankBadge rank={userRankInfo.current.tier} variant="large" />
                </span>
                <span className="text-white font-bold text-[11px]">{userRankInfo.current.tier} {userRankInfo.current.division}</span>
              </div>
            </div>
          </div>

          {/* Right Divider */}
          <div className="mx-[10px] w-px h-5 bg-[#ffffff1a]"></div>
        </div>

        {/* Chat Button - Right Aligned */}
        <div className="flex items-center ml-auto">
          {/* Left Divider */}
          <div className="mx-[10px] w-px h-5 bg-[#ffffff1a]"></div>
          
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#222222] text-white text-[11px] font-bold rounded-lg hover:bg-[#ffffff0f] transition-colors">
            <svg className="w-3.5 h-3.5 text-[#848484]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8zM8 13a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <span>Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
