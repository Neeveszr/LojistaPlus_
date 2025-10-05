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
import WeeklyStatsChart from '@/components/WeeklyStatsChart';
import DailyPerformanceChart from '@/components/DailyPerformanceChart';

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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const month = format(now, 'yyyy-MM');
    console.log('🗓️ Mês inicial:', month);
    return month;
  });

  const monthToLocalDate = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkStoreSetup();
  }, [user, navigate]);

  useEffect(() => {
    if (store) {
      loadData();
    }
  }, [store, selectedMonth]);

  const checkStoreSetup = async () => {
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('lojas')
        .select('*')
        .eq('id_usuario', user?.id)
        .single();

      if (storeError) throw storeError;
      
      // Check if store has a proper name (not default)
      if (!storeData.nome || storeData.nome === 'Minha Loja' || storeData.nome === user?.email) {
        navigate('/setup');
        return;
      }

      setStore(storeData);
    } catch (error: any) {
      toast.error('Erro ao verificar loja');
      console.error(error);
    }
  };

  const loadData = async () => {
    if (!store) return;
    
    try {
      console.log('📊 Carregando dados para o mês:', selectedMonth);

      // Calculate month range
      const startDate = startOfMonth(monthToLocalDate(selectedMonth));
      const endDate = endOfMonth(monthToLocalDate(selectedMonth));
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      console.log('📅 Período:', startStr, 'até', endStr);

      // Get vendas for the month
      const { data: vendasData } = await supabase
        .from('vendas')
        .select('valor')
        .eq('id_loja', store.id)
        .gte('data_venda', startStr)
        .lte('data_venda', endStr);

      // Get despesas for the month
      const { data: despesasData } = await supabase
        .from('despesas')
        .select('valor')
        .eq('id_loja', store.id)
        .gte('data_despesa', startStr)
        .lte('data_despesa', endStr);

      const totalVendas = vendasData?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
      const totalDespesas = despesasData?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;
      const saldo = totalVendas - totalDespesas;

      console.log('💰 Total vendas:', totalVendas, '💸 Total despesas:', totalDespesas, '💵 Saldo:', saldo);

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
      const startDate = startOfMonth(monthToLocalDate(selectedMonth));
      const endDate = endOfMonth(monthToLocalDate(selectedMonth));
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

      const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
      const totalDespesas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;
      const saldoMensal = totalVendas - totalDespesas;

      // CSV com cabeçalho informativo
      let csv = `RELATÓRIO MENSAL - ${format(startDate, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}\n`;
      csv += `Loja: ${store.nome}\n`;
      csv += `Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}\n`;
      csv += `\n`;
      csv += `RESUMO FINANCEIRO\n`;
      csv += `Total de Vendas:,R$ ${totalVendas.toFixed(2)}\n`;
      csv += `Total de Despesas:,R$ ${totalDespesas.toFixed(2)}\n`;
      csv += `Saldo do Período:,R$ ${saldoMensal.toFixed(2)}\n`;
      csv += `\n`;
      csv += `DETALHAMENTO\n`;
      csv += `Tipo,Data,Valor (R$),Descrição,Categoria\n`;
      
      vendas?.forEach(v => {
        const dataFormatada = format(new Date(v.data_venda), 'dd/MM/yyyy', { locale: ptBR });
        const valorFormatado = Number(v.valor).toFixed(2);
        csv += `Venda,${dataFormatada},${valorFormatado},"${v.descricao || 'Sem descrição'}",\n`;
      });

      despesas?.forEach(d => {
        const dataFormatada = format(new Date(d.data_despesa), 'dd/MM/yyyy', { locale: ptBR });
        const valorFormatado = Number(d.valor).toFixed(2);
        csv += `Despesa,${dataFormatada},${valorFormatado},"${d.descricao || 'Sem descrição'}","${d.categoria || 'Sem categoria'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-mensal-${selectedMonth}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
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

      const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;
      const totalDespesas = despesas?.reduce((acc, d) => acc + Number(d.valor), 0) || 0;
      const saldoSemanal = totalVendas - totalDespesas;

      // CSV com cabeçalho informativo
      let csv = `RELATÓRIO SEMANAL\n`;
      csv += `Loja: ${store.nome}\n`;
      csv += `Período: ${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}\n`;
      csv += `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n`;
      csv += `\n`;
      csv += `RESUMO FINANCEIRO\n`;
      csv += `Total de Vendas:,R$ ${totalVendas.toFixed(2)}\n`;
      csv += `Total de Despesas:,R$ ${totalDespesas.toFixed(2)}\n`;
      csv += `Saldo do Período:,R$ ${saldoSemanal.toFixed(2)}\n`;
      csv += `\n`;
      csv += `DETALHAMENTO\n`;
      csv += `Tipo,Data,Valor (R$),Descrição,Categoria\n`;
      
      vendas?.forEach(v => {
        const dataFormatada = format(new Date(v.data_venda), 'dd/MM/yyyy', { locale: ptBR });
        const valorFormatado = Number(v.valor).toFixed(2);
        csv += `Venda,${dataFormatada},${valorFormatado},"${v.descricao || 'Sem descrição'}",\n`;
      });

      despesas?.forEach(d => {
        const dataFormatada = format(new Date(d.data_despesa), 'dd/MM/yyyy', { locale: ptBR });
        const valorFormatado = Number(d.valor).toFixed(2);
        csv += `Despesa,${dataFormatada},${valorFormatado},"${d.descricao || 'Sem descrição'}","${d.categoria || 'Sem categoria'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-semanal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
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
      <header className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-primary">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
              <Store className="h-6 w-6 text-primary-foreground relative z-10" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-background" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Lojista+
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                {store?.nome}
              </p>
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
          <Card className="gradient-primary shadow-primary transition-smooth hover:scale-105 border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-foreground">Saldo Total</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-primary-foreground">
                R$ {(summary?.saldo || 0).toFixed(2)}
              </div>
              <p className="text-xs text-primary-foreground/90 mt-1">
                Receitas menos despesas
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-accent shadow-accent transition-smooth hover:scale-105 border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-accent-foreground">Total de Vendas</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-accent-foreground">
                R$ {(summary?.total_vendas || 0).toFixed(2)}
              </div>
              <p className="text-xs text-accent-foreground/90 mt-1">
                Receita total do período
              </p>
            </CardContent>
          </Card>

          <Card className="gradient-destructive shadow-destructive transition-smooth hover:scale-105 border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-destructive-foreground">Total de Despesas</CardTitle>
              <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive-foreground" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-destructive-foreground">
                R$ {(summary?.total_despesas || 0).toFixed(2)}
              </div>
              <p className="text-xs text-destructive-foreground/90 mt-1">
                Gastos totais do período
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="mb-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {store && <DailyPerformanceChart storeId={store.id} />}
            {store && <WeeklyStatsChart storeId={store.id} />}
          </div>
          {store && <StatsChart storeId={store.id} selectedMonth={selectedMonth} />}
        </div>

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
