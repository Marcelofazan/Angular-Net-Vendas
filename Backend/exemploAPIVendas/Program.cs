using Aplicacao.Features.Pedidos;
using Aplicacao.Features.Pessoas.Commands;
using Aplicacao.Features.Pessoas.Queries;
using Aplicacao.Features.Produtos.Commands;
using Aplicacao.Features.Produtos.Queries;
using Aplicacao.Interfaces;
using Dominio.Interfaces;
using exemploAPIVendas.Middleware;
using InfraEstrutura;
using InfraEstrutura.Data.QueryRepositorios;
using InfraEstrutura.Data.Repositorios;
using InfraEstrutura.Data.Seed;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Formatting.Json;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.


builder.Host.UseSerilog((context, configuration) =>
{
    configuration
        .Enrich.FromLogContext()
        .WriteTo.Console(new JsonFormatter(renderMessage: true))
        .WriteTo.File(new JsonFormatter(renderMessage: true), "logs/api-log-.json", rollingInterval: RollingInterval.Day);
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["ConnectionStrings__DefaultConnection"]
    ?? throw new InvalidOperationException("Database connection string is not configured.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHealthChecks();
// CORS: allow the local frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(
                "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});
builder.Services.AddEndpointsApiExplorer();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// DI registrations
builder.Services.AddScoped<IProdutoQueryRepository, ProdutoQueryRepository>();
builder.Services.AddScoped<IPessoaQueryRepository, PessoaQueryRepository>();
builder.Services.AddScoped<IPedidoQueryRepository, PedidoQueryRepository>();
builder.Services.AddTransient<ListProdutosQueryHandler>();
builder.Services.AddTransient<ListPessoasQueryHandler>();
builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();
builder.Services.AddScoped<IPessoaRepository, PessoaRepository>();
builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();
builder.Services.AddTransient<CreateProdutoCommandHandler>();
builder.Services.AddTransient<CreatePessoaCommandHandler>();
builder.Services.AddTransient<CreatePedidoCommandHandler>();
builder.Services.AddTransient<UpdateProdutoCommandHandler>();
builder.Services.AddTransient<DeleteProdutoCommandHandler>();
builder.Services.AddTransient<UpdatePessoaCommandHandler>();
builder.Services.AddTransient<DeletePessoaCommandHandler>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
    await DataSeeder.SeedAsync(dbContext);
}

app.UseSerilogRequestLogging();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<IdempotencyLoggingMiddleware>();

// Enable CORS before routing/controllers
app.UseCors("Frontend");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // Nova interface visual que substitui o SwaggerUI
}

app.MapHealthChecks("/health");
app.MapControllers();

app.Run();
