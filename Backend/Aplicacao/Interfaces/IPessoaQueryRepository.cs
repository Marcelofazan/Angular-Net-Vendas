using Aplicacao.DTOs;
using Aplicacao.Features.Pessoas.Queries;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Interfaces
{
    public interface IPessoaQueryRepository
    {
        Task<PagedResult<PessoaListItemDto>> ListPessoasAsync(ListPessoasQuery query);
    }
}
