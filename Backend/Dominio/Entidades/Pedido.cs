using Dominio.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Entidades
{
    public class Pedido
    {
        public Guid Id { get; private set; }
        public Guid ClienteId { get; private set; }
        public string? IdempotencyKeyId { get; private set; }
        public decimal ValorTotalPedido { get; private set; }
        public PedidoStatus Status { get; private set; } = PedidoStatus.Criado;
        public DateTime DataCriacao { get; private set; }

        private readonly List<ItemPedido> _items = new();
        public IReadOnlyCollection<ItemPedido> Items => _items.AsReadOnly();

        public Pedido(Guid clienteid)
        {
            Id = Guid.NewGuid();
            ClienteId = clienteid;
            DataCriacao = DateTime.UtcNow;
        }

        private Pedido() { }

        public static Pedido Create(Guid clienteid, IEnumerable<ItemPedido> items)
        {
            var pedido = new Pedido(clienteid);
            pedido.ReplaceItems(items);
            return pedido;
        }

        public void ReplaceItems(IEnumerable<ItemPedido> items)
        {
            if (items == null) throw new ArgumentNullException(nameof(items));

            _items.Clear();

            foreach (var item in items)
            {
                AddItem(item);
            }

            RecalculateTotal();
        }

        public void AddItem(ItemPedido item)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));

            item.SetPedido(Id);
            _items.Add(item);
            RecalculateTotal();
        }

        public void SetStatus(PedidoStatus newStatus)
        {
            Status = newStatus;
        }

        public void AttachIdempotencyKey(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ArgumentException("A chave de idempotência é obrigatória.", nameof(key));
            }

            IdempotencyKeyId = key;
        }

        private void RecalculateTotal()
        {
            ValorTotalPedido = _items.Sum(item => item.ValorTotalUnitario);
        }
    }
}
