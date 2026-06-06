import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  Shield,
  X,
  Check,
  Filter,
  AlertCircle,
  Loader2,
  Pencil,
  KeyRound,
  FolderOpen,
  Plus,
  Minus,
} from 'lucide-react';
import api from '../lib/axios';
import { cn } from '@/src/lib/utils';
import PasswordInput from '../components/PasswordInput';
import { type ProjectSummary, listProjects, deleteProject, formatArea } from '@/src/services/projectService';

interface User {
  username: string;
  email: string;
  is_admin: boolean;
}

interface UserCreateForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type EditTab = 'profile' | 'password' | 'projects';

const EMPTY_FORM: UserCreateForm = { username: '', email: '', password: '', confirmPassword: '' };

type Section = 'leaders' | 'projects';

export default function AdminPanel() {
  const [section, setSection] = useState<Section>('leaders');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<UserCreateForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [editTab, setEditTab] = useState<EditTab>('profile');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [userProjects, setUserProjects] = useState<ProjectSummary[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [assigningProject, setAssigningProject] = useState(false);

  const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
  const [projectListLoaded, setProjectListLoaded] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<ProjectSummary | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);
  const [projectDeleteError, setProjectDeleteError] = useState('');

  useEffect(() => {
    api.get('/user/users-preview')
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (editTab !== 'projects' || !userToEdit || projectsLoaded) return;
    loadUserProjects(userToEdit.username);
  }, [editTab, userToEdit, projectsLoaded]);

  useEffect(() => {
    if (section !== 'projects' || projectListLoaded) return;
    listProjects()
      .then((list) => {
        setProjectList(list);
        setProjectListLoaded(true);
      })
      .catch(console.error);
  }, [section, projectListLoaded]);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredProjects = projectList.filter((p) =>
    p.project_name.toLowerCase().includes(projectSearch.toLowerCase()),
  );

  const unassignedProjects = allProjects.filter(
    (p) => !userProjects.some((up) => up.project_id === p.project_id),
  );

  const openAddModal = () => {
    setNewUser(EMPTY_FORM);
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setUserToEdit(user);
    setEditTab('profile');
    setEditEmail(user.email);
    setEditPassword('');
    setEditConfirmPassword('');
    setEditError('');
    setEditSaving(false);
    setProjectsLoaded(false);
    setUserProjects([]);
    setAllProjects([]);
    setSelectedProjectId('');
  };

  const closeEditModal = () => {
    setUserToEdit(null);
    setEditError('');
  };

  const switchTab = (tab: EditTab) => {
    setEditTab(tab);
    setEditError('');
  };

  const loadUserProjects = async (username: string) => {
    try {
      const [userRes, allRes] = await Promise.all([
        api.get(`/user/${username}/projects`),
        api.get('/project/listpreview'),
      ]);
      const assigned: ProjectSummary[] = userRes.data;
      const all: ProjectSummary[] = allRes.data;
      setUserProjects(assigned);
      setAllProjects(all);
      const firstUnassigned = all.find((p) => !assigned.some((up) => up.project_id === p.project_id));
      setSelectedProjectId(firstUnassigned ? String(firstUnassigned.project_id) : '');
      setProjectsLoaded(true);
    } catch {
      setEditError('No se pudieron cargar los proyectos.');
    }
  };

  const saveProfile = async () => {
    if (!userToEdit) return;
    if (!editEmail.trim()) {
      setEditError('El correo es requerido.');
      return;
    }
    setEditError('');
    setEditSaving(true);
    try {
      const res = await api.patch(`/user/${userToEdit.username}`, { email: editEmail });
      setUsers(users.map((u) => (u.username === userToEdit.username ? { ...u, email: res.data.email } : u)));
      setUserToEdit({ ...userToEdit, email: res.data.email });
    } catch (err: any) {
      setEditError(err?.response?.data?.detail ?? 'Error al guardar el perfil.');
    } finally {
      setEditSaving(false);
    }
  };

  const savePassword = async () => {
    if (!userToEdit) return;
    if (!editPassword) {
      setEditError('Escribe la nueva contraseña.');
      return;
    }
    if (editPassword.length < 6) {
      setEditError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (editPassword !== editConfirmPassword) {
      setEditError('Las contraseñas no coinciden.');
      return;
    }
    setEditError('');
    setEditSaving(true);
    try {
      await api.patch(`/user/${userToEdit.username}/password`, { new_password: editPassword });
      setEditPassword('');
      setEditConfirmPassword('');
    } catch (err: any) {
      setEditError(err?.response?.data?.detail ?? 'Error al cambiar la contraseña.');
    } finally {
      setEditSaving(false);
    }
  };

  const assignProject = async () => {
    if (!userToEdit || !selectedProjectId) return;
    setAssigningProject(true);
    setEditError('');
    try {
      await api.post(`/user/${userToEdit.username}/projects/${selectedProjectId}`);
      const added = allProjects.find((p) => p.project_id === Number(selectedProjectId));
      if (added) {
        const updated = [...userProjects, added];
        setUserProjects(updated);
        const nextUnassigned = allProjects.find(
          (p) => !updated.some((up) => up.project_id === p.project_id),
        );
        setSelectedProjectId(nextUnassigned ? String(nextUnassigned.project_id) : '');
      }
    } catch (err: any) {
      setEditError(err?.response?.data?.detail ?? 'Error al asignar el proyecto.');
    } finally {
      setAssigningProject(false);
    }
  };

  const removeProject = async (projectId: number) => {
    if (!userToEdit) return;
    try {
      await api.delete(`/user/${userToEdit.username}/projects/${projectId}`);
      setUserProjects(userProjects.filter((p) => p.project_id !== projectId));
    } catch (err: any) {
      setEditError(err?.response?.data?.detail ?? 'Error al quitar el proyecto.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password || !newUser.confirmPassword) {
      setFormError('Por favor, completa todos los campos.');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }
    if (newUser.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/user/register', {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
      });
      setUsers([{ username: newUser.username, email: newUser.email, is_admin: false }, ...users]);
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail ?? 'Error al crear el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/user/${userToDelete.username}`);
      setUsers(users.filter((u) => u.username !== userToDelete.username));
      setUserToDelete(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeletingProject(true);
    setProjectDeleteError('');
    try {
      await deleteProject(projectToDelete.project_id);
      setProjectList((list) => list.filter((p) => p.project_id !== projectToDelete.project_id));
      setProjectToDelete(null);
    } catch (err: any) {
      setProjectDeleteError(err?.response?.data?.detail ?? 'No se pudo eliminar el proyecto.');
    } finally {
      setDeletingProject(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-surface-container-lowest">
      <aside className="w-64 bg-white border-r border-outline-variant/10 p-6 space-y-8 hidden md:block">
        <div>
          <h2 className="text-[10px] font-extrabold text-outline uppercase tracking-[0.2em] mb-6">Administración</h2>
          <nav className="space-y-2">
            {([
              { id: 'leaders',  label: 'Líderes',   Icon: Users      },
              { id: 'projects', label: 'Proyectos', Icon: FolderOpen },
            ] as { id: Section; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors',
                  section === id
                    ? 'bg-primary/5 text-primary shadow-sm'
                    : 'text-outline hover:bg-surface-container-low hover:text-on-surface-variant',
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-8 border-t border-outline-variant/5">
          <p className="text-[9px] text-outline font-medium px-4">SISTEMA v1.4.2</p>
        </div>
      </aside>

      <main className="flex-grow p-8 md:p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {section === 'leaders' && (
          <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Users className="w-8 h-8" />
                <h1 className="text-4xl font-extrabold tracking-tighter">Gestión de Líderes</h1>
              </div>
              <p className="text-on-surface-variant font-light text-lg italic max-w-2xl">
                Controla el acceso de los líderes de proyecto en la plataforma SocialMetricTec.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all group"
              >
                <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                Añadir Líder
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/5 flex items-center gap-4 bg-surface-container-lowest">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button className="p-3 border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors">
                <Filter className="w-4 h-4 text-outline" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-lowest">
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest">Líder</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest">Rol</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filteredUsers.map((user) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={user.username}
                      className="hover:bg-surface-container-lowest transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img
                            src="https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
                            alt=""
                            className="w-10 h-10 rounded-full border border-outline-variant/10"
                          />
                          <div>
                            <p className="text-sm font-bold text-primary">{user.username}</p>
                            <p className="text-xs text-outline">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {user.is_admin ? (
                            <Shield className="w-4 h-4 text-primary" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                            {user.is_admin ? 'Administrador' : 'Líder'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!user.is_admin && (
                            <>
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 text-outline-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setUserToDelete(user)}
                                className="p-2 text-outline-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto text-outline/30">
                  <Search className="w-10 h-10" />
                </div>
                <p className="text-on-surface-variant font-light italic">No se encontraron usuarios con ese criterio.</p>
              </div>
            )}
          </div>
          </>
          )}

          {section === 'projects' && (
          <>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <FolderOpen className="w-8 h-8" />
              <h1 className="text-4xl font-extrabold tracking-tighter">Gestión de Proyectos</h1>
            </div>
            <p className="text-on-surface-variant font-light text-lg italic max-w-2xl">
              Administra y elimina los proyectos publicados en la plataforma SocialMetricTec.
            </p>
          </div>

          <div className="bg-white rounded-[32px] border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant/5 flex items-center gap-4 bg-surface-container-lowest">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Buscar proyecto por nombre..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant/20 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-lowest">
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest">Proyecto</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest">Área de Impacto</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-outline uppercase tracking-widest text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filteredProjects.map((project) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={project.project_id}
                      className="hover:bg-surface-container-lowest transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={project.cover_image_url || 'https://picsum.photos/seed/project/80/80'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-outline-variant/10 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary truncate">{project.project_name}</p>
                            {project.description && (
                              <p className="text-xs text-outline truncate max-w-xs">{project.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                          {formatArea(project.impact_area)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setProjectToDelete(project)}
                            className="p-2 text-outline-variant hover:text-error hover:bg-error/5 rounded-lg transition-all"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProjects.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mx-auto text-outline/30">
                  <FolderOpen className="w-10 h-10" />
                </div>
                <p className="text-on-surface-variant font-light italic">
                  {projectListLoaded ? 'No se encontraron proyectos.' : 'Cargando proyectos…'}
                </p>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </main>

      {/* Modal: Añadir Líder */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAddModal(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10 overflow-hidden"
          >
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 text-outline hover:text-primary">
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-extrabold text-primary tracking-tighter">Nuevo Líder</h2>
                <p className="text-on-surface-variant font-light text-sm mt-2">Crea una cuenta para un nuevo líder de proyecto.</p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Nombre de Usuario</label>
                  <input
                    required
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="usuario123"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Correo Electrónico</label>
                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Contraseña</label>
                    <PasswordInput
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">Confirmar</label>
                    <PasswordInput
                      required
                      value={newUser.confirmPassword}
                      onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 bg-red-50 border border-red-200/60 rounded-2xl p-4 text-red-600"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-xs font-medium tracking-wide">{formError}</p>
                  </motion.div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Líder
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Editar Líder */}
      {userToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={closeEditModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-0">
              <button onClick={closeEditModal} className="absolute top-6 right-6 p-2 text-outline hover:text-primary">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-extrabold text-primary tracking-tighter">{userToEdit.username}</h2>
              <p className="text-on-surface-variant font-light text-sm mt-1">{userToEdit.email}</p>

              <div className="flex gap-1 mt-6 border-b border-outline-variant/10">
                {([
                  { id: 'profile',  label: 'Perfil',      Icon: Pencil      },
                  { id: 'password', label: 'Contraseña',  Icon: KeyRound    },
                  { id: 'projects', label: 'Proyectos',   Icon: FolderOpen  },
                ] as { id: EditTab; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => switchTab(id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors',
                      editTab === id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-outline hover:text-on-surface-variant',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 space-y-6">
              {editTab === 'profile' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              )}

              {editTab === 'password' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">
                      Nueva Contraseña
                    </label>
                    <PasswordInput
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">
                      Confirmar Contraseña
                    </label>
                    <PasswordInput
                      value={editConfirmPassword}
                      onChange={(e) => setEditConfirmPassword(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {editTab === 'projects' && (
                <div className="space-y-4">
                  {!projectsLoaded ? (
                    <div className="flex items-center justify-center py-8 text-outline">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userProjects.length === 0 && (
                          <p className="text-xs text-outline italic text-center py-4">Sin proyectos asignados.</p>
                        )}
                        {userProjects.map((project) => (
                          <div
                            key={project.project_id}
                            className="flex items-center justify-between bg-surface-container-lowest rounded-xl px-4 py-3 border border-outline-variant/10"
                          >
                            <span className="text-sm font-medium text-primary truncate">{project.project_name}</span>
                            <button
                              onClick={() => removeProject(project.project_id)}
                              className="p-1.5 text-outline-variant hover:text-error hover:bg-error/5 rounded-lg transition-all shrink-0 ml-2"
                              title="Quitar del proyecto"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {unassignedProjects.length > 0 && (
                        <div className="flex gap-2 pt-2">
                          <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="flex-grow bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                          >
                            {unassignedProjects.map((p) => (
                              <option key={p.project_id} value={p.project_id}>
                                {p.project_name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={assignProject}
                            disabled={assigningProject}
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                          >
                            {assigningProject
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Plus className="w-4 h-4" />
                            }
                            Asignar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {editError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 bg-red-50 border border-red-200/60 rounded-2xl p-4 text-red-600"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium tracking-wide">{editError}</p>
                </motion.div>
              )}

              {editTab !== 'projects' && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={closeEditModal}
                    className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editTab === 'profile' ? saveProfile : savePassword}
                    disabled={editSaving}
                    className="flex-grow py-4 bg-primary text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setUserToDelete(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                <Trash2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-primary tracking-tighter">¿Eliminar Líder?</h3>
                <p className="text-on-surface-variant font-light text-sm leading-relaxed px-4">
                  Estás a punto de eliminar a{' '}
                  <span className="font-bold text-primary">{userToDelete.username}</span>. Esta acción{' '}
                  <span className="font-bold text-error">no es reversible</span>.
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 text-left">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Aviso Importante</p>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Si este líder es el único vinculado a un proyecto, dicho proyecto también{' '}
                  <span className="font-bold text-error">se eliminará</span> automáticamente.
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-grow py-4 bg-error text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Eliminación'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación de Proyecto */}
      {projectToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { setProjectToDelete(null); setProjectDeleteError(''); }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 overflow-hidden"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error">
                <Trash2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-primary tracking-tighter">¿Eliminar Proyecto?</h3>
                <p className="text-on-surface-variant font-light text-sm leading-relaxed px-4">
                  Estás a punto de eliminar el proyecto{' '}
                  <span className="font-bold text-primary">{projectToDelete.project_name}</span>. Esta acción{' '}
                  <span className="font-bold text-error">no es reversible</span>.
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 text-left">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Aviso Importante</p>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                  Se eliminarán también su página, hitos, métricas, fotos y testimonios{' '}
                  <span className="font-bold text-error">de forma permanente</span>.
                </p>
              </div>

              {projectDeleteError && (
                <div className="flex items-center gap-3 w-full bg-red-50 border border-red-200/60 rounded-2xl p-4 text-red-600 text-left">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium tracking-wide">{projectDeleteError}</p>
                </div>
              )}

              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={() => { setProjectToDelete(null); setProjectDeleteError(''); }}
                  className="flex-grow py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteProject}
                  disabled={deletingProject}
                  className="flex-grow py-4 bg-error text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deletingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Eliminación'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
