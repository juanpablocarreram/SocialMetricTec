import api from '@/src/lib/axios';

export interface UserProfile {
  description?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface UserOut {
  username: string;
  email: string;
  is_admin: boolean;
  profile: UserProfile | null;
}

export interface SelfProfileUpdate {
  email?: string;
  profile?: UserProfile;
}

export const updateMyProfile = async (data: SelfProfileUpdate): Promise<UserOut> => {
  const res = await api.patch('/user/me', data);
  return res.data;
};

export const changeMyPassword = async (currentPassword: string, newPassword: string): Promise<UserOut> => {
  const res = await api.patch('/user/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return res.data;
};
