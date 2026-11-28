import { useState } from 'react';
import Alert from '../common/Alert.jsx';
import Icon from '../common/Icon.jsx';
import DeleteAccountModal from './DeleteAccountModal.jsx';
import { exportAccount } from '../../services/accountService.js';
import { downloadFile } from '../../utils/download.js';
import { buildCatalogCsv, exportFilename } from '../../utils/exportData.js';

// Seção "Meus dados": exportar (JSON e CSV) e excluir a conta.
export default function DataSection() {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function runExport(kind) {
    setBusy(kind);
    setMessage(null);
    try {
      const data = await exportAccount();
      if (kind === 'json') {
        downloadFile(exportFilename('json'), JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
      } else {
        downloadFile(
          exportFilename('csv', 'catalogo'),
          buildCatalogCsv(data.catalog),
          'text/csv;charset=utf-8'
        );
      }
      setMessage({
        type: 'success',
        text: `Arquivo gerado com ${data.catalog.length} obras e ${data.projects.length} projetos.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <section className="settings-card">
        <h2>Exportar meus dados</h2>
        <p className="muted">
          Baixe uma cópia do que está na sua conta. O <strong>JSON</strong> tem tudo (perfil, catálogo,
          avaliações e quadros, com endereços das imagens). O <strong>CSV</strong> traz só o catálogo, para
          abrir em planilhas.
        </p>

        {message && <Alert type={message.type}>{message.text}</Alert>}

        <div className="settings-actions settings-actions-start">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => runExport('json')}
            disabled={Boolean(busy)}
          >
            <Icon name="download" size={16} />
            {busy === 'json' ? 'Gerando…' : 'Baixar tudo (JSON)'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => runExport('csv')}
            disabled={Boolean(busy)}
          >
            <Icon name="download" size={16} />
            {busy === 'csv' ? 'Gerando…' : 'Baixar catálogo (CSV)'}
          </button>
        </div>
      </section>

      <section className="settings-card settings-danger">
        <h2>Excluir minha conta</h2>
        <p className="muted">
          Apaga de forma definitiva o seu perfil, o catálogo, os projetos e as imagens. Essa ação não pode
          ser desfeita.
        </p>
        <div className="settings-actions settings-actions-start">
          <button type="button" className="btn btn-danger" onClick={() => setDeleting(true)}>
            <Icon name="trash" size={16} />
            Excluir minha conta…
          </button>
        </div>
      </section>

      {deleting && <DeleteAccountModal onClose={() => setDeleting(false)} />}
    </>
  );
}