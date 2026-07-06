using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Aplicacao.DTOs;
using Aplicacao.Features.Produtos.Commands;
using Aplicacao.Features.Produtos.Queries;
using Dominio.Entidades;
using Dominio.Interfaces;
using System.Linq;

namespace exemploAPIVendas.Controllers
{
    [ApiController]
    [Route("api/produtos")]
    public class ProdutosController : ControllerBase
    {
        private readonly ListProdutosQueryHandler _listHandler;
        private readonly CreateProdutoCommandHandler _createHandler;
        private readonly UpdateProdutoCommandHandler _updateHandler;
        private readonly DeleteProdutoCommandHandler _deleteHandler;
        private readonly IProdutoRepository _produtoRepo;

        public ProdutosController(ListProdutosQueryHandler listHandler, CreateProdutoCommandHandler createHandler, UpdateProdutoCommandHandler updateHandler, DeleteProdutoCommandHandler deleteHandler, IProdutoRepository produtoRepo)
        {
            _listHandler = listHandler;
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _produtoRepo = produtoRepo;
        }

        /// <summary>
        /// Lista produtos com paginação e ordenação.
        /// </summary>
        /// <param name="query">Parâmetros de paginação e filtro.</param>
        /// <returns>Envelope com resultado paginado.</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ProdutoListItemDto>>), 200)]
        public async Task<IActionResult> List([FromQuery] ListProdutosQuery query)
        {
            try
            {
                var result = await _listHandler.Handle(query);
                return Ok(new ApiResponse<PagedResult<ProdutoListItemDto>>(0, null, result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>(1, "Erro ao listar produtos: " + ex.Message, null));
            }
        }

        /// <summary>
        /// Cria um novo produto.
        /// </summary>
        /// <param name="command">Dados do produto.</param>
        /// <returns>Id do produto criado.</returns>
        [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<Guid>), 201)]
    [ProducesResponseType(typeof(ApiResponse<object>), 400)]
    public async Task<IActionResult> Create([FromBody] CreateProdutoCommand command)
    {
        var id = await _createHandler.Handle(command);
        return StatusCode(201, new ApiResponse<Guid>(0, "Produto criado.", id));
    }

        /// <summary>
        /// Obtém um produto por Id.
        /// </summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<ProdutoListItemDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var p = await _produtoRepo.GetByIdAsync(id);
            if (p is null)
                return NotFound(new ApiResponse<object>(1, "Produto não encontrado.", null));
            var dto = new ProdutoListItemDto(p.Id, p.Nome, p.Sku, p.Preco, p.Estoque);
            return Ok(new ApiResponse<ProdutoListItemDto>(0, null, dto));
        }

        /// <summary>
        /// Atualiza um produto.
        /// </summary>
        [HttpPut("{id:guid}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProdutoCommand body)
        {
            var command = body with { Id = id };
            await _updateHandler.Handle(command);
            return NoContent();
        }

        /// <summary>
        /// Exclui um produto.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _deleteHandler.Handle(new DeleteProdutoCommand(id));
            return NoContent();
        }
    }
}