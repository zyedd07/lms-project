// ========================================
// 1. USER ROUTES (routes/user.routes.ts)
// ========================================
import express from 'express';
import * as UserController from '../controllers/User.controller';
import isAuth, { authorizeAdmin, authorizeTeacher, refreshTokenController } from '../middleware/auth';

const router = express.Router();

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

/**
 * User Registration
 * POST /api/user/create
 */
router.post('/create', UserController.createUser);

/**
 * User Login
 * POST /api/user/login
 * Headers Required: X-Device-Id
 * Returns: { user, token, deviceToken }
 */
router.post('/login', UserController.loginUser);

/**
 * Google Sign-In
 * POST /api/user/google-signin
 */
router.post('/google-signin', UserController.googleSignIn);

/**
 * Facebook Sign-In
 * POST /api/user/facebook-signin
 */
router.post('/facebook-signin', UserController.facebookSignIn);

/**
 * Forgot Password
 * POST /api/user/forgot-password
 * Body: { email }
 */
router.post('/forgot-password', UserController.forgotPassword);

/**
 * PASSWORD RESET WEB PAGE
 * GET /api/user/reset-password?token=xxx
 * 
 * This serves an HTML page that:
 * 1. Tries to open the mobile app (if on mobile)
 * 2. Falls back to web form if app isn't installed
 */
