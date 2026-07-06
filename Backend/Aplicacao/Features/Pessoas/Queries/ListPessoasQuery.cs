using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Queries
{
    public record ListPessoasQuery(
           int PageNumber = 1,
           int PageSize = 10,
           string SortBy = "name",
           string SortDirection = "asc",
           string? SearchTerm = null
       );

    public record PessoaListItemDto(
        Guid Id,
        string Nome,
        string Email,
        string CpfCnpj,
        DateTime DataCriacao
    );

}
