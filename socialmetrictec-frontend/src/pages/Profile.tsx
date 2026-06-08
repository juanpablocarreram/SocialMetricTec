import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Loader2,
  Check,
  User as UserIcon,
  Mail,
  Globe,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  KeyRound,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, changeMyPassword, UserProfile } from '@/src/services/userService';
import PasswordInput from '../components/PasswordInput';

const EMPTY_PROFILE: UserProfile = {
  description: '',
  website: '',
  linkedin: '',
  instagram: '',
  facebook: '',
  twitter: '',
};

const SOCIAL_FIELDS: { key: keyof UserProfile; label: string; icon: React.ElementType; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/...' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/...' },
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(user?.email ?? '');
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE, ...(user?.profile ?? {}) });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const setField = (key: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({ email: email.trim(), profile });
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err?.response?.data?.detail ?? 'No se pudo guardar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail ?? 'No se pudo cambiar la contraseña.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-error font-bold">
        Debes iniciar sesión para editar tu perfil.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest pb-24">
      <div className="bg-white border-b border-outline-variant/10 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-outline hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-primary tracking-tight">Mi Perfil</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 mt-10 space-y-10">
        {/* Datos públicos */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[28px] p-8 shadow-xl border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-base font-extrabold text-primary">{user.username.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-primary tracking-tighter">{user.username}</h2>
              <p className="text-xs text-on-surface-variant">Esta información es visible en la página de tu proyecto.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6 mt-8">
            <div className="space-y-2">
              <label htmlFor="profile-email" className="text-[10px] font-bold text-outline uppercase tracking-widest">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" aria-hidden="true" />
                <input
                  id="profile-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 pl-11 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-description" className="text-[10px] font-bold text-outline uppercase tracking-widest">Descripción</label>
              <textarea
                id="profile-description"
                rows={4}
                value={profile.description ?? ''}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Cuéntale a los visitantes quién eres y tu rol en el proyecto..."
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed transition-all"
              />
              <p className="text-[11px] text-on-surface-variant">Es lo único que necesitas completar; lo demás es opcional.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="profile-website" className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Sitio web <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-white bg-error px-2.5 py-1 rounded-full">Opcional</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" aria-hidden="true" />
                <input
                  id="profile-website"
                  type="text"
                  value={profile.website ?? ''}
                  onChange={(e) => setField('website', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 pl-11 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-outline uppercase tracking-widest">
                  Redes sociales <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider text-white bg-error px-2.5 py-1 rounded-full">Opcional</span>
                </label>
                <p className="text-[11px] text-on-surface-variant mt-1">Las que dejes vacías no se mostrarán en tu perfil.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="relative">
                    <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                    <input
                      type="text"
                      aria-label={label}
                      value={profile[key] ?? ''}
                      onChange={(e) => setField(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 pl-11 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            {profileError && (
              <div role="alert" aria-live="assertive" className="text-sm text-error font-medium">
                {profileError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              aria-busy={savingProfile}
              className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {savingProfile ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
              {profileSaved ? 'Guardado' : 'Guardar Perfil'}
            </button>
          </form>
        </motion.div>

        {/* Cambiar contraseña */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[28px] p-8 shadow-xl border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-primary tracking-tighter">Contraseña</h2>
              <p className="text-xs text-on-surface-variant">Cambia tu contraseña de acceso.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-[10px] font-bold text-outline uppercase tracking-widest">Contraseña actual</label>
              <PasswordInput
                id="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-[10px] font-bold text-outline uppercase tracking-widest">Nueva contraseña</label>
                <PasswordInput
                  id="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-[10px] font-bold text-outline uppercase tracking-widest">Confirmar contraseña</label>
                <PasswordInput
                  id="confirm-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            {passwordError && (
              <div role="alert" aria-live="assertive" className="text-sm text-error font-medium">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              aria-busy={savingPassword}
              className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {savingPassword ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Check aria-hidden="true" className="w-4 h-4" />}
              {passwordSaved ? 'Contraseña actualizada' : 'Cambiar Contraseña'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
