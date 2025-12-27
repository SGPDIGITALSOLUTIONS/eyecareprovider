import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
      background: '#f4f7f8',
    }}>
      <h1 style={{ fontSize: '3rem', color: '#5b6770', marginBottom: '1rem' }}>
        404
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#5b6770', marginBottom: '2rem' }}>
        Product not found
      </p>
      <Link
        href="/shop"
        style={{
          padding: '1rem 2rem',
          background: '#4b8a8a',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: '600',
        }}
      >
        Back to Shop
      </Link>
    </div>
  );
}

