using Dominio.Entidades;
using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Interfaces
{
    public interface IProdutoRepository
    {
        Task<Produto> AddAsync(Produto produto);
        Task<Produto?> GetByIdAsync(Guid id);
        Task UpdateAsync(Produto produto);
        Task DeleteAsync(Produto produto);
        Task<bool> ExistsBySkuAsync(string sku);
        Task<int> GetEstoqueQuantidadeAsync(Guid produtoid);
    }
}
