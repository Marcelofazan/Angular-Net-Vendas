using Dominio.Entidades;
using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Commands
{
    public class CreatePessoaCommandHandler
    {
        private readonly IPessoaRepository _repository;

        public CreatePessoaCommandHandler(IPessoaRepository repository)
        {
            _repository = repository;
        }

        public async Task<Guid> Handle(CreatePessoaCommand command)
        {
            var existingPessoa = await _repository.GetByDocumentoAsync(command.CpfCnpj);
            if (existingPessoa != null)
            {
                throw new InvalidOperationException($"Cliente com documento {command.CpfCnpj} já existe.");
            }

            var pessoa = new Pessoa(
                command.Nome,
                command.Email,
                command.CpfCnpj
            );

            await _repository.AddAsync(pessoa);

            return pessoa.Id;
        }
    }
}
