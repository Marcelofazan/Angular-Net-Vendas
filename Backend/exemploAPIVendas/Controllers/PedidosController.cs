using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using exemploAPIVendas.Contratos.Pedidos;
using Aplicacao.DTOs;
using Aplicacao.Features.Pedidos;
using Aplicacao.Interfaces;
using Dominio.Interfaces;

namespace exemploAPIVendas.Controllers
{
    [ApiController]
    [Route("api/pedidos")]
    public class PedidosController : ControllerBase
    {
        private readonly CreatePedidoCommandHandler _createHandler;
        private readonly IPedidoQueryRepository _queryRepository;

        public PedidosController(CreatePedidoCommandHandler createHandler, IPedidoQueryRepository queryRepository)
        {
            _createHandler = createHandler;
            _queryRepository = queryRepository;
        }

        /// <summary>
        /// Lista pedidos com paginação e filtros.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PedidoListItemDto>>), 200)]
        public async Task<IActionResult> List(
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 10,
            [FromQuery] string? pessoaNome = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sortBy = null)
        {
            try
            {
                var result = await _queryRepository.ListPedidosAsync(pageNumber, pageSize, pessoaNome, status, sortBy);
                return Ok(new ApiResponse<PagedResult<PedidoListItemDto>>(0, null, result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>(1, "Erro ao listar pedidos: " + ex.Message, null));
            }
        }

        /// <summary>
        /// Obtém detalhes de um pedido por Id.
        /// </summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<PedidoItemsDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> Get(Guid id)
        {
            try
            {
                var items = await _queryRepository.GetPedidoItemsAsync(id);
                if (items is null)
                    return NotFound(new ApiResponse<object>(1, "Pedido não encontrado.", null));
                return Ok(new ApiResponse<PedidoItemsDto>(0, null, items));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>(1, "Erro ao obter pedido: " + ex.Message, null));
            }
        }

        /// <summary>
        /// Cria um novo pedido com transação atômica e idempotência.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<Guid>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreatePedidoRequest request)
        {
            try
            {
                if (!Request.Headers.TryGetValue("Idempotency-Key", out var idempotencyKey) || string.IsNullOrWhiteSpace(idempotencyKey))
                {
                    return BadRequest(new ApiResponse<object>(1, "É obrigatório informar o header Idempotency-Key.", null));
                }

                var items = (request.Items ?? new List<CreateItemPedidoRequest>())
                    .Select(item => new ItemPedidoDto(item.ProdutoId, item.Quantidade))
                    .ToList();

                var command = new CreatePedidoCommand(
                    request.PessoaId,
                    items,
                    idempotencyKey.ToString());

                var id = await _createHandler.Handle(command);
                return StatusCode(201, new ApiResponse<Guid>(0, "Pedido criado com sucesso.", id));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new ApiResponse<object>(1, ex.Message, null));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>(1, "Erro ao criar pedido: " + ex.Message, null));
            }
        }
    }
}