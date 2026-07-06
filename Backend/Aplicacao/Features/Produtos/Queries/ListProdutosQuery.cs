using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Queries
{
  public record ListProdutosQuery(
        int PageNumber = 1,
        int PageSize = 10,
        string SortBy = "name",
        string SortDirection = "asc",
        string? SearchTerm = null,
        bool? Ativo = true
    );

    public record ProdutoListItemDto(
        Guid Id,
        string Nome,
        string Sku,
        decimal Preco,
        int Estoque
    );
}
