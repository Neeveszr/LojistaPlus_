import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, TrendingUp, TrendingDown, DollarSign, Store, Plus, Download, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import StatsChart from '@/components/StatsChart';

interface StoreData {
  id: string;
  nome: string;
}

interface Summary {
  total_vendas: number;
  total_despesas: number;
  saldo: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreData | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'venda' | 'despesa'>('venda');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [user, navigate, selectedMonth]);

  const loadData = async () => {
    try {
      // Get store
      const { data: storeData, error: storeError } = await supabase
        .from('lojas')
        .select('*')
        .eq('id_usuario', user?.id)
        .single();

      if (storeError) throw storeError;
      setStore(storeData);

      // Calculate month range
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      // Get vendas for the month
      const { data: vendasData } = await supabase
        .from('vendas')
        .select('valor')
        .eq('id_loja', storeData.id)
        .gte('data_venda', startStr)
        .lte('data_venda', endStr);

      // Get despesas for the month
      const { data: despesasData } = await supabase
        .from('despesas')
        .select('valor')
        .eq('id_loja', storeData.id)
        .gte('data_despesa', startStr)
        .lte('data_despesa', endStr);

      const totalVendas = vendasData?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
      const totalDespesas = despesasData?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;
      const saldo = totalVendas - totalDespesas;

      setSummary({ total_vendas: totalVendas, total_despesas: totalDespesas, saldo });
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSuccess = () => {
    setShowTransactionForm(false);
    loadData();
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', { locale: ptBR });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  };

  const exportMonthlyCSV = async () => {
    if (!store) return;

    try {
      const startDate = startOfMonth(new Date(selectedMonth));
      const endDate = endOfMonth(new Date(selectedMonth));
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const { data: vendas } = await supabase
        .from('vendas')
        .select('*')
        .eq('id_loja', store.id)
        .gte('data_venda', startStr)
        .lte('data_venda', endStr)
        .order('data_venda', { ascending: true });

      const { data: despesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('id_loja', store.id)
        .gte('data_despesa', startStr)
        .lte('data_despesa', endStr)
        .order('data_despesa', { ascending: true });

      let csv = 'Tipo,Data,Valor,Descrição,Categoria\n';
      
      vendas?.forEach(v => {
        csv += `Venda,${v.data_venda},${v.valor},"${v.descricao || ''}",\n`;
      });

      despesas?.forEach(d => {
        csv += `Despesa,${d.data_despesa},${d.valor},"${d.descricao || ''}","${d.categoria || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-mensal-${selectedMonth}.csv`;
      a.click();
      
      toast.success('Relatório mensal exportado!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  const exportWeeklyCSV = async () => {
    if (!store) return;

    try {
      const startDate = startOfWeek(new Date(), { locale: ptBR });
      const endDate = endOfWeek(new Date(), { locale: ptBR });
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const { data: vendas } = await supabase
        .from('vendas')
        .select('*')
        .eq('id_loja', store.id)
        .gte('data_venda', startStr)
        .lte('data_venda', endStr)
        .order('data_venda', { ascending: true });

      const { data: despesas } = await supabase
        .from('despesas')
        .select('*')
        .eq('id_loja', store.id)
        .gte('data_despesa', startStr)
        .lte('data_despesa', endStr)
        .order('data_despesa', { ascending: true });

      let csv = 'Tipo,Data,Valor,Descrição,Categoria\n';
      
      vendas?.forEach(v => {
        csv += `Venda,${v.data_venda},${v.valor},"${v.descricao || ''}",\n`;
      });

      despesas?.forEach(d => {
        csv += `Despesa,${d.data_despesa},${d.valor},"${d.descricao || ''}","${d.categoria || ''}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-semanal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast.success('Relatório semanal exportado!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lojista+</h1>
              <p className="text-sm text-muted-foreground">{store?.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportWeeklyCSV}>
              <Download className="mr-2 h-4 w-4" />
              Semanal
            </Button>
            <Button variant="outline" size="sm" onClick={exportMonthlyCSV}>
              <Download className="mr-2 h-4 w-4" />
              Mensal
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="shadow-primary transition-smooth hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(summary?.saldo || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receitas menos despesas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-accent transition-smooth hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                R$ {(summary?.total_vendas || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita total do período
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-secondary transition-smooth hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {(summary?.total_despesas || 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Gastos totais do período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {store && <StatsChart storeId={store.id} selectedMonth={selectedMonth} />}

        {/* Transactions */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Movimentações</CardTitle>
                <CardDescription>
                  Registre e acompanhe suas vendas e despesas
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setTransactionType('venda');
                    setShowTransactionForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Venda
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTransactionType('despesa');
                    setShowTransactionForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Despesa
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showTransactionForm ? (
              <TransactionForm
                storeId={store!.id}
                type={transactionType}
                onSuccess={handleTransactionSuccess}
                onCancel={() => setShowTransactionForm(false)}
              />
            ) : (
              <Tabs defaultValue="vendas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vendas">Vendas</TabsTrigger>
                  <TabsTrigger value="despesas">Despesas</TabsTrigger>
                </TabsList>
                <TabsContent value="vendas">
                  {store && (
                    <TransactionList
                      storeId={store.id}
                      type="venda"
                      onUpdate={loadData}
                      selectedMonth={selectedMonth}
                    />
                  )}
                </TabsContent>
                <TabsContent value="despesas">
                  {store && (
                    <TransactionList
                      storeId={store.id}
                      type="despesa"
                      onUpdate={loadData}
                      selectedMonth={selectedMonth}
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
