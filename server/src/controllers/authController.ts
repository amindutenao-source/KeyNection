import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { emailService } from '../services/emailService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

export class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Inscription d'un nouvel utilisateur
   * @access  Public
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    // Envoyer l'email de bienvenue
    try {
      await emailService.sendWelcomeEmail(result.user.email, result.user.firstName);
    } catch (error) {
      console.error('Erreur envoi email de bienvenue:', error);
    }

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @route   POST /api/auth/login
   * @desc    Connexion d'un utilisateur
   * @access  Public
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    return res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      }
    });
  });

  /**
   * @route   GET /api/auth/me
   * @desc    Obtenir les informations de l'utilisateur connecté
   * @access  Private
   */
  static getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.getProfile(req.user!.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    return res.json({
      success: true,
      data: { user }
    });
  });

  /**
   * @route   PUT /api/auth/profile
   * @desc    Mettre à jour le profil utilisateur
   * @access  Private
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await authService.updateProfile(req.user!.id, req.body);

    return res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user }
    });
  });

  /**
   * @route   PUT /api/auth/change-password
   * @desc    Changer le mot de passe
   * @access  Private
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user!.id, currentPassword, newPassword);

    return res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  });

  /**
   * @route   POST /api/auth/forgot-password
   * @desc    Demander une réinitialisation de mot de passe
   * @access  Public
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    return res.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé'
    });
  });

  /**
   * @route   POST /api/auth/reset-password
   * @desc    Réinitialiser le mot de passe
   * @access  Public
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    return res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  });

  /**
   * @route   POST /api/auth/refresh
   * @desc    Rafraîchir le token JWT
   * @access  Private
   */
  static refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    return res.json({
      success: true,
      data: tokens
    });
  });

  /**
   * @route   POST /api/auth/logout
   * @desc    Déconnexion (côté client)
   * @access  Private
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // En production, on pourrait ajouter le token à une blacklist Redis
    return res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  });

  /**
   * @route   DELETE /api/auth/account
   * @desc    Désactiver le compte utilisateur
   * @access  Private
   */
  static deactivateAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await authService.deactivateAccount(req.user!.id);

    return res.json({
      success: true,
      message: 'Compte désactivé avec succès'
    });
  });

  /**
   * @route   POST /api/auth/verify-email
   * @desc    Vérifier l'email (mock)
   * @access  Private
   */
  static verifyEmail = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body;
    await authService.verifyEmail(token);

    return res.json({
      success: true,
      message: 'Email vérifié avec succès'
    });
  });
} 
