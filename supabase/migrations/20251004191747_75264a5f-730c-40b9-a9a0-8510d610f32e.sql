-- Adicionar políticas RLS completas para as tabelas

-- Políticas para a tabela lojas
CREATE POLICY "Usuário pode inserir sua própria loja"
ON public.lojas
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Usuário pode atualizar sua própria loja"
ON public.lojas
FOR UPDATE
TO authenticated
USING (auth.uid() = id_usuario)
WITH CHECK (auth.uid() = id_usuario);

CREATE POLICY "Usuário pode deletar sua própria loja"
ON public.lojas
FOR DELETE
TO authenticated
USING (auth.uid() = id_usuario);

-- Políticas para a tabela vendas
CREATE POLICY "Usuário pode inserir vendas da sua loja"
ON public.vendas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = vendas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

CREATE POLICY "Usuário pode atualizar vendas da sua loja"
ON public.vendas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = vendas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = vendas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

CREATE POLICY "Usuário pode deletar vendas da sua loja"
ON public.vendas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = vendas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

-- Políticas para a tabela despesas
CREATE POLICY "Usuário pode inserir despesas da sua loja"
ON public.despesas
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = despesas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

CREATE POLICY "Usuário pode atualizar despesas da sua loja"
ON public.despesas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = despesas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = despesas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

CREATE POLICY "Usuário pode deletar despesas da sua loja"
ON public.despesas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM lojas 
    WHERE lojas.id = despesas.id_loja 
    AND lojas.id_usuario = auth.uid()
  )
);

-- Trigger para criar automaticamente uma loja quando o usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lojas (id_usuario, nome)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Minha Loja')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();