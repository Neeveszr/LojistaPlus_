import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyStatsChartProps {
  storeId: string;
}

interface ChartData {
  data: string;
  vendas: number;
  despesas: number;
}

const WeeklyStatsChart = ({ storeId }: WeeklyStatsChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [storeId]);

  const loadChartData = async () => {
    try {
      console.log('📈 Carregando gráfico semanal (últimos 7 dias)');
      
      const endDate = new Date();
      const startDate = subDays(endDate, 6); // Últimos 7 dias (incluindo hoje)

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch all vendas for the last 7 days
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor, data_venda')
        .eq('id_loja', storeId)
        .gte('data_venda', startDateStr)
        .lte('data_venda', endDateStr);

      // Fetch all despesas for the last 7 days
      const { data: despesas } = await supabase
        .from('despesas')
        .select('valor, data_despesa')
        .eq('id_loja', storeId)
        .gte('data_despesa', startDateStr)
        .lte('data_despesa', endDateStr);

      // Group by date
      const vendasByDate = new Map<string, number>();
      const despesasByDate = new Map<string, number>();

      vendas?.forEach(v => {
        const current = vendasByDate.get(v.data_venda) || 0;
        vendasByDate.set(v.data_venda, current + Number(v.valor));
      });

      despesas?.forEach(d => {
        const current = despesasByDate.get(d.data_despesa) || 0;
        despesasByDate.set(d.data_despesa, current + Number(d.valor));
      });

      // Build chart data for the last 7 days
      const chartData: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(endDate, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        chartData.push({
          data: format(date, 'dd/MM', { locale: ptBR }),
          vendas: vendasByDate.get(dateStr) || 0,
          despesas: despesasByDate.get(dateStr) || 0,
        });
      }

      setChartData(chartData);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico semanal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-80 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-primary">
      <CardHeader>
        <CardTitle>Desempenho dos últimos 7 dias</CardTitle>
        <CardDescription>
          Acompanhe suas vendas e despesas da última semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="data" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="vendas" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))' }}
              name="Vendas"
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))' }}
              name="Despesas"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default WeeklyStatsChart;
