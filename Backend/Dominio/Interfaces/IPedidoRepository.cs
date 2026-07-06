using Dominio.Entidades;
using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Interfaces
{
    public interface IPedidoRepository
    {
        Task<Guid> SavePedidoTransactionAsync(
            Pedido pedido,
            List<ItemPedido> items,
            IdempotencyKey idempotencyKey,
            Dictionary<Guid, int> stockUpdates);

        Task<IdempotencyKey?> GetIdempotencyKeyAsync(string key);
        Task<Guid?> GetPedidoIdByKeyAsync(string key);
    }
}
