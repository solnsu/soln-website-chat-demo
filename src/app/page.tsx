import { exampleCopy, exampleLocale } from '@/lib/example-copy';

export default function Page() {
  const copy = exampleCopy[exampleLocale()];
  return <main style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px', minHeight: '150vh' }}>
    <h1 style={{ fontSize: 36, marginBottom: 20 }}>{copy.title}</h1>
    <p style={{ color: '#b3b3b3', lineHeight: 1.8 }}>{copy.description}</p>
  </main>;
}
