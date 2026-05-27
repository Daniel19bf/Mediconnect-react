import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageSquare } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appointmentsService } from '../../services/appointments.service';
import { Button } from '../../components/ui/Button';
import { cn, generateRoomName } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, opts: Record<string, unknown>) => {
      dispose: () => void;
      executeCommand: (cmd: string) => void;
      addEventListeners: (events: Record<string, () => void>) => void;
    };
  }
}

export default function VideoCallPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof window.JitsiMeetExternalAPI> | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomName, setRoomName] = useState('');

  const { data: appointment } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  useEffect(() => {
    // Get or create room name
    if (appointment) {
      const room = `mediconnect-${appointment.id.slice(0, 8)}`;
      setRoomName(room);
    }
  }, [appointment]);

  const startCall = () => {
    if (!jitsiContainerRef.current || !roomName) return;

    // Load Jitsi script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.onload = () => {
      apiRef.current = new window.JitsiMeetExternalAPI(
        import.meta.env.VITE_JITSI_DOMAIN ?? 'meet.jit.si',
        {
          roomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: ['microphone','camera','hangup','chat','tileview','fullscreen'],
          },
          userInfo: { displayName: 'MediConnect User' },
        }
      );
      apiRef.current!.addEventListeners({
        videoConferenceJoined: () => setJoined(true),
        videoConferenceLeft: () => {
          setJoined(false);
          navigate('/appointments');
        },
      });
    };
    document.head.appendChild(script);
  };

  const endCall = () => {
    apiRef.current?.dispose();
    navigate('/appointments');
  };

  if (!appointment) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <div className="animate-pulse text-gray-400">Cargando sala...</div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Videollamada médica</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {appointment.patient?.first_name} {appointment.patient?.last_name} · Dr. {appointment.doctor?.profile?.full_name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className={cn('flex items-center gap-1.5', joined ? 'text-green-500' : 'text-gray-400')}>
            <span className={cn('w-2 h-2 rounded-full', joined ? 'bg-green-500 animate-pulse' : 'bg-gray-300')} />
            {joined ? 'Conectado' : 'En espera'}
          </span>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 bg-gray-900 rounded-2xl overflow-hidden relative">
        {!joined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary-600/20 flex items-center justify-center">
              <Video className="w-12 h-12 text-primary-400" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-1">Sala de espera</h2>
              <p className="text-gray-400 text-sm">Sala: {roomName}</p>
            </div>
            <Button size="lg" onClick={startCall} icon={<Video className="w-5 h-5" />}>
              Unirse a la llamada
            </Button>
          </div>
        )}
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        <button
          onClick={() => { setMuted(m => !m); apiRef.current?.executeCommand('toggleAudio'); }}
          className={cn('p-4 rounded-full transition-all', muted ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')}
          title={muted ? 'Activar micrófono' : 'Silenciar'}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <button
          onClick={() => { setVideoOff(v => !v); apiRef.current?.executeCommand('toggleVideo'); }}
          className={cn('p-4 rounded-full transition-all', videoOff ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600')}
          title={videoOff ? 'Activar cámara' : 'Apagar cámara'}
        >
          {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>
        <button
          onClick={() => apiRef.current?.executeCommand('toggleShareScreen')}
          className="p-4 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          title="Compartir pantalla"
        >
          <Monitor className="w-5 h-5" />
        </button>
        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
          title="Terminar llamada"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
