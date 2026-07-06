using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Aplicacao.DTOs;
using Aplicacao.Features.Pessoas.Commands;
using Aplicacao.Features.Pessoas.Queries;
using Dominio.Entidades;
using Dominio.Interfaces;
using System.Linq;

namespace exemploAPIVendas.Controllers
{
    [ApiController]
    [Route("api/pessoas")]
    public class PessoasController : ControllerBase
    {
        private readonly ListPessoasQueryHandler _listHandler;
        private readonly CreatePessoaCommandHandler _createHandler;
        private readonly UpdatePessoaCommandHandler _updateHandler;
        private readonly DeletePessoaCommandHandler _deleteHandler;
        private readonly IPessoaRepository _pessoaRepo;

        public PessoasController(ListPessoasQueryHandler listHandler, CreatePessoaCommandHandler createHandler, UpdatePessoaCommandHandler updateHandler, DeletePessoaCommandHandler deleteHandler, IPessoaRepository pessoaRepo)
        {
            _listHandler = listHandler;
            _createHandler = createHandler;
            _updateHandler = updateHandler;
            _deleteHandler = deleteHandler;
            _pessoaRepo = pessoaRepo;
        }

        /// <summary>
        /// Lista clientes com paginação e filtro.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PessoaListItemDto>>), 200)]
        public async Task<IActionResult> List([FromQuery] ListPessoasQuery query)
        {
            try
            {
                var result = await _listHandler.Handle(query);
                return Ok(new ApiResponse<PagedResult<PessoaListItemDto>>(0, null, result));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<object>(1, "Erro ao listar clientes: " + ex.Message, null));
            }
        }

        /// <summary>
        /// Cria um novo cliente.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<Guid>), 201)]
        [ProducesResponseType(typeof(ApiResponse<object>), 400)]
        public async Task<IActionResult> Create([FromBody] CreatePessoaCommand command)
        {
            var id = await _createHandler.Handle(command);
            return StatusCode(201, new ApiResponse<Guid>(0, "Cliente criado.", id));
        }

        /// <summary>
        /// Obtém um cliente por Id.
        /// </summary>
        [HttpGet("{id:guid}")]
        [ProducesResponseType(typeof(ApiResponse<PessoaListItemDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<object>), 404)]
        public async Task<IActionResult> GetById(Guid id)
        {
            var c = await _pessoaRepo.GetByIdAsync(id);
            if (c is null)
                return NotFound(new ApiResponse<object>(1, "Cliente não encontrado.", null));
            var dto = new PessoaListItemDto(c.Id, c.Nome, c.Email, c.CpfCnpj, c.DataCriacao);
            return Ok(new ApiResponse<PessoaListItemDto>(0, null, dto));
        }

        /// <summary>
        /// Atualiza um cliente.
        /// </summary>
        [HttpPut("{id:guid}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePessoaCommand body)
        {
            var command = body with { Id = id };
            await _updateHandler.Handle(command);
            return NoContent();
        }

        /// <summary>
        /// Exclui um cliente.
        /// </summary>
        [HttpDelete("{id:guid}")]
        [ProducesResponseType(204)]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _deleteHandler.Handle(new DeletePessoaCommand(id));
            return NoContent();
        }
    }
}