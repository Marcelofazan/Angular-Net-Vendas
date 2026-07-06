using Dominio.Entidades;
using Dominio.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace InfraEstrutura.Data.Repositorios
{
  public class PessoaRepository : IPessoaRepository
    {
        private readonly ApplicationDbContext _context;

        public PessoaRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Pessoa?> GetByIdAsync(Guid id)
        {
            return await _context.Pessoas.FindAsync(id);
        }

        public async Task<Pessoa?> GetByDocumentoAsync(string document)
        {
            // Faz a busca no banco, essencial para a validação de unicidade
            return await _context.Pessoas.FirstOrDefaultAsync(c => c.CpfCnpj == document);
        }

        public async Task AddAsync(Pessoa pessoa)
        {
            _context.Pessoas.Add(pessoa);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Pessoa pessoa)
        {
            _context.Entry(pessoa).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Pessoa pessoa)
        {
            _context.Pessoas.Remove(pessoa);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
