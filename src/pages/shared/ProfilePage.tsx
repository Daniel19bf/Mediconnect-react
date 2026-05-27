import { useAuthStore } from '../../store/auth.store';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { authService } from '../../services/auth.service';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, user, setProfile } = useAuthStore();
  const [changingPwd, setChangingPwd] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' } });

  const onSave = async (data: { full_name: string; phone: string }) => {
    if (!user) return;
    try {
      const updated = await authService.updateProfile(user.id, data);
      setProfile(updated);
      toast.success('Perfil actualizado');
    } catch { toast.error('Error al actualizar perfil'); }
  };

  const ROLE_LABEL: Record<string, string> = { admin: 'Administrador', doctor: 'Médico', patient: 'Paciente' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>

      <Card>
        <CardBody className="flex items-center gap-6">
          <Avatar name={profile?.full_name} size="xl" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{profile?.full_name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <Badge variant="info" className="mt-2">{ROLE_LABEL[profile?.role ?? ''] ?? profile?.role}</Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white">Información personal</h3></CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <Input label="Nombre completo" {...register('full_name')} />
            <Input label="Teléfono" {...register('phone')} />
            <Input label="Correo electrónico" value={user?.email ?? ''} disabled hint="El correo no se puede cambiar desde aquí" />
            <Button type="submit" loading={isSubmitting} icon={<Save className="w-4 h-4" />}>Guardar cambios</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white">Seguridad</h3></CardHeader>
        <CardBody>
          {changingPwd ? (
            <div className="space-y-3">
              <Input label="Nueva contraseña" type="password" />
              <Input label="Confirmar contraseña" type="password" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setChangingPwd(false)}>Cancelar</Button>
                <Button icon={<Save className="w-4 h-4" />}>Actualizar contraseña</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" icon={<Lock className="w-4 h-4" />} onClick={() => setChangingPwd(true)}>
              Cambiar contraseña
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
