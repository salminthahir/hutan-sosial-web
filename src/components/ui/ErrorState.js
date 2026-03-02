import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--alert-red)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Terjadi Kesalahan</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', background: 'var(--forest-mid)', color: 'white',
                        borderRadius: '8px', fontWeight: 'bold'
                    }}
                >
                    <RefreshCw size={16} /> Coba Lagi
                </button>
            )}
        </div>
    );
}
