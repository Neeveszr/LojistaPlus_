import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatsChartProps {
  storeId: string;
  selectedMonth: string;
}

interface ChartData {
  data: string;
  vendas: number;
  despesas: number;
}

const StatsChart = ({ storeId, selectedMonth }: StatsChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  const monthToLocalDate = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  };

  useEffect(() => {
    loadChartData();
  }, [storeId, selectedMonth]);

  const loadChartData = async () => {
    try {
      console.log('📈 Carregando gráfico para o mês:', selectedMonth);
      
      const startDate = startOfMonth(monthToLocalDate(selectedMonth));
      const endDate = endOfMonth(monthToLocalDate(selectedMonth));
      const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch all vendas for the month in one query
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor, data_venda')
        .eq('id_loja', storeId)
        .gte('data_venda', startDateStr)
        .lte('data_venda', endDateStr);

      // Fetch all despesas for the month in one query
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

      // Build chart data
      const chartData: ChartData[] = daysInMonth.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          data: format(date, 'dd/MM', { locale: ptBR }),
          vendas: vendasByDate.get(dateStr) || 0,
          despesas: despesasByDate.get(dateStr) || 0,
        };
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
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
    <Card className="shadow-accent">
      <CardHeader>
        <CardTitle>Desempenho do mês</CardTitle>
        <CardDescription>
          Acompanhe suas vendas e despesas ao longo do mês
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

export default StatsChart;
