using Aplicacao.Features.Pedidos;
using Dominio.Entidades;
using Dominio.Interfaces;
using FluentAssertions;
using Moq;
using System;
using System.Collections.Generic;
using System.Text;
using System.Timers;

namespace exemploAPIVendas.Testes.Features.Pedidos
{
   public class CreatePedidoCommandHandlerTestes
    {
        private readonly Mock<IPedidoRepository> _pedidoRepositoryMock = new();
        private readonly Mock<IPessoaRepository> _pessoaRepositoryMock = new();
        private readonly Mock<IProdutoRepository> _produtoRepositoryMock = new();
        private readonly CreatePedidoCommandHandler _handler;

        public CreatePedidoCommandHandlerTestes()
        {
            _handler = new CreatePedidoCommandHandler(
                _pedidoRepositoryMock.Object,
                _pessoaRepositoryMock.Object,
                _produtoRepositoryMock.Object);
        }

        [Fact]
        public async Task Handle_ShouldReturnExistingPedidoId_WhenIdempotencyKeyAlreadyProcessed()
        {
            // Arrange
            var existingPedidoId = Guid.NewGuid();
            _pedidoRepositoryMock
                .Setup(repo => repo.GetPedidoIdByKeyAsync("key"))
                .ReturnsAsync(existingPedidoId);

            var command = new CreatePedidoCommand(
                Guid.NewGuid(),
                new List<ItemPedidoDto> { new(Guid.NewGuid(), 1) },
                "key");

            // Act
            var result = await _handler.Handle(command);

            // Assert
            result.Should().Be(existingPedidoId);
            _pessoaRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
            _produtoRepositoryMock.Verify(r => r.GetByIdAsync(It.IsAny<Guid>()), Times.Never);
            _pedidoRepositoryMock.Verify(repo => repo.SavePedidoTransactionAsync(
                It.IsAny<Pedido>(),
                It.IsAny<List<ItemPedido>>(),
                It.IsAny<IdempotencyKey>(),
                It.IsAny<Dictionary<Guid, int>>()), Times.Never);
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenStockIsInsufficient()
        {
            // Arrange
            var pessoaid = Guid.NewGuid();

            var produtos = PrepareHappyPathMocks(pessoaid, new Produto("Produto", "SKU-1", 10m, estoque: 5));
            var produtoId = Assert.Single(produtos.Keys);

            var command = new CreatePedidoCommand(
                pessoaid,
                new List<ItemPedidoDto> { new(produtoId, 10) },
                "key-1");

            // Act
            Func<Task> action = () => _handler.Handle(command);

            // Assert
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Estoque insuficiente*");
        }

        [Fact]
        public async Task Handle_ShouldThrow_WhenAccumulatedQuantityExceedsStock()
        {
            // Arrange
            var customerId = Guid.NewGuid();

            var produtos = PrepareHappyPathMocks(customerId, new Produto("Produto", "SKU-1", 10m, estoque: 5));
            var produtoId = Assert.Single(produtos.Keys);

            var command = new CreatePedidoCommand(
                customerId,
                new List<ItemPedidoDto>
                {
                    new(produtoId, 3),
                    new(produtoId, 3)
                },
                "key-2");

            // Act
            Func<Task> action = () => _handler.Handle(command);

            // Assert
            await action.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*Estoque insuficiente*");
        }

        [Fact]
        public async Task Handle_ShouldPersistPedido_WhenRequestIsValid()
        {
            // Arrange
            var customerId = Guid.NewGuid();
            var idempotencyKey = "key-3";

            var produto = PrepareHappyPathMocks(
                customerId,
                new Produto("Produto A", "SKU-A", 10m, 10),
                new Produto("Produto B", "SKU-B", 5m, 5));

            var firstProdutoId = produto.Single(p => p.Value.Sku == "SKU-A").Key;
            var secondProdutoId = produto.Single(p => p.Value.Sku == "SKU-B").Key;

            var command = new CreatePedidoCommand(
                customerId,
                new List<ItemPedidoDto>
                {
                    new(firstProdutoId, 2),
                    new(secondProdutoId, 1)
                },
                idempotencyKey);

            var capturedPedido = default(Pedido);
            var capturedItems = default(List<ItemPedido>);
            var capturedKey = default(IdempotencyKey);
            var capturedEstoqueUpdates = default(Dictionary<Guid, int>);
            var expectedPedidoId = Guid.NewGuid();

            _pedidoRepositoryMock
                .Setup(repo => repo.SavePedidoTransactionAsync(
                    It.IsAny<Pedido>(),
                    It.IsAny<List<ItemPedido>>(),
                    It.IsAny<IdempotencyKey>(),
                    It.IsAny<Dictionary<Guid, int>>()))
                .Callback<Pedido, List<ItemPedido>, IdempotencyKey, Dictionary<Guid, int>>((pedido, items, key, estoque) =>
                {
                    capturedPedido = pedido;
                    capturedItems = items;
                    capturedKey = key;
                    capturedEstoqueUpdates = estoque;
                })
                .ReturnsAsync(expectedPedidoId);

            // Act
            var result = await _handler.Handle(command);

            // Assert
            result.Should().Be(expectedPedidoId);
            capturedPedido.Should().NotBeNull();
            capturedPedido!.ClienteId.Should().Be(customerId);
            capturedPedido.ValorTotalPedido.Should().Be(10m * 2 + 5m * 1);
            capturedKey.Should().NotBeNull();
            capturedKey!.Key.Should().Be(idempotencyKey);
            capturedItems.Should().HaveCount(2);
            capturedItems!.Should().OnlyContain(item => item.PedidoId == capturedPedido.Id);
            capturedEstoqueUpdates.Should().Contain(new KeyValuePair<Guid, int>(firstProdutoId, 2));
            capturedEstoqueUpdates.Should().Contain(new KeyValuePair<Guid, int>(secondProdutoId, 1));
        }

        private Dictionary<Guid, Produto> PrepareHappyPathMocks(Guid pessoaid, params Produto[] produtos)
        {
            _pedidoRepositoryMock.Reset();
            _pedidoRepositoryMock.Setup(r => r.GetPedidoIdByKeyAsync(It.IsAny<string>()))
                .ReturnsAsync((Guid?)null);
            _pedidoRepositoryMock.Setup(r => r.GetIdempotencyKeyAsync(It.IsAny<string>()))
                .ReturnsAsync((IdempotencyKey?)null);

            _pessoaRepositoryMock.Reset();
            _pessoaRepositoryMock.Setup(r => r.GetByIdAsync(pessoaid))
                .ReturnsAsync(new Pessoa("Cliente", "cliente@email.com", "12345678900"));

            _produtoRepositoryMock.Reset();
            var produtoMap = produtos.ToDictionary(p => p.Id, p => p);
            _produtoRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync((Guid id) => produtoMap.TryGetValue(id, out var produto) ? produto : null);

            return produtoMap;
        }
    }
}
