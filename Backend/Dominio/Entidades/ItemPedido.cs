using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Entidades
{
    public class ItemPedido
    {
        public Guid Id { get; private set; }
        public Guid PedidoId { get; private set; }
        public Guid ProdutoId { get; private set; }
        public int Quantidade { get; private set; }
        public decimal PrecoUnitario { get; private set; }
        public decimal ValorTotalUnitario { get; private set; }

        public Pedido Pedido { get; private set; } = default!;
        public Produto Produto { get; private set; } = default!;

        private ItemPedido() { }

        private ItemPedido(Guid produtoid, int quantidade, decimal precounitario)
        {
            if (quantidade <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(quantidade), "Quantidade deve ser maior que zero.");
            }

            if (precounitario < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(precounitario), "Preço unitário inválido.");
            }

            Id = Guid.NewGuid();
            ProdutoId = produtoid;
            Quantidade = quantidade;
            PrecoUnitario = precounitario;
            ValorTotalUnitario = precounitario * quantidade;
        }

        public static ItemPedido Create(Guid produtoid, int quantidade, decimal precounitario)
            => new(produtoid, quantidade, precounitario);

        public void SetPedido(Guid pedidoid)
        {
            if (pedidoid == Guid.Empty)
            {
                throw new ArgumentException("PedidoId inválido.", nameof(pedidoid));
            }

            PedidoId = pedidoid;
        }
    }
}
