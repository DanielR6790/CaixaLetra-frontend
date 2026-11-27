import Modal from '../common/Modal.jsx';
import Icon from '../common/Icon.jsx';
import { categories } from '../../config/categories.js';

// Pergunta a categoria antes de abrir o cadastro de uma obra (quando "Todos" está ativo).
export default function CategoryPickerModal({ onPick, onClose }) {
  return (
    <Modal title="Registrar obra" onClose={onClose}>
      <p className="muted">Em qual categoria você quer registrar?</p>
      <div className="picker-grid">
        {categories.map((category) => (
          <button
            key={category.slug}
            type="button"
            className="picker-btn"
            onClick={() => onPick(category)}
          >
            <span className="tile-icon">
              <Icon name={category.icon} size={20} />
            </span>
            {category.name}
          </button>
        ))}
      </div>
    </Modal>
  );
}