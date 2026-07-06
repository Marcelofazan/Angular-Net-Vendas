using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Commands
{
    public class DeletePessoaCommandHandler
    {
        private readonly IPessoaRepository _repository;

        public DeletePessoaCommandHandler(IPessoaRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(DeletePessoaCommand command)
        {
            var existing = await _repository.GetByIdAsync(command.Id);
            if (existing is null) return;
            await _repository.DeleteAsync(existing);
        }
    }
}
