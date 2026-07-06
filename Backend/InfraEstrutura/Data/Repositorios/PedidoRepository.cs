using Dominio.Entidades;
using Dominio.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.Repositorios
{
 public class PedidoRepository : IPedidoRepository
    {
        private readonly ApplicationDbContext _context;

        public PedidoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Guid> SavePedidoTransactionAsync(
            Pedido pedido,
            List<ItemPedido> items,
            IdempotencyKey idempotencyKey,
            Dictionary<Guid, int> stockUpdates)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                pedido.AttachIdempotencyKey(idempotencyKey.Key);

                foreach (var item in items)
                {
                    item.SetPedido(pedido.Id);
                }

                _context.IdempotencyKeys.Add(idempotencyKey);
                _context.Pedidos.Add(pedido);
                _context.ItemsPedido.AddRange(items);

                foreach (var (produtoid, quantidade) in stockUpdates)
                {
                    var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Id == produtoid);
                    if (produto == null)
                    {
                        throw new InvalidOperationException($"Produto ID {produtoid} não encontrado durante a transação.");
                    }

                    produto.DecreaseStock(quantidade);
                    _context.Produtos.Update(produto);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return pedido.Id;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public Task<IdempotencyKey?> GetIdempotencyKeyAsync(string key)
        {
            return _context.IdempotencyKeys.FirstOrDefaultAsync(k => k.Key == key);
        }

        public Task<Guid?> GetPedidoIdByKeyAsync(string key)
        {
            return _context.Pedidos
                .Where(o => o.IdempotencyKeyId == key)
                .Select(o => (Guid?)o.Id)
                .FirstOrDefaultAsync();
        }
    }
}
