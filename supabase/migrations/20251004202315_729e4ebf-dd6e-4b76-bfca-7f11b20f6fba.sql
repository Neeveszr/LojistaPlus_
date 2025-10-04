-- Criar VIEW para resumo financeiro por loja
CREATE OR REPLACE VIEW view_resumo_financeiro AS
SELECT 
  l.id AS id_loja,
  l.nome AS nome_loja,
  l.id_usuario,
  COALESCE(SUM(v.valor), 0) AS total_vendas,
  COALESCE(SUM(d.valor), 0) AS total_despesas,
  COALESCE(SUM(v.valor), 0) - COALESCE(SUM(d.valor), 0) AS saldo,
  COUNT(DISTINCT v.id) AS quantidade_vendas,
  COUNT(DISTINCT d.id) AS quantidade_despesas,
  COUNT(DISTINCT v.id) + COUNT(DISTINCT d.id) AS total_transacoes
FROM lojas l
LEFT JOIN vendas v ON v.id_loja = l.id
LEFT JOIN despesas d ON d.id_loja = l.id
GROUP BY l.id, l.nome, l.id_usuario;

-- Comentário explicativo
COMMENT ON VIEW view_resumo_financeiro IS 'View que consolida automaticamente o resumo financeiro de cada loja, calculando total de vendas, despesas e saldo';