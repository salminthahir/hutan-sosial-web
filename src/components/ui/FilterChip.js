import styles from './FilterChip.module.css';
import { Check } from 'lucide-react';

export default function FilterChip({ label, isSelected, onClick }) {
    return (
        <button
            className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
            type="button"
        >
            {isSelected && <Check size={14} className={styles.icon} />}
            <span className={styles.label}>{label}</span>
        </button>
    );
}
