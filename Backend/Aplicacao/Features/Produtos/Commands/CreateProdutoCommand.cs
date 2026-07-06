using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Commands
{
  public record CreateProdutoCommand(
       string Nome,
       string Sku,
       decimal Preco,
       int Estoque
   );

    public record UpdateProdutoCommand(
        Guid Id,
        string Nome,
        decimal Preco,
        int Estoque,
        bool Ativo
    );

    public record DeleteProdutoCommand(Guid Id);
}