router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invalid Link - ProfVet</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        text-align: center;
                        max-width: 400px;
                    }
                    h1 { color: #dc3545; }
                    p { color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>❌ Invalid Reset Link</h1>
                    <p>This password reset link is invalid or malformed.</p>
                    <p>Please request a new password reset link from the app.</p>
                </div>
            </body>
            </html>
        `);
    }
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Password - ProfVet</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 450px;
                width: 100%;
                padding: 40px;
            }
            h1 {
                color: #333;
                margin-bottom: 10px;
                font-size: 28px;
            }
            .subtitle {
                color: #666;
                margin-bottom: 30px;
                font-size: 14px;
            }
            .app-button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 16px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                width: 100%;
                cursor: pointer;
                margin-bottom: 20px;
                transition: transform 0.2s;
            }
            .app-button:hover:not(:disabled) {
                transform: translateY(-2px);
            }
            .app-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            .divider {
                text-align: center;
                margin: 20px 0;
                color: #999;
                font-size: 14px;
            }
            input {
                width: 100%;
                padding: 14px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 15px;
                margin-bottom: 12px;
                transition: border-color 0.3s;
            }
            input:focus {
                outline: none;
                border-color: #667eea;
            }
            input.error {
                border-color: #dc3545;
            }
            button[type="submit"] {
                background: #667eea;
                color: white;
                border: none;
                padding: 14px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                width: 100%;
                cursor: pointer;
                margin-top: 10px;
                transition: background 0.3s;
            }
            button[type="submit"]:hover:not(:disabled) {
                background: #5568d3;
            }
            button[type="submit"]:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            .message {
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            .success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }
            .loading {
                display: none;
                text-align: center;
                color: #667eea;
                margin: 20px 0;
            }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            #webForm {
                display: none;
            }
            .password-requirements {
                font-size: 12px;
                color: #666;
                margin-bottom: 15px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            .password-requirements ul {
                margin: 5px 0 0 20px;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1> Reset Password</h1>
            <p class="subtitle">Choose how you'd like to reset your password</p>
            
            <div id="message"></div>
            
            <!-- App Button -->
            <button class="app-button" id="appButton" onclick="openApp()">
                 Open in ProfVet App
            </button>
            
            <div class="divider">or reset via web</div>
            
            <button class="app-button" style="background: #6c757d;" onclick="showWebForm()">
                 Reset via Browser
            </button>
            
            <!-- Web Form -->
            <form id="webForm" onsubmit="resetPassword(event)">
                <div class="password-requirements">
                    <strong>Password requirements:</strong>
                    <ul>
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                    </ul>
                </div>
                <input 
                    type="password" 
                    id="password" 
                    placeholder="New Password" 
                    required 
                    minlength="8"
                    autocomplete="new-password"
                >
                <input 
                    type="password" 
                    id="confirmPassword" 
                    placeholder="Confirm Password" 
                    required 
                    minlength="8"
                    autocomplete="new-password"
                >
                <button type="submit" id="submitButton">Reset Password</button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p id="loadingText">Resetting password...</p>
            </div>
        </div>
        
        <script>
            const token = "${token}";
            const messageDiv = document.getElementById('message');
            const webForm = document.getElementById('webForm');
            const loading = document.getElementById('loading');
            const appButton = document.getElementById('appButton');
            const submitButton = document.getElementById('submitButton');
            
            let appOpenAttempted = false;
            
            function showMessage(text, type) {
                messageDiv.className = 'message ' + type;
                messageDiv.textContent = text;
                messageDiv.style.display = 'block';
                
                // Auto-hide info messages after 5 seconds
                if (type === 'info') {
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 5000);
                }
            }
            
            function openApp() {
                if (appOpenAttempted) {
                    showMessage('App already opened. Use the web form below if needed.', 'info');
                    showWebForm();
                    return;
                }
                
                appOpenAttempted = true;
                showMessage('Opening ProfVet app...', 'info');
                appButton.disabled = true;
                
                // Construct deep link with token
                const deepLink = 'profvet://reset-password?token=' + encodeURIComponent(token);
                
                // Try to open the app
                window.location.href = deepLink;
                
                // Fallback after 3 seconds
                setTimeout(() => {
                    appButton.disabled = false;
                    showMessage('App not installed? Use the web form below.', 'info');
                    showWebForm();
                }, 3000);
            }
            
            function showWebForm() {
                webForm.style.display = 'block';
                messageDiv.style.display = 'none';
                document.getElementById('password').focus();
            }
            
            function validatePassword(password) {
                const errors = [];
                
                if (password.length < 8) {
                    errors.push('Password must be at least 8 characters long');
                }
                if (!/[A-Z]/.test(password)) {
                    errors.push('Password must contain at least one uppercase letter');
                }
                if (!/[a-z]/.test(password)) {
                    errors.push('Password must contain at least one lowercase letter');
                }
                if (!/[0-9]/.test(password)) {
                    errors.push('Password must contain at least one number');
                }
                
                return errors;
            }
            
            async function resetPassword(e) {
                e.preventDefault();
                
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const passwordInput = document.getElementById('password');
                const confirmInput = document.getElementById('confirmPassword');
                
                // Reset error states
                passwordInput.classList.remove('error');
                confirmInput.classList.remove('error');
                
                // Validate passwords match
                if (password !== confirmPassword) {
                    showMessage('❌ Passwords do not match!', 'error');
                    confirmInput.classList.add('error');
                    confirmInput.focus();
                    return;
                }
                
                // Validate password strength
                const errors = validatePassword(password);
                if (errors.length > 0) {
                    showMessage('❌ ' + errors.join('. '), 'error');
                    passwordInput.classList.add('error');
                    passwordInput.focus();
                    return;
                }
                
                // Show loading state
                webForm.style.display = 'none';
                loading.style.display = 'block';
                submitButton.disabled = true;
                
                try {
                    const response = await fetch('${backendUrl}user/reset-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ 
                            token: token, 
                            newPassword: password 
                        })
                    });
                    
                    const data = await response.json();
                    
                    loading.style.display = 'none';
                    submitButton.disabled = false;
                    
                    if (response.ok) {
                        showMessage('✅ ' + data.message + ' Redirecting to app...', 'success');
                        
                        // Try to open app login screen after 2 seconds
                        setTimeout(() => {
                            window.location.href = 'profvet://login';
                            
                            // Show alternative message after 3 more seconds
                            setTimeout(() => {
                                showMessage('You can now close this page and login in the app.', 'success');
                            }, 3000);
                        }, 2000);
                    } else {
                        showMessage('❌ ' + (data.message || 'An error occurred'), 'error');
                        webForm.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Reset password error:', error);
                    loading.style.display = 'none';
                    submitButton.disabled = false;
                    showMessage('❌ Network error. Please check your connection and try again.', 'error');
                    webForm.style.display = 'block';
                }
            }
            
            // Auto-try to open app on mobile devices only
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                setTimeout(() => {
                    openApp();
                }, 500);
            }
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

/**
 * Reset Password API
 * POST /api/user/reset-password
 * Body: { token, newPassword }
 */
router.post('/reset-password', UserController.resetPassword);

// ========================================
// AUTHENTICATED ROUTES
// ========================================

router.post('/refresh-token', refreshTokenController);
router.post('/logout', UserController.logoutUser);
router.get('/me', isAuth, UserController.getLoggedInUser);
router.put('/meupdate', isAuth, UserController.updateMyProfile);
router.put(
    '/profile-picture',
    isAuth,
    UserController.profilePictureUpload.single('profilePicture'),
    UserController.uploadProfilePictureController
);

// ========================================
// ADMIN-ONLY ROUTES
// ========================================

router.get('/teachers/pending', isAuth, authorizeAdmin, UserController.getPendingTeachers);
router.put('/teachers/:id/approve', isAuth, authorizeAdmin, UserController.approveTeacher);
router.put('/teachers/:id/reject', isAuth, authorizeAdmin, UserController.rejectTeacher);
router.get('/', isAuth, authorizeAdmin, UserController.getAllUsers);
router.get('/:email', isAuth, authorizeAdmin, UserController.getUser);
router.put('/:id', isAuth, authorizeAdmin, UserController.updateUser);
router.delete('/:id', isAuth, authorizeAdmin, UserController.deleteUser);

export default router;
