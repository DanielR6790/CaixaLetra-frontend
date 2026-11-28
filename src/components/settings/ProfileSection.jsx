import { useMemo, useRef, useState } from 'react';
import Alert from '../common/Alert.jsx';
import Avatar from '../common/Avatar.jsx';
import Loading from '../common/Loading.jsx';
import TextField from '../common/TextField.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useProfile } from '../../hooks/useProfile.js';
import { updateMe } from '../../services/userService.js';
import {
  ACCEPTED_IMAGE_TYPES,
  AVATAR_INPUT_MAX_BYTES,
  removeUploadedAvatar,
  uploadAvatar,
  validateImageFile,
} from '../../services/storageService.js';
import { formatDate, formatDateTime } from '../../utils/dates.js';
import { resizeToSquareJpeg } from '../../utils/image.js';
import { browserTimeZone, listTimeZones, timeZoneLabel } from '../../utils/timezones.js';
import { validateUsername } from '../../utils/validation.js';

// Seção "Perfil": foto, nome de usuário e fuso horário.
export default function ProfileSection() {
  const { profile, loading, error, reload } = useProfile();

  if (!profile) {
    if (loading) return <Loading label="Carregando perfil…" />;
    return (
      <Alert type="error">
        {error || 'Não foi possível carregar o perfil.'}{' '}
        <button type="button" className="link-button" onClick={reload}>
          Tentar novamente
        </button>
      </Alert>
    );
  }
  return <ProfileForm profile={profile} />;
}

function ProfileForm({ profile }) {
  const { user } = useAuth();
  const { applyProfile } = useProfile();
  const fileInputRef = useRef(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState(null);

  const [username, setUsername] = useState(profile.username);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const zones = useMemo(
    () => listTimeZones([profile.timezone, browserTimeZone()]),
    [profile.timezone]
  );
  const labels = useMemo(
    () => Object.fromEntries([...zones.brazil, ...zones.others].map((zone) => [zone, timeZoneLabel(zone)])),
    [zones]
  );
  const changed = username.trim() !== profile.username || timezone !== profile.timezone;

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const problem = validateImageFile(file, AVATAR_INPUT_MAX_BYTES);
    if (problem) {
      setAvatarMessage({ type: 'error', text: problem });
      return;
    }

    setAvatarBusy(true);
    setAvatarMessage(null);
    let uploaded = null;
    try {
      const blob = await resizeToSquareJpeg(file);
      uploaded = await uploadAvatar(blob, user.id);
      applyProfile(await updateMe({ avatarUrl: uploaded.url }));
      setAvatarMessage({ type: 'success', text: 'Foto atualizada.' });
    } catch (err) {
      // Não deixa uma imagem "solta" no Storage se a troca falhou
      if (uploaded) removeUploadedAvatar(uploaded.path);
      setAvatarMessage({ type: 'error', text: err.message });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    setAvatarMessage(null);
    try {
      applyProfile(await updateMe({ avatarUrl: null }));
      setAvatarMessage({ type: 'success', text: 'Foto removida.' });
    } catch (err) {
      setAvatarMessage({ type: 'error', text: err.message });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    const problem = validateUsername(username);
    setUsernameError(problem);
    if (problem) return;

    const changes = {};
    if (username.trim() !== profile.username) changes.username = username.trim();
    if (timezone !== profile.timezone) changes.timezone = timezone;
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    try {
      const updated = await updateMe(changes);
      applyProfile(updated);
      setUsername(updated.username);
      setTimezone(updated.timezone);
      setMessage({ type: 'success', text: 'Perfil atualizado.' });
    } catch (err) {
      if (err.code === 'USERNAME_TAKEN') setUsernameError(err.message);
      else setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="settings-card">
        <h2>Foto de perfil</h2>
        <p className="muted">
          A imagem é recortada em um quadrado e reduzida automaticamente. JPG, PNG, WEBP ou GIF, até 5 MB.
        </p>

        <div className="avatar-editor">
          <Avatar url={profile.avatar_url} name={profile.username} size={88} />
          <div className="avatar-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarBusy}
            >
              {avatarBusy ? 'Enviando…' : profile.avatar_url ? 'Trocar foto' : 'Escolher foto'}
            </button>
            {profile.avatar_url && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleRemoveAvatar}
                disabled={avatarBusy}
              >
                Remover foto
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            hidden
            onChange={handleAvatarFile}
          />
        </div>

        {avatarMessage && <Alert type={avatarMessage.type}>{avatarMessage.text}</Alert>}
      </section>

      <section className="settings-card">
        <h2>Informações</h2>

        <form onSubmit={handleSubmit} noValidate>
          {message && <Alert type={message.type}>{message.text}</Alert>}

          <TextField id="settings-email" label="E-mail" value={user?.email ?? ''} onChange={() => {}} disabled />

          <TextField
            id="settings-username"
            label="Nome de usuário"
            value={username}
            onChange={setUsername}
            error={usernameError}
            hint="3 a 30 caracteres: letras, números e _"
            autoComplete="username"
            maxLength={30}
            disabled={saving}
          />

          <div className="field">
            <label htmlFor="settings-timezone">Fuso horário</label>
            <select
              id="settings-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              disabled={saving}
            >
              <optgroup label="Brasil">
                {zones.brazil.map((zone) => (
                  <option key={zone} value={zone}>
                    {labels[zone]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Outros fusos">
                {zones.others.map((zone) => (
                  <option key={zone} value={zone}>
                    {labels[zone]}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="field-hint">
              Agora, neste fuso: {formatDateTime(new Date().toISOString(), timezone)}. Ele define como as
              datas aparecem e em qual mês cada obra é contada.
            </p>
            {browserTimeZone() !== timezone && (
              <button
                type="button"
                className="settings-text-btn"
                onClick={() => setTimezone(browserTimeZone())}
                disabled={saving}
              >
                Usar o fuso do meu navegador ({browserTimeZone()})
              </button>
            )}
          </div>

          <p className="muted settings-since">Membro desde {formatDate(profile.created_at, timezone)}</p>

          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || !changed}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}