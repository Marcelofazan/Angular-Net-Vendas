using Dominio.Entidades;
using Dominio.Interfaces;
using System.Collections.Concurrent;

namespace exemploAPIVendas.Services
{
  public class InMemoryProdutoRepository : IProdutoRepository
    {
        private readonly ConcurrentDictionary<Guid, Produto> _produtos = new();

        public Task<Produto> AddAsync(Produto produto)
        {
            _produtos[produto.Id] = produto;
            return Task.FromResult(produto);
        }

        public Task<Produto?> GetByIdAsync(Guid id)
        {
            _produtos.TryGetValue(id, out var produto);
            return Task.FromResult(produto);
        }

        public Task UpdateAsync(Produto produto)
        {
            _produtos[produto.Id] = produto;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Produto produto)
        {
            _produtos.TryRemove(produto.Id, out _);
            return Task.CompletedTask;
        }

        public Task<bool> ExistsBySkuAsync(string sku)
        {
            var exists = _produtos.Values.Any(p => p.Sku.Equals(sku, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(exists);
        }

        public Task<int> GetEstoqueQuantidadeAsync(Guid produtoid)
        {
            _produtos.TryGetValue(produtoid, out var produto);
            return Task.FromResult(produto?.Estoque ?? 0);
        }
    }
}
