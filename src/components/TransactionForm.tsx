import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface TransactionFormProps {
  storeId: string;
  type: 'venda' | 'despesa';
  onSuccess: () => void;
  onCancel: () => void;
}

const TransactionForm = ({ storeId, type, onSuccess, onCancel }: TransactionFormProps) => {
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const table = type === 'venda' ? 'vendas' : 'despesas';
      const dataField = type === 'venda' ? 'data_venda' : 'data_despesa';
      
      const payload: any = {
        id_loja: storeId,
        valor: parseFloat(valor),
        descricao,
        [dataField]: data,
      };

      if (type === 'despesa') {
        payload.categoria = categoria;
      }

      const { error } = await supabase
        .from(table)
        .insert([payload]);

      if (error) throw error;

      toast.success(`${type === 'venda' ? 'Venda' : 'Despesa'} registrada com sucesso!`);
      onSuccess();
    } catch (error: any) {
      toast.error('Erro ao registrar transação');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="valor">Valor (R$)</Label>
        <Input
          id="valor"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input
          id="data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </div>

      {type === 'despesa' && (
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            type="text"
            placeholder="Ex: Aluguel, Fornecedores..."
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Detalhes da transação..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;
