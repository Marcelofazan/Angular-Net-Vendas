using Aplicacao.DTOs;
using Aplicacao.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Queries
{
  public class ListProdutosQueryHandler
    {
        private readonly IProdutoQueryRepository _queryRepository;

        public ListProdutosQueryHandler(IProdutoQueryRepository queryRepository)
        {
            _queryRepository = queryRepository;
        }

        public async Task<PagedResult<ProdutoListItemDto>> Handle(ListProdutosQuery query)
        {
            var result = await _queryRepository.ListProdutosAsync(query);
            return result;
        }
    }
}
