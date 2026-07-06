using Dominio.Entidades;
using Dominio.Enums;
using FluentAssertions;
using Xunit;
using System;
using System.Collections.Generic;
using System.Text;

namespace exemploAPIVendas.Testes.Dominio
{
    public class PedidoTestes
    {
        [Fact]
        public void Create_ShouldCalculoTotalsAndAssignPedidoIdToItems()
        {
            // Arrange
            var produtoA = Guid.NewGuid();
            var produtoB = Guid.NewGuid();

            var items = new[]
            {
                ItemPedido.Create(produtoA, 2, 10m),
                ItemPedido.Create(produtoB, 1, 5m)
            };

            // Act
            var pedido = Pedido.Create(Guid.NewGuid(), items);

            // Assert
            pedido.ValorTotalPedido.Should().Be(25m);
            pedido.Items.Should().HaveCount(2);
            pedido.Items.All(i => i.PedidoId == pedido.Id).Should().BeTrue();
            pedido.Status.Should().Be(PedidoStatus.Criado);
        }

        [Fact]
        public void AttachIdempotencyKey_ShouldStoreKey()
        {
            // Arrange
            var pedido = Pedido.Create(Guid.NewGuid(), new[] { ItemPedido.Create(Guid.NewGuid(), 1, 1m) });

            // Act
            pedido.AttachIdempotencyKey("idem-123");

            // Assert
            pedido.Items.Should().HaveCount(1);
            pedido.ToString(); // no-op just ensures object not null
            pedido.IdempotencyKeyId.Should().Be("idem-123");
        }

        [Fact]
        public void SetStatus_ShouldUpdateStatus()
        {
            var pedido = Pedido.Create(Guid.NewGuid(), new[] { ItemPedido.Create(Guid.NewGuid(), 1, 1m) });

            pedido.SetStatus(PedidoStatus.Pago);

            pedido.Status.Should().Be(PedidoStatus.Pago);
        }
    }
}
