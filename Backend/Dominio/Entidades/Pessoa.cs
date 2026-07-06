using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Entidades
{
    public class Pessoa
    {
        public Guid Id { get; private set; }
        public string Nome { get; private set; }
        public string Email { get; private set; }
        public string CpfCnpj { get; private set; }
        public DateTime DataCriacao { get; private set; }

        public Pessoa(string nome, string email, string cpjcnpj)
        {
            Id = Guid.NewGuid();
            Nome = nome;
            Email = email;
            CpfCnpj = cpjcnpj;
            DataCriacao = DateTime.UtcNow;
        }

        private Pessoa() { }

        public void Update(string nome, string email, string cpjcnpj)
        {
            Nome = nome;
            Email = email;
            CpfCnpj = cpjcnpj;
        }
    }
}
