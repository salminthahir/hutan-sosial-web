export default function LoadingSpinner() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <div className="spinner" />
            <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--forest-fog);
          border-top: 4px solid var(--forest-mid);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
