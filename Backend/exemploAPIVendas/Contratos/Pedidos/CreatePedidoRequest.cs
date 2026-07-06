namespace exemploAPIVendas.Contratos.Pedidos
{
    public class CreatePedidoRequest
    {
        public Guid PessoaId { get; set; }
        public List<CreateItemPedidoRequest> Items { get; set; } = new();
    }

    public class CreateItemPedidoRequest
    {
        public Guid ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }
}
