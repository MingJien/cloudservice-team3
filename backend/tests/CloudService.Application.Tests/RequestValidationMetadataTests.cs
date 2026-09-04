using System.ComponentModel.DataAnnotations;
using CloudService.Application.Features.Auth.Models;
using CloudService.Application.Features.Pricing.Models;
using Xunit;

namespace CloudService.Application.Tests;

public sealed class RequestValidationMetadataTests
{
    [Theory]
    [InlineData(typeof(LoginRequest), "UserNameOrEmail", typeof(RequiredAttribute))]
    [InlineData(typeof(LoginRequest), "Password", typeof(StringLengthAttribute))]
    [InlineData(typeof(PricingQuoteRequest), "ServicePlanId", typeof(RangeAttribute))]
    public void PositionalRequestRecords_KeepValidationOnConstructorParameters(
        Type requestType,
        string parameterName,
        Type attributeType)
    {
        var parameter = requestType
            .GetConstructors()
            .Single()
            .GetParameters()
            .Single(candidate => candidate.Name == parameterName);

        Assert.Contains(parameter.GetCustomAttributes(inherit: true), attributeType.IsInstanceOfType);
    }
}
