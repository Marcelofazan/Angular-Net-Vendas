using System;
using System.Collections.Generic;
using System.Text;

namespace Aplicacao.Features.Pessoas.Commands
{
    public record CreatePessoaCommand(
        string Nome,
        string Email,
        string CpfCnpj
    );

    public record UpdatePessoaCommand(
        Guid Id,
        string Nome,
        string Email,
        string CpfCnpj
    );

    public record DeletePessoaCommand(Guid Id);
}
