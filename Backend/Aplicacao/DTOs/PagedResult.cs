using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.DTOs
{
    public record PagedResult<T>(
        IEnumerable<T> Items,
        int TotalCount,
        int PageNumber,
        int PageSize,
        int TotalPages
    );
}
