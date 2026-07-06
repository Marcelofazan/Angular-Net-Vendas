using Aplicacao.DTOs;
using Aplicacao.Features.Pessoas.Queries;
using Aplicacao.Interfaces;

namespace exemploAPIVendas.Services
{
   public class InMemoryPessoaQueryRepository : IPessoaQueryRepository
    {
        public Task<PagedResult<PessoaListItemDto>> ListPessoasAsync(ListPessoasQuery query)
        {
            var empty = new PagedResult<PessoaListItemDto>(
                Items: new List<PessoaListItemDto>(),
                TotalCount: 0,
                PageNumber: query.PageNumber,
                PageSize: query.PageSize,
                TotalPages: 0
            );
            return Task.FromResult(empty);
        }
    }
}
