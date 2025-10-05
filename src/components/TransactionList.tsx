import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  valor: number;
  descricao: string;
  data_venda?: string;
  data_despesa?: string;
  categoria?: string;
  criada_em: string;
}

interface TransactionListProps {
  storeId: string;
  type: 'venda' | 'despesa';
  onUpdate: () => void;
  selectedMonth: string;
}

const TransactionList = ({ storeId, type, onUpdate, selectedMonth }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const monthToLocalDate = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    return new Date(y, (m || 1) - 1, 1);
  };

  useEffect(() => {
    loadTransactions();
  }, [storeId, type, selectedMonth]);

  const loadTransactions = async () => {
    try {
      console.log('📝 Carregando transações para o mês:', selectedMonth);
      
      const startDate = startOfMonth(monthToLocalDate(selectedMonth));
      const endDate = endOfMonth(monthToLocalDate(selectedMonth));
      const startStr = format(startDate, 'yyyy-MM-dd');
      const endStr = format(endDate, 'yyyy-MM-dd');

      const table = type === 'venda' ? 'vendas' : 'despesas';
      const dateColumn = type === 'venda' ? 'data_venda' : 'data_despesa';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id_loja', storeId)
        .gte(dateColumn, startStr)
        .lte(dateColumn, endStr)
        .order('criada_em', { ascending: false });

      if (error) throw error;
      console.log(`✅ ${data?.length || 0} ${type}s encontradas`);
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const table = type === 'venda' ? 'vendas' : 'despesas';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Transação excluída com sucesso!');
      loadTransactions();
      onUpdate();
    } catch (error: any) {
      toast.error('Erro ao excluir transação');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma {type === 'venda' ? 'venda' : 'despesa'} registrada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const data = transaction.data_venda || transaction.data_despesa;
        return (
          <div
            key={transaction.id}
            className="flex items-start justify-between rounded-lg border p-4 transition-smooth hover:shadow-md"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  R$ {transaction.valor.toFixed(2)}
                </span>
                {transaction.categoria && (
                  <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-xs text-secondary-foreground">
                    {transaction.categoria}
                  </span>
                )}
              </div>
              {transaction.descricao && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {transaction.descricao}
                </p>
              )}
              {data && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(data + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(transaction.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList;
