using Dominio.Entidades;
using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Produtos.Commands
{
    public class CreateProdutoCommandHandler
    {
        private readonly IProdutoRepository _repository;

        public CreateProdutoCommandHandler(IProdutoRepository repository)
        {
            _repository = repository;
        }

        public async Task<Guid> Handle(CreateProdutoCommand command)
        {
            var produto = new Produto(
                command.Nome,
                command.Sku,
                command.Preco,
                command.Estoque
            );

            await _repository.AddAsync(produto);

            return produto.Id;
        }
    }
}
