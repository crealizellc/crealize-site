export default function ExtLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ?? 'underline decoration-neutral-300 hover:decoration-neutral-700'}>
      {children}
    </a>
  );
}
