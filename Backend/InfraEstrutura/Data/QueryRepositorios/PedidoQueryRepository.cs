using Aplicacao.DTOs;
using Aplicacao.Interfaces;
using Dominio.Entidades;
using Dominio.Enums;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.QueryRepositorios
{
    public class PedidoQueryRepository : IPedidoQueryRepository
    {
        private readonly ApplicationDbContext _context;

        public PedidoQueryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<PedidoListItemDto>> ListPedidosAsync(
            int pageNumber,
            int pageSize,
            string? pessoaNomeFilter = null,
            string? statusFilter = null,
            string? sortBy = null)
        {
            var query = _context.Pedidos.AsQueryable();

            // Filtro por nome do cliente
            if (!string.IsNullOrEmpty(pessoaNomeFilter))
            {
                var filteredCustomerIds = _context.Pessoas
                    .Where(c => EF.Functions.ILike(c.Nome, $"%{pessoaNomeFilter}%"))
                    .Select(c => c.Id);

                query = query.Where(o => filteredCustomerIds.Contains(o.ClienteId));
            }

            // Filtro por status
            if (!string.IsNullOrEmpty(statusFilter) && Enum.TryParse<PedidoStatus>(statusFilter, true, out var parsedStatus))
            {
                query = query.Where(o => o.Status == parsedStatus);
            }

            // Contagem total
            var total = await query.CountAsync();

            // Ordenação
            if (sortBy == "data_desc")
                query = query.OrderByDescending(o => o.DataCriacao);
            else
                query = query.OrderBy(o => o.DataCriacao);

            // Paginação
            var skip = (pageNumber - 1) * pageSize;
            var pedidos = await query
                .Skip(skip)
                .Take(pageSize)
                .Include(o => o.Items)
                .ToListAsync();

            var pessoaNomes = await _context.Pessoas
                .Where(c => pedidos.Select(o => o.ClienteId).Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => c.Nome);

            var items = pedidos.Select(o => new PedidoListItemDto(
                o.Id,
                pessoaNomes.TryGetValue(o.ClienteId, out var name) ? name : "Cliente Desconhecido",
                o.ValorTotalPedido,
                FormatStatus(o.Status),
                o.DataCriacao
            )).ToList();

            var totalPages = total == 0 ? 0 : (int)Math.Ceiling(total / (double)pageSize);

            return new PagedResult<PedidoListItemDto>(
                items,
                total,
                pageNumber,
                pageSize,
                totalPages
            );
        }

        public async Task<PedidoItemsDto?> GetPedidoItemsAsync(Guid pedidoid)
        {
            var pedido = await _context.Pedidos
                .Include(o => o.Items)
                .ThenInclude(oi => oi.Produto)
                .FirstOrDefaultAsync(o => o.Id == pedidoid);

            if (pedido == null)
                return null;

            var customer = await _context.Pessoas.FindAsync(pedido.ClienteId);

            var items = pedido.Items.Select(oi => new PedidoItemsItemDto(
                oi.ProdutoId,
                oi.Produto?.Nome ?? "Produto Desconhecido",
                oi.Quantidade,
                oi.PrecoUnitario,
                oi.ValorTotalUnitario
            )).ToList();

            return new PedidoItemsDto(
                pedido.Id,
                pedido.ClienteId,
                customer?.Nome ?? "Cliente Desconhecido",
                customer?.CpfCnpj ?? string.Empty,
                pedido.ValorTotalPedido,
                FormatStatus(pedido.Status),
                pedido.DataCriacao,
                items
            );
        }

        private static string FormatStatus(PedidoStatus status) => status.ToString().ToUpperInvariant();
    }
}
