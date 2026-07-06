using Aplicacao.DTOs;
using Aplicacao.Interfaces;
using Dominio.Entidades;
using Microsoft.EntityFrameworkCore;
using Aplicacao.Features.Pessoas.Queries;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.QueryRepositorios
{
    public class PessoaQueryRepository : IPessoaQueryRepository
    {
        private readonly ApplicationDbContext _context;

        public PessoaQueryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<PessoaListItemDto>> ListPessoasAsync(ListPessoasQuery query)
        {
            var pageNumber = Math.Max(1, query.PageNumber);
            var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;
            var skip = (pageNumber - 1) * pageSize;

            IQueryable<Pessoa> pessoas = _context.Pessoas.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(query.SearchTerm))
            {
                var term = $"%{query.SearchTerm.Trim()}%";
                pessoas = pessoas.Where(c =>
                    EF.Functions.ILike(c.Nome, term) ||
                    EF.Functions.ILike(c.Email, term) ||
                    EF.Functions.ILike(c.CpfCnpj, term));
            }

            pessoas = ApplySorting(pessoas, query);

            var totalCount = await pessoas.CountAsync();

            var items = await pessoas
                .Skip(skip)
                .Take(pageSize)
                .Select(c => new PessoaListItemDto(c.Id, c.Nome, c.Email, c.CpfCnpj, c.DataCriacao))
                .ToListAsync();

            var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

            return new PagedResult<PessoaListItemDto>(items, totalCount, pageNumber, pageSize, totalPages);
        }

        private static IQueryable<Pessoa> ApplySorting(IQueryable<Pessoa> source, ListPessoasQuery query)
        {
            var descending = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            return (query.SortBy?.ToLowerInvariant()) switch
            {
                "email" => descending ? source.OrderByDescending(c => c.Email) : source.OrderBy(c => c.Email),
                "cpfcnpj" => descending ? source.OrderByDescending(c => c.CpfCnpj) : source.OrderBy(c => c.CpfCnpj),
                "datacriacao" => descending ? source.OrderByDescending(c => c.DataCriacao) : source.OrderBy(c => c.DataCriacao),
                _ => descending ? source.OrderByDescending(c => c.Nome) : source.OrderBy(c => c.Nome)
            };
        }
    }
}
