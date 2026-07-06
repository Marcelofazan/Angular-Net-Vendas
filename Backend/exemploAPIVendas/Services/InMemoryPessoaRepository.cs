using Dominio.Entidades;
using Dominio.Interfaces;
using System.Collections.Concurrent;

namespace exemploAPIVendas.Services
{
    public class InMemoryPessoaRepository : IPessoaRepository
    {
        private readonly ConcurrentDictionary<Guid, Pessoa> _pessoas = new();

        public Task<Pessoa?> GetByIdAsync(Guid id)
        {
            _pessoas.TryGetValue(id, out var customer);
            return Task.FromResult(customer);
        }

        public Task AddAsync(Pessoa pessoa)
        {
            _pessoas[pessoa.Id] = pessoa;
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Pessoa pessoa)
        {
            _pessoas[pessoa.Id] = pessoa;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Pessoa pessoa)
        {
            _pessoas.TryRemove(pessoa.Id, out _);
            return Task.CompletedTask;
        }

        public Task<Pessoa?> GetByDocumentoAsync(string document)
        {
            var customer = _pessoas.Values.FirstOrDefault(x => x.CpfCnpj == document);
            return Task.FromResult(customer);
        }

        public Task SaveChangesAsync()
        {
            return Task.CompletedTask;
        }
    }
}
