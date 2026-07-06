using Aplicacao.DTOs;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Interfaces
{
    public interface IPedidoQueryRepository
    {   
        Task<PagedResult<PedidoListItemDto>> ListPedidosAsync(
            int pageNumber,
            int pageSize,
            string? pessoaNomeFilter = null,
            string? statusFilter = null,
            string? sortBy = null);

        Task<PedidoItemsDto?> GetPedidoItemsAsync(Guid pedidoid);
    }
}
