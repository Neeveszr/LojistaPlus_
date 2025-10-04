import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Store, TrendingUp, BarChart3, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-30" />
        <div className="container relative z-10 mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-primary">
                <Store className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="mb-6 text-5xl font-bold md:text-6xl">
              Lojista<span className="text-primary">+</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground md:text-2xl">
              Controle financeiro simples e intuitivo para sua loja
            </p>
            <p className="mb-12 text-lg text-muted-foreground">
              Gerencie vendas, despesas e lucros de forma profissional.
              Tome decisões baseadas em dados reais.
            </p>
            <Button
              size="lg"
              className="shadow-primary transition-smooth hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-muted-foreground">
              Recursos poderosos para simplificar sua gestão financeira
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 shadow-accent transition-smooth hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Controle de Vendas
              </h3>
              <p className="text-muted-foreground">
                Registre todas as suas vendas e acompanhe o crescimento da sua receita em tempo real.
              </p>
            </Card>

            <Card className="p-6 shadow-secondary transition-smooth hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <BarChart3 className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Relatórios Visuais
              </h3>
              <p className="text-muted-foreground">
                Gráficos interativos que mostram seu desempenho financeiro de forma clara e objetiva.
              </p>
            </Card>

            <Card className="p-6 shadow-primary transition-smooth hover:scale-105">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Dados Seguros
              </h3>
              <p className="text-muted-foreground">
                Seus dados financeiros protegidos com segurança de nível empresarial.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-12 shadow-primary">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Pronto para transformar sua gestão financeira?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Comece gratuitamente e veja como é fácil ter controle total do seu negócio.
              </p>
              <Button
                size="lg"
                className="shadow-primary transition-smooth hover:scale-105"
                onClick={() => navigate('/auth')}
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Lojista+. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
