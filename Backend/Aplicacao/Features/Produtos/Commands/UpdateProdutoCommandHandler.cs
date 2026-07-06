using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Commands
{
   public class UpdateProdutoCommandHandler
    {
        private readonly IProdutoRepository _repository;

        public UpdateProdutoCommandHandler(IProdutoRepository repository)
        {
            _repository = repository;
        }

        public async Task Handle(UpdateProdutoCommand command)
        {
            var existing = await _repository.GetByIdAsync(command.Id);
            if (existing is null) return;
            existing.Update(command.Nome, command.Preco, command.Estoque, command.Ativo);
            await _repository.UpdateAsync(existing);
        }
    }
}
