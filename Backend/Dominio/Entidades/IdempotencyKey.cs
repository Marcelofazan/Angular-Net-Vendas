using System;
using System.Collections.Generic;
using System.Text;

namespace Dominio.Entidades
{
    public class IdempotencyKey
    {
        public string Key { get; set; } = string.Empty;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    }
}
