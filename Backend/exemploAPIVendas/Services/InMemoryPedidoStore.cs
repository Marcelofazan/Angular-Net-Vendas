using Aplicacao.DTOs;
using Aplicacao.Features.Pedidos;
using Dominio.Entidades;
using Dominio.Enums;
using System.Collections.Concurrent;

public class InMemoryPedidoStore
{
    private readonly ConcurrentDictionary<Guid, Pedido> _pedidos = new();

    public Guid Create(CreatePedidoCommand command)
    {
        var items = command.Items
            .Select(i => ItemPedido.Create(i.produtoid, i.quantidade, 0m))
            .ToList();
        var pedido = Pedido.Create(command.PessoaId, items);
        _pedidos[pedido.Id] = pedido;
        return pedido.Id;
    }

    public bool UpdateStatus(Guid id, string status)
    {
        if (_pedidos.TryGetValue(id, out var o))
        {
            if (Enum.TryParse<PedidoStatus>(status, true, out var parsedStatus))
            {
                o.SetStatus(parsedStatus);
                return true;
            }
            return false;
        }
        return false;
    }

    public bool Delete(Guid id)
    {
        return _pedidos.TryRemove(id, out _);
    }

    public PagedResult<PedidoListItemDto> List(int pageNumber, int pageSize)
    {
        var items = _pedidos.Values
            .OrderByDescending(o => o.DataCriacao)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new PedidoListItemDto(
                o.Id,
                PessoaNome: string.Empty,
                o.ValorTotalPedido,
                o.Status.ToString(),
                o.DataCriacao
            ));
        var totalCount = _pedidos.Count;
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResult<PedidoListItemDto>(items.ToList(), totalCount, pageNumber, pageSize, totalPages);
    }

    public PedidoItemsDto? GetDetails(Guid id)
    {
        if (!_pedidos.TryGetValue(id, out var o)) return null;
        var items = o.Items.Select(i => new PedidoItemsItemDto(
            i.ProdutoId,
            ProdutoNome: string.Empty,
            i.Quantidade,
            i.PrecoUnitario,
            i.ValorTotalUnitario
        )).ToList();

        return new PedidoItemsDto(
            o.Id,
            o.ClienteId,
            PessoaNome: string.Empty,
            PessoaCpfCnpj: string.Empty,
            o.ValorTotalPedido,
            o.Status.ToString(),
            o.DataCriacao,
            items
        );
    }
}
