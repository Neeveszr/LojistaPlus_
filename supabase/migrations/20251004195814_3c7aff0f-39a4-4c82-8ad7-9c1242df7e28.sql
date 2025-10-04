-- Atualizar trigger para criar loja com nome vazio
-- O usuário vai definir o nome na tela de boas-vindas

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.lojas (id_usuario, nome)
  VALUES (NEW.id, '');
  RETURN NEW;
END;
$$;