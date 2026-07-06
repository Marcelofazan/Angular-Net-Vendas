using Aplicacao.DTOs;
using Aplicacao.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Queries
{
   public class ListPessoasQueryHandler
    {
        private readonly IPessoaQueryRepository _queryRepository;

        public ListPessoasQueryHandler(IPessoaQueryRepository queryRepository)
        {
            _queryRepository = queryRepository;
        }

        public async Task<PagedResult<PessoaListItemDto>> Handle(ListPessoasQuery query)
        {
            var result = await _queryRepository.ListPessoasAsync(query);
            return result;
        }
    }
}
