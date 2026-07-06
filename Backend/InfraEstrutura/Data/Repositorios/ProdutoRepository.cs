using Dominio.Entidades;
using Dominio.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.Repositorios
{
    public class ProdutoRepository : IProdutoRepository
    {
        private readonly ApplicationDbContext _context;

        public ProdutoRepository(ApplicationDbContext context)
        {
            // Injeção do ApplicationDbContext (EF Core)
            _context = context;
        }

        // --- C (Create) ---
        public async Task<Produto> AddAsync(Produto produto)
        {
            _context.Produtos.Add(produto);
            await _context.SaveChangesAsync(); // Persiste no banco de dados
            return produto;
        }

        // --- R (Read - Busca por ID para CUD) ---
        public async Task<Produto?> GetByIdAsync(Guid id)
        {
            // O EF Core é usado para buscar a entidade que será alterada (Update/Delete)
            // As leituras de listagem/otimizadas continuam sendo feitas pelo Dapper
            return await _context.Produtos.FirstOrDefaultAsync(p => p.Id == id);
        }

        // --- U (Update) ---
        public async Task UpdateAsync(Produto produto)
        {
            // O EF Core rastreia a entidade. Basta marcá-la como modificada se não foi lida do contexto, 
            // mas neste caso, se o DTO for re-mapeado para uma entidade, Update() é seguro.
            // Se o objeto 'produto' veio de um GetByIdAsync() anterior, SaveChanges() já bastaria.
            _context.Produtos.Update(produto);
            await _context.SaveChangesAsync();
        }

        // --- D (Delete) ---
        public async Task DeleteAsync(Produto produto)
        {
            _context.Produtos.Remove(produto);
            await _context.SaveChangesAsync();
        }

        // Exemplo de busca por SKU (necessário para validação na criação/edição)
        public async Task<bool> ExistsBySkuAsync(string sku)
        {
            return await _context.Produtos.AnyAsync(p => p.Sku == sku);
        }

        // Método exigido para a lógica de estoque (consumido pelo PedidoCommandHandler)
        public async Task<int> GetEstoqueQuantidadeAsync(Guid produtoid)
        {
            return await _context.Produtos
                                 .Where(p => p.Id == produtoid)
                                 .Select(p => p.Estoque)
                                 .FirstOrDefaultAsync();
        }
    }
}
