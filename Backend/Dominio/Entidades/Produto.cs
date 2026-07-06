using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Entidades
{
    public class Produto
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string Sku { get; private set; }
        public decimal Preco { get; private set; }
        public int Estoque { get; private set; }
        public bool Ativo { get; private set; }
        public DateTime DataCriacao { get; private set; }

        public Produto(string nome, string sku, decimal preco, int estoque)
        {
            Id = Guid.NewGuid();
            Nome = nome;
            Sku = sku;
            Preco = preco;
            Estoque = estoque;
            Ativo = true;
            DataCriacao = DateTime.UtcNow;
        }

        private Produto() { }

        public void Update(string nome, decimal preco, int estoque, bool ativo)
        {
            Nome = nome;
            Preco = preco;
            Estoque = estoque;
            Ativo = ativo;
        }

        public void DecreaseStock(int quantidade)
        {
            if (quantidade <= 0)
                throw new ArgumentOutOfRangeException(nameof(quantidade), "Quantidade deve ser maior que zero.");

            if (quantidade > Estoque)
                throw new InvalidOperationException("Estoque insuficiente para a operação.");

            Estoque -= quantidade;
        }
    }
}
