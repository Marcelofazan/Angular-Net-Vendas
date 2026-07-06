using Aplicacao.DTOs;
using Aplicacao.Features.Produtos.Queries;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Interfaces
{
    public interface IProdutoQueryRepository
    {
        Task<PagedResult<ProdutoListItemDto>> ListProdutosAsync(ListProdutosQuery query);
    }
}
