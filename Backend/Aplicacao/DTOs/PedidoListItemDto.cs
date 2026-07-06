public record PedidoListItemDto(
    Guid Id,
    string PessoaNome, // Traz o nome do cliente por JOIN (Dapper)
    decimal ValorTotalPedido,
    string Status,
    DateTime DataCriacao
);