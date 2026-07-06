using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Commands
{
    public class DeleteProdutoCommandHandler
    {
        private readonly IProdutoRepository _repository;

        public DeleteProdutoCommandHandler(IProdutoRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(DeleteProdutoCommand command)
        {
            var existing = await _repository.GetByIdAsync(command.Id);
            if (existing is null) return;
            await _repository.DeleteAsync(existing);
        }
    }
}
