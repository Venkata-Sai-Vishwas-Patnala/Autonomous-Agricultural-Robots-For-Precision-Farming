import { ArrowDownRight, ArrowUpRight, Droplets, Gauge, ScanLine, ShieldCheck, Sprout, Timer } from 'lucide-react'
import MetricCard from '../../shared/ui/MetricCard'
import PageHeading from '../../shared/ui/PageHeading'

const results = [
  { label: 'Navigation accuracy', value: 94, icon: Gauge, tone: 'green' as const },
  { label: 'Crop detection', value: 92, icon: Sprout, tone: 'blue' as const },
  { label: 'Weed detection', value: 89, icon: ScanLine, tone: 'yellow' as const },
  { label: 'Obstacle success', value: 95, icon: ShieldCheck, tone: 'coral' as const },
]

function ResearchPage() {
  return (
    <div className="page-stack">
      <PageHeading eyebrow="Research archive" title="Presentation reference values" description="Historical estimates from the project deck, kept separate from live sensor readings." action={<span className="illustrative-label"><span /> Approximate results</span>} />
      <div className="notice-banner research-notice"><span className="notice-symbol"><Sprout size={16} /></span><span><strong>Illustrative values from the presentation.</strong> These are not independently validated measurements or live system outputs.</span></div>
      <section className="metric-grid research-metrics">{results.map(({ label, value, icon, tone }) => <MetricCard key={label} label={label} value={`${value}%`} detail="Approximate presentation result" icon={icon} tone={tone} />)}</section>
      <div className="research-grid">
        <section className="panel research-chart-panel"><div className="panel-heading"><div><p className="panel-kicker">RESOURCE EFFICIENCY</p><h2>Water use comparison</h2></div><span className="chart-period">Illustrative</span></div><div className="water-result"><div><strong>28%</strong><span>less water used</span></div><div className="comparison-bars"><div className="comparison-row"><span>Broadcast irrigation</span><div className="comparison-track"><i style={{ width: '92%' }} /></div><strong>100</strong></div><div className="comparison-row"><span>Targeted application</span><div className="comparison-track targeted-track"><i style={{ width: '66%' }} /></div><strong>72</strong></div><div className="comparison-axis"><span>0</span><span>Relative water use index</span><span>100</span></div></div></div><p className="chart-caption"><Droplets size={14} /> Comparison normalized to a notional broadcast-irrigation baseline of 100.</p></section>
        <section className="panel throughput-panel"><div className="panel-heading"><div><p className="panel-kicker">FIELD CAPACITY</p><h2>Operating profile</h2></div></div><div className="throughput-stat"><span className="summary-icon yellow-icon"><Gauge size={17} /></span><div><p>Coverage rate</p><strong>450 <small>m² / hour</small></strong></div><ArrowUpRight size={16} className="up-icon" /></div><div className="throughput-stat"><span className="summary-icon blue-icon"><Timer size={17} /></span><div><p>Battery runtime</p><strong>3.5 <small>hours</small></strong></div><ArrowDownRight size={16} className="down-icon" /></div><div className="throughput-stat"><span className="summary-icon coral-icon"><Droplets size={17} /></span><div><p>Water saved</p><strong>28 <small>% vs baseline</small></strong></div><ArrowUpRight size={16} className="up-icon" /></div></section>
      </div>
      <section className="method-note"><span className="method-mark">i</span><div><strong>Reading these figures</strong><p>The presentation labels the performance figures as approximate. Treat them as prototype targets until field trials define the measurement method, sample size, and confidence intervals.</p></div></section>
    </div>
  )
}

export default ResearchPage