public record PedidoItemsDto(
    Guid Id,
    Guid PessoaId,
    string PessoaNome,
    string PessoaCpfCnpj,
    decimal ValorTotalPedido,
    string Status,
    DateTime DataCriacao,
    List<PedidoItemsItemDto> Items
);

public record PedidoItemsItemDto(
    Guid ProdutoId,
    string ProdutoNome, 
    int Quantidade,
    decimal PrecoUnitario,
    decimal ValorTotalUnitario
);
