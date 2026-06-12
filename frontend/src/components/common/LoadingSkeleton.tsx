const LoadingSkeleton = () => (
  <div style={{ padding: 'var(--space-8)', maxWidth: 'var(--content-max)', margin: '0 auto' }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{
        height: '80px',
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-4)',
        background: 'linear-gradient(90deg, var(--color-bg-card) 25%, var(--color-bg-elevated) 50%, var(--color-bg-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }} />
    ))}
  </div>
);

export default LoadingSkeleton;
