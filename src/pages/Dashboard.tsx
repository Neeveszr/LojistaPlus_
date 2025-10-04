import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, TrendingUp, TrendingDown, DollarSign, Store, Plus } from 'lucide-react';
import { toast } from 'sonner';
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

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [user, navigate]);

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

      // Get summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('resumo_caixa')
        .select('*')
        .eq('id_loja', storeData.id)
        .single();

      if (summaryError && summaryError.code !== 'PGRST116') {
        throw summaryError;
      }

      setSummary(summaryData || { total_vendas: 0, total_despesas: 0, saldo: 0 });
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
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
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
        {store && <StatsChart storeId={store.id} />}

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
                    />
                  )}
                </TabsContent>
                <TabsContent value="despesas">
                  {store && (
                    <TransactionList
                      storeId={store.id}
                      type="despesa"
                      onUpdate={loadData}
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
