import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DailyPerformanceChartProps {
  storeId: string;
}

interface DailyData {
  vendas: number;
  despesas: number;
  saldo: number;
}

const DailyPerformanceChart = ({ storeId }: DailyPerformanceChartProps) => {
  const [dailyData, setDailyData] = useState<DailyData>({ vendas: 0, despesas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyData();
  }, [storeId]);

  const loadDailyData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch vendas do dia
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor')
        .eq('id_loja', storeId)
        .eq('data_venda', today);

      // Fetch despesas do dia
      const { data: despesas } = await supabase
        .from('despesas')
        .select('valor')
        .eq('id_loja', storeId)
        .eq('data_despesa', today);

      const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
      const totalDespesas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;
      const saldo = totalVendas - totalDespesas;

      setDailyData({ vendas: totalVendas, despesas: totalDespesas, saldo });
    } catch (error) {
      console.error('Erro ao carregar dados do dia:', error);
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

  const chartData = [
    { name: 'Vendas', valor: dailyData.vendas, fill: 'hsl(var(--accent))' },
    { name: 'Despesas', valor: dailyData.despesas, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <Card className="shadow-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Desempenho do dia
        </CardTitle>
        <CardDescription>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-accent/10 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4 text-accent" />
              Vendas
            </div>
            <div className="text-2xl font-bold text-accent">
              R$ {dailyData.vendas.toFixed(2)}
            </div>
          </div>
          
          <div className="rounded-lg bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Despesas
            </div>
            <div className="text-2xl font-bold text-destructive">
              R$ {dailyData.despesas.toFixed(2)}
            </div>
          </div>
          
          <div className={`rounded-lg p-4 ${dailyData.saldo >= 0 ? 'bg-accent/10' : 'bg-destructive/10'}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className={`h-4 w-4 ${dailyData.saldo >= 0 ? 'text-accent' : 'text-destructive'}`} />
              Saldo
            </div>
            <div className={`text-2xl font-bold ${dailyData.saldo >= 0 ? 'text-accent' : 'text-destructive'}`}>
              R$ {dailyData.saldo.toFixed(2)}
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
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
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
            />
            <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DailyPerformanceChart;
