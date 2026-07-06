using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pedidos
{
    public record CreatePedidoCommand(
        Guid PessoaId,
        List<ItemPedidoDto> Items,
        string IdempotencyKey
    );

    public record ItemPedidoDto(Guid produtoid, int quantidade);
}
