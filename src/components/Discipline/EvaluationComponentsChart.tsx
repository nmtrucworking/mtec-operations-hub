import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { getEvaluationMemberResults } from '../../services/evaluations';

interface Props {
  cycleId: string;
  authToken?: string;
  height?: number;
}

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444']; // gold, green, blue, red

export const EvaluationComponentsChart = ({ cycleId, authToken, height = 220 }: Props) => {
  const [loading, setLoading] = useState(false);
  const [dataRows, setDataRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch up to 2000 members to aggregate — adjust pageSize if your cycles are bigger
        const res = await getEvaluationMemberResults(cycleId, { pageSize: 2000 }, authToken);
        if (res?.data?.items) {
          setDataRows(res.data.items);
        } else {
          setDataRows([]);
        }
      } catch (err) {
        console.error('Error loading member results for components chart', err);
        setDataRows([]);
      } finally {
        setLoading(false);
      }
    };
    if (cycleId) load();
  }, [cycleId, authToken]);

  const aggregated = useMemo(() => {
    if (!dataRows || dataRows.length === 0) return null;
    const totals = {
      I: 0,
      II: 0,
      III_A: 0,
      III_B: 0,
    };
    let overall = 0;
    dataRows.forEach((r) => {
      const a = Number(r.componentIScore || 0);
      const b = Number(r.componentIIScore || 0);
      const c = Number(r.componentIIiAScore || 0);
      const d = Number(r.componentIIiBScore || 0);
      totals.I += a;
      totals.II += b;
      totals.III_A += c;
      totals.III_B += d;
      overall += a + b + c + d;
    });
    if (overall === 0) {
      // fallback: use average per-member rather than totals
      const avgTotals = {
        I: totals.I,
        II: totals.II,
        III_A: totals.III_A,
        III_B: totals.III_B,
      };
      return Object.entries(avgTotals).map(([k, v]) => ({ name: k, value: v }));
    }
    return [
      { name: 'Chuyên cần (I)', key: 'I', value: totals.I },
      { name: 'Thái độ (II)', key: 'II', value: totals.II },
      { name: 'Hiệu suất chung (III-A)', key: 'III_A', value: totals.III_A },
      { name: 'Hiệu suất chuyên môn (III-B)', key: 'III_B', value: totals.III_B },
    ].map((d, i) => ({ ...d, color: COLORS[i % COLORS.length], percent: overall ? (d.value / overall) * 100 : 0 }));
  }, [dataRows]);

  if (!cycleId) return null;

  return (
    <div className="bg-card/25 border border-border/15 p-4 rounded-xl shadow-sm/5 h-full">
      <h4 className="text-sm font-semibold text-secondary mb-3">Phân bổ điểm theo Cấu phần</h4>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin mr-2 h-5 w-5 text-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
          <span className="text-secondary text-sm">Đang tải dữ liệu...</span>
        </div>
      ) : !aggregated ? (
        <div className="text-center text-secondary text-sm py-8">Không có dữ liệu để hiển thị</div>
      ) : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aggregated}
                dataKey="value"
                nameKey="name"
                innerRadius="40%"
                outerRadius="75%"
                paddingAngle={3}
                label={(entry) => `${entry.name.split(' ')[0]} ${(entry.percent ?? 0).toFixed(0)}%`}
              >
                {aggregated.map((entry, idx) => (
                  <Cell key={entry.key} fill={entry.color || COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => val.toFixed(2)} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default EvaluationComponentsChart;