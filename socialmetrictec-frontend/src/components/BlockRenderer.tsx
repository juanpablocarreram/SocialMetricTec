import { Fragment, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Video } from 'lucide-react';
import type { MetricOut } from '@/src/services/metricService';
import { withOpacity } from '@/src/lib/utils';

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      if (u.pathname === '/watch') {
        const id = u.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname.startsWith('/embed/')) return url;
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/')[2];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch { /* invalid URL */ }
  return null;
}

export interface BlockProps {
  title?: string;
  url?: string;
  headline?: string;
  subtitle?: string;
  cta?: string;
  body?: string;
  quote?: string;
  caption?: string;
  label?: string;
  bg_color?: string;
  bg_image_url?: string;
  [key: string]: unknown;
}

export interface BackendBlock {
  type: string;
  props: BlockProps;
}

interface BlockRendererProps {
  block: BackendBlock;
  primaryColor: string;
  secondaryColor?: string;
  metrics?: MetricOut[];
  fontFamily?: string;
  heroFallbackUrl?: string;
}

export function BlockRenderer({
  block,
  primaryColor,
  secondaryColor = '#525d85',
  metrics = [],
  fontFamily = 'Manrope',
  heroFallbackUrl,
}: BlockRendererProps) {
  const { type, props } = block;

  if (type === 'hero') {
    const heroUrl = (props.url as string) || heroFallbackUrl;
    return (
      <section
        className="relative h-[85vh] w-full overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        {heroUrl && (
          <img
            alt="hero"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            src={heroUrl}
            referrerPolicy="no-referrer"
          />
        )}
        <div className="relative h-full flex flex-col justify-center items-center text-center p-16 bg-gradient-to-b from-transparent via-black/20 to-black/70">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-extrabold text-white leading-tight max-w-5xl mb-8 tracking-tighter"
            style={{ fontFamily }}
          >
            {props.headline ?? ''}
          </motion.h1>
          {props.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-white/90 max-w-3xl font-light leading-relaxed mb-12"
              style={{ fontFamily }}
            >
              {props.subtitle}
            </motion.p>
          )}
          {props.cta && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 rounded-full text-white font-bold uppercase tracking-widest shadow-2xl"
              style={{ backgroundColor: primaryColor }}
            >
              {props.cta}
            </motion.button>
          )}
        </div>
      </section>
    );
  }

  if (type === 'narrative' || type === 'text') {
    return (
      <section className="py-32 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-8 flex flex-col items-center text-center gap-12">
          <div className="w-20 h-1 rounded-full" style={{ backgroundColor: withOpacity(secondaryColor, 0.4) }} />
          {props.title && (
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold tracking-tight"
              style={{ fontFamily, color: primaryColor }}
            >
              {props.title}
            </motion.h3>
          )}
          {props.body && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-on-surface-variant leading-relaxed text-2xl font-light"
              style={{ fontFamily }}
            >
              {props.body}
            </motion.p>
          )}
          {props.quote && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="p-12 bg-surface-container-low rounded-[40px] border border-outline-variant/10 relative w-full"
            >
              <div
                className="absolute -top-6 left-12 text-[120px] font-serif select-none"
                style={{ color: withOpacity(primaryColor, 0.1) }}
              >"</div>
              <p className="text-xl italic text-on-surface-variant leading-relaxed relative z-10" style={{ fontFamily }}>
                {props.quote}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    );
  }

  if (type === 'metrics') {
    return (
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-8">
          {metrics.length === 0 ? (
            <p className="text-center text-on-surface-variant italic">
              Aún no hay métricas registradas para este proyecto.
            </p>
          ) : (
            <div className="flex flex-wrap justify-center gap-12">
              {metrics.map((metric, idx) => (
                <motion.div
                  key={metric.metric_id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/10 flex-1 basis-72 min-w-[280px] max-w-md"
                >
                  <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-6">
                    {metric.metric_title}
                  </h3>
                  <div className="space-y-4">
                    {metric.sub_metrics.map((sm) => (
                      <div
                        key={sm.sub_metric_id}
                        className="flex justify-between items-baseline border-b border-outline-variant/10 pb-3"
                      >
                        <span className="text-sm text-outline">{sm.sub_metric_title}</span>
                        <span
                          className="text-3xl font-extrabold tracking-tighter"
                          style={{ color: primaryColor }}
                        >
                          {sm.sub_metric_value ?? '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (type === 'image') {
    if (!props.url) return null;
    return (
      <section className="py-12 flex justify-center bg-white">
        <div className="max-w-4xl w-full px-8 space-y-4">
          <img
            src={props.url}
            alt={props.caption ?? ''}
            className="w-full rounded-2xl object-cover max-h-[500px]"
          />
          {props.caption && (
            <p className="text-center text-sm text-on-surface-variant italic" style={{ fontFamily }}>{props.caption}</p>
          )}
        </div>
      </section>
    );
  }

  if (type === 'video') {
    if (!props.url) {
      return (
        <section className="py-24 flex items-center justify-center min-h-[200px] bg-surface-container-low/20">
          <Video className="w-16 h-16 text-primary opacity-20" />
        </section>
      );
    }
    const embedUrl = getYouTubeEmbedUrl(props.url);
    return (
      <section className="py-12 flex justify-center bg-white">
        <div className="max-w-4xl w-full px-8 space-y-4">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video rounded-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={props.url} controls className="w-full rounded-2xl max-h-[500px] bg-black" />
          )}
          {props.title && (
            <p className="text-center text-sm font-bold" style={{ color: primaryColor, fontFamily }}>{props.title}</p>
          )}
        </div>
      </section>
    );
  }

  if (type === 'banner') {
    return (
      <section
        className="py-20 flex items-center justify-center min-h-[300px] relative overflow-hidden"
        style={{ backgroundColor: (props.bg_color as string) ?? primaryColor }}
      >
        {props.bg_image_url && (
          <img
            src={props.bg_image_url}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            alt=""
          />
        )}
        <div className="relative text-center text-white px-8 space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tighter">{props.headline}</h2>
          {props.subtitle && <p className="text-xl font-light opacity-90">{props.subtitle}</p>}
        </div>
      </section>
    );
  }

  if (type === 'button') {
    return (
      <section className="py-12 flex justify-center bg-white">
        <button
          className="px-10 py-4 rounded-full font-bold uppercase tracking-widest text-white shadow-2xl"
          style={{ backgroundColor: primaryColor }}
        >
          {(props.label as string) ?? 'Ver más'}
        </button>
      </section>
    );
  }

  if (type === 'divider') {
    return (
      <section className="py-8 flex justify-center bg-white">
        <div className="w-full max-w-4xl px-8">
          <div className="h-px bg-outline-variant/20" />
        </div>
      </section>
    );
  }

  return null;
}

interface PagePreviewProps {
  blocks: BackendBlock[];
  primaryColor?: string;
  secondaryColor?: string;
  metrics?: MetricOut[];
  fontFamily?: string;
  heroFallbackUrl?: string;
  /** Contenido que se inserta justo después del bloque de métricas (o al final si no hay bloque de métricas). */
  afterMetrics?: ReactNode;
}

export function PagePreview({
  blocks,
  primaryColor = '#002068',
  secondaryColor = '#525d85',
  metrics = [],
  fontFamily = 'Manrope',
  heroFallbackUrl,
  afterMetrics,
}: PagePreviewProps) {
  const metricsIndex = blocks.findIndex((block) => block.type === 'metrics');

  return (
    <>
      {blocks.map((block, i) => (
        <Fragment key={i}>
          <BlockRenderer
            block={block}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            metrics={metrics}
            fontFamily={fontFamily}
            heroFallbackUrl={heroFallbackUrl}
          />
          {afterMetrics && i === metricsIndex && afterMetrics}
        </Fragment>
      ))}
      {afterMetrics && metricsIndex === -1 && afterMetrics}
    </>
  );
}
