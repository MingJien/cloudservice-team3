using System.Security.Claims;
using System.Text.Json;
using CloudService.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace CloudService.Infrastructure.Persistence;

/// <summary>
/// Persists catalog audit records in the same database transaction as the business change.
/// </summary>
public sealed class AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor) : SaveChangesInterceptor
{
    private static readonly HashSet<Type> AuditedTypes =
    [
        typeof(PlanPrice),
        typeof(Promotion),
        typeof(ServicePlan)
    ];

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        AddAuditEntries(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AddAuditEntries(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void AddAuditEntries(DbContext? context)
    {
        if (context is null) return;

        context.ChangeTracker.DetectChanges();
        var entries = context.ChangeTracker.Entries()
            .Where(entry => AuditedTypes.Contains(entry.Metadata.ClrType) &&
                            entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToArray();
        if (entries.Length == 0) return;

        var httpContext = httpContextAccessor.HttpContext;
        var userId = int.TryParse(httpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUserId)
            ? parsedUserId
            : (int?)null;
        var ipAddress = httpContext?.Connection.RemoteIpAddress?.ToString();

        foreach (var entry in entries)
        {
            var (action, oldValues, newValues) = Snapshot(entry);
            context.Set<AuditLog>().Add(new AuditLog(
                action,
                userId,
                entry.Metadata.ClrType.Name,
                EntityId(entry),
                Serialize(oldValues),
                Serialize(newValues),
                ipAddress));
        }
    }

    private static (string Action, Dictionary<string, object?>? OldValues, Dictionary<string, object?>? NewValues) Snapshot(EntityEntry entry)
    {
        if (entry.State == EntityState.Added)
            return ("Insert", null, Values(entry.Properties, useOriginal: false, modifiedOnly: false));
        if (entry.State == EntityState.Deleted)
            return ("Delete", Values(entry.Properties, useOriginal: true, modifiedOnly: false), null);

        var action = "Update";
        var deleted = entry.Properties.FirstOrDefault(property => property.Metadata.Name == "IsDeleted");
        if (deleted is { IsModified: true })
        {
            action = deleted.OriginalValue switch
            {
                false when deleted.CurrentValue is true => "SoftDelete",
                true when deleted.CurrentValue is false => "Restore",
                _ => action
            };
        }

        return (
            action,
            Values(entry.Properties, useOriginal: true, modifiedOnly: true),
            Values(entry.Properties, useOriginal: false, modifiedOnly: true));
    }

    private static Dictionary<string, object?> Values(
        IEnumerable<PropertyEntry> properties,
        bool useOriginal,
        bool modifiedOnly)
    {
        return properties
            .Where(property => !modifiedOnly || property.IsModified)
            .ToDictionary(
                property => property.Metadata.Name,
                property => Normalize(useOriginal ? property.OriginalValue : property.CurrentValue));
    }

    private static object? Normalize(object? value) => value is byte[] bytes
        ? Convert.ToBase64String(bytes)
        : value;

    private static string? EntityId(EntityEntry entry)
    {
        var key = entry.Metadata.FindPrimaryKey()?.Properties;
        if (key is null || key.Count == 0) return null;
        var values = key.Select(property => entry.Property(property.Name));
        if (values.Any(value => value.IsTemporary)) return null;
        return string.Join('|', values.Select(value => value.CurrentValue?.ToString()));
    }

    private static string? Serialize(Dictionary<string, object?>? values) =>
        values is null ? null : JsonSerializer.Serialize(values);
}
