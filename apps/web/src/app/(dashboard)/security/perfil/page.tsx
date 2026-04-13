'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  interactiveTransition,
  Label,
} from '@sistema-odontologico/ui';
import {
  Camera,
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  User,
  Shield,
} from 'lucide-react';
import { changePassword, deleteMyPhoto, uploadMyPhoto, updateMyProfile } from '@/lib/auth/api';
import { useAuth } from '@/hooks/use-auth';
import { PhotoCropModal } from '@/components/photo-crop-modal';

export default function PerfilPage() {
  const { user, refresh } = useAuth();

  // Profile data state
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [dni, setDni] = useState(user?.dni ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber ?? '');
  const [specialty, setSpecialty] = useState(user?.specialty ?? '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Photo state
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDeleting, setPhotoDeleting] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync profile fields when user data changes (e.g. after refresh)
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? '');
      setLastName(user.lastName ?? '');
      setDni(user.dni ?? '');
      setPhone(user.phone ?? '');
      setLicenseNumber(user.licenseNumber ?? '');
      setSpecialty(user.specialty ?? '');
    }
  }, [user]);

  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : (user?.email ?? '');

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  // ─── Photo handlers ─────────────────────────────────────
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
    e.target.value = '';
  }, []);

  const handlePhotoUpload = useCallback(
    async (croppedBlob: Blob) => {
      setPhotoUploading(true);
      setPhotoError(null);
      try {
        await uploadMyPhoto(croppedBlob);
        setCropOpen(false);
        setCropFile(null);
        await refresh();
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
      } finally {
        setPhotoUploading(false);
      }
    },
    [refresh],
  );

  const handlePhotoDelete = useCallback(async () => {
    if (!user?.photoUrl) return;
    setPhotoDeleting(true);
    setPhotoError(null);
    try {
      await deleteMyPhoto();
      await refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'No se pudo eliminar la foto.');
    } finally {
      setPhotoDeleting(false);
    }
  }, [user?.photoUrl, refresh]);

  // ─── Profile submit ─────────────────────────────────────
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (!firstName.trim() && !lastName.trim()) {
      setProfileError('Debe completar al menos nombre o apellido.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        phone: phone.trim(),
        licenseNumber: licenseNumber.trim(),
        specialty: specialty.trim(),
      });
      await refresh();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err?.message ?? 'Error al actualizar el perfil.');
    } finally {
      setProfileLoading(false);
    }
  }

  // ─── Password handlers ──────────────────────────────────
  function validatePassword(): boolean {
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = 'Ingrese su contraseña actual.';
    if (!newPassword) errors.newPassword = 'Ingrese la nueva contraseña.';
    else if (newPassword.length < 8) errors.newPassword = 'Mínimo 8 caracteres.';
    if (!confirmPassword) errors.confirmPassword = 'Confirme la nueva contraseña.';
    else if (newPassword !== confirmPassword)
      errors.confirmPassword = 'Las contraseñas no coinciden.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message ?? 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordReset() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setError(null);
    setSuccess(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mi Perfil</h1>

      {/* ── Profile data + avatar card ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>
            Actualice su información personal y profesional. Estos datos son visibles para el resto
            del equipo.
          </CardDescription>
        </CardHeader>

        {profileSuccess && (
          <div className="mx-6 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 size={16} />
            Datos actualizados correctamente.
          </div>
        )}

        {profileError && (
          <div className="mx-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            {profileError}
          </div>
        )}

        {photoError && (
          <div className="mx-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            {photoError}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <CardContent>
            <div className="flex flex-col gap-8 sm:flex-row">
              {/* Left column — Avatar */}
              <div className="flex flex-col items-center gap-3 sm:shrink-0">
                <div className="group relative">
                  <Avatar
                    src={user?.photoUrl}
                    alt={displayName}
                    fallback={initials || '??'}
                    size="xl"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                    className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer disabled:cursor-not-allowed ${interactiveTransition}`}
                    aria-label="Cambiar foto"
                  >
                    {photoUploading ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </button>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Máx 5 MB.</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                    >
                      <Camera size={14} />
                      Cambiar foto
                    </Button>
                    {user?.photoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePhotoDelete}
                        disabled={photoDeleting}
                      >
                        {photoDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>

              {/* Right column — Form fields */}
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ingrese su nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ingrese su apellido"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ej: 12345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 351 555-1234"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Matrícula</Label>
                  <Input
                    id="licenseNumber"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Ej: MN 12345"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Input
                    id="specialty"
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej: Ortodoncia, Endodoncia, Cirugía maxilofacial"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <User size={16} />
                  Guardar datos
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ── Password card ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={18} />
            Seguridad
          </CardTitle>
          <CardDescription>
            Actualice su contraseña de acceso. Por seguridad, ingrese su contraseña actual y defina
            una nueva.
          </CardDescription>
        </CardHeader>

        {success && (
          <div className="mx-6 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 size={16} />
            Contraseña actualizada correctamente.
          </div>
        )}

        {error && (
          <div className="mx-6 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit}>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current">Contraseña actual</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={!!fieldErrors.currentPassword}
                />
                {fieldErrors.currentPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new">Nueva contraseña</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={!!fieldErrors.newPassword}
                />
                {fieldErrors.newPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!fieldErrors.confirmPassword}
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordReset}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Guardar contraseña
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Photo crop modal */}
      {cropFile && (
        <PhotoCropModal
          imageFile={cropFile}
          onConfirm={handlePhotoUpload}
          onCancel={() => {
            setCropOpen(false);
            setCropFile(null);
          }}
          open={cropOpen}
        />
      )}
    </div>
  );
}
