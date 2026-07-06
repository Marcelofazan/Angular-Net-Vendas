using Aplicacao.DTOs;
using Aplicacao.Features.Produtos.Queries;
using Aplicacao.Interfaces;

namespace exemploAPIVendas.Services
{
 public class InMemoryProdutoQueryRepository : IProdutoQueryRepository
    {
        public Task<PagedResult<ProdutoListItemDto>> ListProdutosAsync(ListProdutosQuery query)
        {
            var empty = new PagedResult<ProdutoListItemDto>(
                Items: new List<ProdutoListItemDto>(),
                TotalCount: 0,
                PageNumber: query.PageNumber,
                PageSize: query.PageSize,
                TotalPages: 0
            );
            return Task.FromResult(empty);
        }
    }
}
