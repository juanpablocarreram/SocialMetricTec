import { Link, useLocation } from 'react-router-dom';
import LogoSVG from './LogoSVG';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '@/src/lib/axios';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useProject } from '../context/ProjectContext';


export default function Navbar() {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { projects, currentProject, setCurrentProject } = useProject();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const baseLinks = [
    { name: 'Explorar', path: '/' },
    { name: 'Directorio', path: '/directory' },
  ];

  const projectLinks = currentProject
    ? [{ name: 'Editor', path: '/editor' }]
    : [];

  const allLinks = [
    ...baseLinks,
    ...projectLinks,
    { name: 'Admin', path: '/admin' },
  ];

  const visibleLinks = allLinks.filter(({ name }) => {
    if (name === 'Admin') return user?.is_admin;
    if (name === 'Editor') return user && !user.is_admin;
    return true;
  });

  const userImage = user?.is_admin
    ? 'https://www.shutterstock.com/image-vector/simple-outline-user-configuration-setting-600nw-2636195015.jpg'
    : 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

  return (
    <header aria-label="Encabezado principal" className="w-full sticky top-0 z-[100] glass-header border-b border-outline-variant/10 bg-white/80 backdrop-blur-md">
      <nav aria-label="Navegación principal" className="flex justify-between items-center px-6 md:px-12 py-3 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" aria-label="SocialMetricTec - Página de inicio" className="shrink-0">
            <motion.div className="flex items-center gap-3" initial="rest" whileHover="hover">
              <LogoSVG className="h-9 w-auto" />
              <span className="text-xl font-bold text-primary tracking-tighter font-headline hidden lg:block">
                SocialMetricTec
              </span>
            </motion.div>
          </Link>

          {user && !user.is_admin && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
                aria-controls="project-listbox"
                aria-label={currentProject ? `Proyecto actual: ${currentProject.name}` : 'Seleccionar proyecto'}
                className={cn(
                  'flex items-center gap-3 px-3 py-1.5 rounded-full transition-all duration-300 border border-outline-variant/10 hover:bg-surface-container-low group',
                  isDropdownOpen ? 'bg-surface-container-low ring-2 ring-primary/20' : 'bg-transparent',
                )}
              >
                {currentProject ? (
                  <>
                    <div className="relative group/avatar">
                      {currentProject.image ? (
                        <img
                          src={currentProject.image}
                          alt={currentProject.name}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-white shadow-sm flex items-center justify-center text-primary text-xs font-bold">
                          {currentProject.name[0]}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5 shadow-sm border border-white">
                        <ChevronDown aria-hidden="true" className={cn('w-3 h-3 transition-transform duration-300', isDropdownOpen && 'rotate-180')} />
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-none mb-1">Proyecto Actual</p>
                      <p className="text-xs font-bold text-primary truncate max-w-[120px] md:max-w-[180px]">{currentProject.name}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-outline">
                    <Plus aria-hidden="true" className="w-4 h-4" />
                    <span className="text-xs font-bold">Seleccionar proyecto</span>
                    <ChevronDown aria-hidden="true" className={cn('w-3 h-3 transition-transform duration-300', isDropdownOpen && 'rotate-180')} />
                  </div>
                )}
              </button>

              {isDropdownOpen && (
                <motion.div
                  id="project-listbox"
                  role="listbox"
                  aria-label="Mis proyectos"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50 p-2"
                >
                  {projects.length > 0 && (
                    <>
                      <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em]">Mis Proyectos</p>
                      </div>
                      <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                        {projects.map((project) => (
                          <button
                            key={project.id}
                            role="option"
                            aria-selected={currentProject?.id === project.id}
                            onClick={() => { setCurrentProject(project); setIsDropdownOpen(false); }}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl transition-all group',
                              currentProject?.id === project.id
                                ? 'bg-primary/5 text-primary'
                                : 'hover:bg-surface-container-low text-on-surface-variant',
                            )}
                          >
                            {project.image ? (
                              <img src={project.image} alt={project.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                {project.name[0]}
                              </div>
                            )}
                            <div className="text-left flex-grow truncate">
                              <p className="text-xs font-bold truncate">{project.name}</p>
                              <p className="text-[9px] text-outline uppercase tracking-wider font-bold">{project.area}</p>
                            </div>
                            {currentProject?.id === project.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <Check aria-hidden="true" className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-outline-variant/5" />
                    </>
                  )}

                  <Link
                    to="/create-project"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-primary font-bold hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                      <Plus className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs uppercase tracking-widest">Crear Nuevo Proyecto</span>
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8 items-center font-headline text-sm font-semibold tracking-tight">
            {visibleLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={location.pathname === link.path ? 'page' : undefined}
                className={cn(
                  'transition-all duration-300 ease-in-out pb-1 border-b-2 whitespace-nowrap',
                  location.pathname === link.path
                    ? 'text-primary border-primary'
                    : 'text-on-surface-variant border-transparent hover:text-primary hover:border-primary/30',
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-outline-variant/20 hidden md:block" />

          {!user && (
            <Link
              to="/login"
              className="bg-primary text-on-primary px-6 py-2 rounded-md font-headline text-sm font-semibold tracking-tight hover:brightness-110 transition-all active:scale-95 whitespace-nowrap"
            >
              Iniciar Sesión
            </Link>
          )}

          {user && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                aria-label={user ? `Menú de perfil de ${user.username}` : 'Menú de perfil'}
                className={cn(
                  'flex items-center gap-2 p-1 rounded-full transition-all duration-300 hover:bg-surface-container-low group border border-transparent',
                  isProfileOpen ? 'bg-surface-container-low border-outline-variant/10 shadow-sm' : 'bg-transparent',
                )}
              >
                <div className="w-9 h-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-primary/5">
                  <img src={userImage} alt={user?.username ?? 'Usuario'} className="w-full h-full object-cover" />
                </div>
                <ChevronDown aria-hidden="true" className={cn('w-4 h-4 text-outline transition-transform duration-300 mr-1', isProfileOpen && 'rotate-180')} />
              </button>

              {isProfileOpen && (
                <motion.div
                  role="menu"
                  aria-label="Opciones de perfil"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden z-50 p-2"
                >
                  <div className="p-4 bg-surface-container-low rounded-xl mb-2">
                    <p className="text-xs font-extrabold text-primary truncate leading-tight">{user.username}</p>
                    <p className="text-[10px] text-outline truncate font-medium">{user.email}</p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-all"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">Editar Perfil</span>
                    </Link>
                    <div className="h-px bg-outline-variant/5 my-1" />
                    <button
                      role="menuitem"
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                        window.location.replace("/login"); // <-- Borra el historial del navegador hacia atrás
                      }}
                      className="w-full flex cursor-pointer items-center gap-3 p-3 rounded-xl text-error hover:bg-error/5 transition-all text-left"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cerrar Sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
