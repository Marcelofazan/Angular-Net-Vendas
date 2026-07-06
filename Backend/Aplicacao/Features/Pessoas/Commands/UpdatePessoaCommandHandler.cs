using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Commands
{
    public class UpdatePessoaCommandHandler
    {
        private readonly IPessoaRepository _repository;

        public UpdatePessoaCommandHandler(IPessoaRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(UpdatePessoaCommand command)
        {
            var existing = await _repository.GetByIdAsync(command.Id);
            if (existing is null) return;
            existing.Update(command.Nome, command.Email, command.CpfCnpj);
            await _repository.UpdateAsync(existing);
        }
    }
}
