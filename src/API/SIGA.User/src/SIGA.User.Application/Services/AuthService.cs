using SIGA.User.Domain.Interfaces;
using SIGA.User.Domain.Models;


namespace SIGA.User.Application.Services;

/// <summary>
/// Serviço responsável pela autenticação de usuários.
/// </summary>
public class AuthService
{
    private readonly IUserRepository _userRepository;

    /// <summary>
    /// Construtor do serviço de autenticação.
    /// </summary>
    /// <param name="userRepository">Repositório de usuários.</param>
    public AuthService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// Valida as credenciais do usuário para o login.
    /// </summary>
    /// <param name="email">E-mail do usuário.</param>
    /// <param name="password">Senha do usuário.</param>
    /// <returns>Retorna o objeto User se o login for bem-sucedido, caso contrário null.</returns>
    public async Task<SIGA.User.Domain.Models.User?> ValidateUserAsync(string email, string password)
    {
        var user = await _userRepository.GetByEmailAsync(email);

        if (user == null || user.Password != password)
        {
            return null;
        }

        return user;
    }
}
