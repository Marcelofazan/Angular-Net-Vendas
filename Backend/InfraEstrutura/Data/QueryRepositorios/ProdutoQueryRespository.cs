using Aplicacao.DTOs;
using Aplicacao.Features.Produtos.Queries;
using Aplicacao.Interfaces;
using Dominio.Entidades;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.QueryRepositorios
{
    public class ProdutoQueryRepository : IProdutoQueryRepository
    {
        private readonly ApplicationDbContext _context;

        public ProdutoQueryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<ProdutoListItemDto>> ListProdutosAsync(ListProdutosQuery query)
        {
            var pageNumber = Math.Max(1, query.PageNumber);
            var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;
            var skip = (pageNumber - 1) * pageSize;

            IQueryable<Produto> produtos = _context.Produtos.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var term = $"%{query.SearchTerm.Trim()}%";
                produtos = produtos.Where(p =>
                    EF.Functions.ILike(p.Nome, term) ||
                    EF.Functions.ILike(p.Sku, term));
            }

            if (query.Ativo.HasValue)
            {
                produtos = produtos.Where(p => p.Ativo == query.Ativo.Value);
            }

            produtos = ApplySorting(produtos, query);

            var totalCount = await produtos.CountAsync();

            var items = await produtos
                .Skip(skip)
                .Take(pageSize)
                .Select(p => new ProdutoListItemDto(p.Id, p.Nome, p.Sku, p.Preco, p.Estoque))
                .ToListAsync();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResult<ProdutoListItemDto>(items, totalCount, pageNumber, pageSize, totalPages);
        }

        private static IQueryable<Produto> ApplySorting(IQueryable<Produto> queryable, ListProdutosQuery query)
        {
            var direction = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase)
                ? "desc"
                : "asc";

            return (query.SortBy?.ToLowerInvariant()) switch
            {
                "sku" => direction == "desc"
                    ? queryable.OrderByDescending(p => p.Sku)
                    : queryable.OrderBy(p => p.Sku),
                "preco" => direction == "desc"
                    ? queryable.OrderByDescending(p => p.Preco)
                    : queryable.OrderBy(p => p.Preco),
                "estoque" => direction == "desc"
                    ? queryable.OrderByDescending(p => p.Estoque)
                    : queryable.OrderBy(p => p.Estoque),
                _ => direction == "desc"
                    ? queryable.OrderByDescending(p => p.Nome)
                    : queryable.OrderBy(p => p.Nome),
            };
        }
    }
}
