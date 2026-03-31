import { PlaceholderCard } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="page-shell">
      <PlaceholderCard
        title="Sistema Odontológico — OK"
        description="Este entorno confirma que el bootstrap técnico del monorepo está listo para que los próximos cambios agreguen autenticación, tenancy y módulos de dominio."
        footer={<small className="page-footnote">Scope: foundation only.</small>}
      />
    </main>
  );
}
