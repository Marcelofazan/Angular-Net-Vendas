using Dominio.Entidades;
using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Interfaces
{
    public interface IPessoaRepository
    {
        Task<Pessoa?> GetByIdAsync(Guid id);
        Task AddAsync(Pessoa pessoa);
        Task UpdateAsync(Pessoa pessoa);
        Task DeleteAsync(Pessoa pessoa);
        Task<Pessoa?> GetByDocumentoAsync(string document);
        Task SaveChangesAsync();
    }
}
