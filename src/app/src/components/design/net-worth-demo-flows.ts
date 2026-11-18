import type { FlowRow } from '#/lib/net-worth/net-worth-series'

// Invented figures over the months of net-worth-demo's series: 500 a month into the RRSP,
// and 5000 then 500 a month into the TFSA (ADR-062).
export const FLOWS: Array<FlowRow> = Array.from({ length: 36 }, (_, i) => {
  const onDate = new Date(Date.UTC(2023, i, 15)).toISOString().slice(0, 10)
  const tfsa = i === 12 ? '5000' : '500'
  return [
    { onDate, holdingId: 'demo-rrsp', displayAmount: '500' },
    ...(i >= 12
      ? [{ onDate, holdingId: 'demo-tfsa', displayAmount: tfsa }]
      : []),
  ]
}).flat()
