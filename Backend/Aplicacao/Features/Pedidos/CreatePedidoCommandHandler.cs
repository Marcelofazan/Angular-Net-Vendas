using Dominio.Entidades;
using Dominio.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pedidos
{
 public class CreatePedidoCommandHandler
    {
        private readonly IPedidoRepository _pedidoRepository;
        private readonly IPessoaRepository _pessoaRepository;
        private readonly IProdutoRepository _produtoRepository;

        public CreatePedidoCommandHandler(
            IPedidoRepository pedidoRepository,
            IPessoaRepository pessoaRepository,
            IProdutoRepository produtoRepository)
        {
            _pedidoRepository = pedidoRepository;
            _pessoaRepository = pessoaRepository;
            _produtoRepository = produtoRepository;
        }

        public async Task<Guid> Handle(CreatePedidoCommand request)
        {
            if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                throw new InvalidOperationException("A chave de idempotência é obrigatória para criar um pedido.");
            }

            var existingPedidoId = await _pedidoRepository.GetPedidoIdByKeyAsync(request.IdempotencyKey);
            if (existingPedidoId.HasValue)
            {
                return existingPedidoId.Value;
            }

            var existingKey = await _pedidoRepository.GetIdempotencyKeyAsync(request.IdempotencyKey);
            if (existingKey is not null)
            {
                throw new InvalidOperationException("Esta requisição de pedido já foi processada.");
            }

            var pessoa = await _pessoaRepository.GetByIdAsync(request.PessoaId);
            if (pessoa == null)
            {
                throw new InvalidOperationException($"Cliente com ID {request.PessoaId} não encontrado.");
            }

            if (request.Items == null || request.Items.Count == 0)
            {
                throw new InvalidOperationException("O pedido deve conter ao menos um item.");
            }

            var stockUpdates = new Dictionary<Guid, int>();
            var pedidoItems = new List<ItemPedido>();

            foreach (var itemDto in request.Items)
            {
                if (itemDto.quantidade <= 0)
                {
                    throw new InvalidOperationException("A quantidade de cada item deve ser maior que zero.");
                }

                var produto = await _produtoRepository.GetByIdAsync(itemDto.produtoid);
                if (produto == null)
                {
                    throw new InvalidOperationException($"Produto com ID {itemDto.produtoid} não encontrado.");
                }

                var requestedQuantity = stockUpdates.TryGetValue(produto.Id, out var alreadyRequested)
                    ? alreadyRequested + itemDto.quantidade
                    : itemDto.quantidade;

                if (produto.Estoque < requestedQuantity)
                {
                    throw new InvalidOperationException(
                        $"Estoque insuficiente para o produto '{produto.Nome}'. Disponível: {produto.Estoque}, Solicitado: {requestedQuantity}");
                }

                var pedidoItem = ItemPedido.Create(produto.Id, itemDto.quantidade, produto.Preco);
                pedidoItems.Add(pedidoItem);

                stockUpdates[produto.Id] = requestedQuantity;
            }

            var pedido = Pedido.Create(request.PessoaId, pedidoItems);
            pedido.AttachIdempotencyKey(request.IdempotencyKey);

            var idempotencyKey = new IdempotencyKey
            {
                Key = request.IdempotencyKey,
                DataCriacao = DateTime.UtcNow
            };

            try
            {
                return await _pedidoRepository.SavePedidoTransactionAsync(
                    pedido,
                    pedidoItems,
                    idempotencyKey,
                    stockUpdates);
            }
            catch (Exception)
            {
                var persistedPedidoId = await _pedidoRepository.GetPedidoIdByKeyAsync(request.IdempotencyKey);
                if (persistedPedidoId.HasValue)
                {
                    return persistedPedidoId.Value;
                }

                throw;
            }
        }
    }
}
