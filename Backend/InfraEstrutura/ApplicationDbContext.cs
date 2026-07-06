using Dominio.Entidades;
using Dominio.Enums;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace InfraEstrutura
{
    public class ApplicationDbContext : DbContext
    {
        // Define as coleções de entidades que serão mapeadas para as tabelas no PostgreSQL
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Pessoa> Pessoas { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItemsPedido { get; set; }
        public DbSet<IdempotencyKey> IdempotencyKeys { get; set; } // Tabela de Idempotência

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Aplica todas as configurações de mapeamento (Fluent API)
            // Isso permite configurar o nome das tabelas, colunas, chaves e índices

            // 1. Produtos
            modelBuilder.Entity<Produto>(entity =>
            {
                entity.ToTable("produtos");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Sku).IsUnique();
                entity.Property(e => e.Preco).HasColumnType("numeric(18, 2)");
                entity.Property(e => e.Estoque).HasColumnName("qt_estoque");
            });

            // 2. Clientes
            modelBuilder.Entity<Pessoa>(entity =>
            {
                entity.ToTable("pessoas");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CpfCnpj).IsUnique();
            });

            // 3. Pedidos
            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.ToTable("pedidos");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ValorTotalPedido).HasColumnName("total_pedido").HasColumnType("numeric(18, 2)");
                entity.Property(e => e.DataCriacao).HasColumnName("data_criacao");
                entity.Property(e => e.Status)
                    .HasColumnName("status")
                      .HasConversion(
                          status => status.ToString().ToUpperInvariant(),
                          value => Enum.Parse<PedidoStatus>(value, true))
                      .HasMaxLength(20);

                entity.Property(o => o.IdempotencyKeyId)
                    .HasColumnName("idempotency_key")
                    .IsRequired(false);

                // Relação 1:N com Pessoa
                entity.HasOne<Pessoa>()
                    .WithMany()
                    .HasForeignKey(o => o.ClienteId);

                // Relação com Chave de Idempotência
                entity.HasOne<IdempotencyKey>()
                    .WithMany()
                    .HasForeignKey(o => o.IdempotencyKeyId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(o => o.IdempotencyKeyId).HasDatabaseName("ix_pedidos_idempotency_key").IsUnique();

                entity.Navigation(o => o.Items)
                      .UsePropertyAccessMode(PropertyAccessMode.Field);
            });

            // 4. Itens do Pedido
            modelBuilder.Entity<ItemPedido>(entity =>
            {
                entity.ToTable("pedidoitem");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PrecoUnitario).HasColumnName("preco_unitario").HasColumnType("numeric(18, 2)");
                entity.Property(e => e.ValorTotalUnitario).HasColumnName("total_unitario").HasColumnType("numeric(18, 2)");

                // Relação com Produto
                entity.HasOne(oi => oi.Produto)
                      .WithMany()
                      .HasForeignKey(oi => oi.ProdutoId);
            });

            // 5. Chave de Idempotência
            modelBuilder.Entity<IdempotencyKey>(entity =>
            {
                entity.ToTable("idempotency_keys");
                entity.HasKey(e => e.Key);
            });
        }
    }
}
