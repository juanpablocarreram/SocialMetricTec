export default function Footer() {
  return (
    <footer aria-label="Pie de página" className="w-full py-12 px-6 md:px-12 bg-surface-container border-t border-outline-variant/10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="font-headline font-bold text-primary text-lg">SocialMetricTec</span>
          <span className="font-body text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant">
            © 2026 Instituto Tecnológico de Estudios Superiores de Monterrey
          </span>
        </div>
        
        
      </div>
    </footer>
  );
}
