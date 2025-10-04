import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';
import { toast } from 'sonner';

const StoreSetup = () => {
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to auth if no user after a brief moment
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        toast.error('Sessão expirada. Faça login novamente.');
        navigate('/auth');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      toast.error('Por favor, digite o nome da sua loja');
      return;
    }

    if (!user) {
      toast.error('Usuário não autenticado');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Update store name
      const { error } = await supabase
        .from('lojas')
        .update({ nome: storeName.trim() })
        .eq('id_usuario', user.id);

      if (error) throw error;

      toast.success('Loja configurada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao configurar loja');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 gradient-primary opacity-20" />
      
      <Card className="relative z-10 w-full max-w-md shadow-primary">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">Bem-vindo ao Lojista+!</CardTitle>
            <CardDescription className="mt-2">
              Vamos começar configurando sua loja
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nome da sua loja</Label>
              <Input
                id="storeName"
                type="text"
                placeholder="Ex: Minha Loja, Loja do João..."
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Você pode alterar isso depois nas configurações
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Configurando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreSetup;
