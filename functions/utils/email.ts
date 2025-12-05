import { Resend } from 'resend'

export function createResendClient(apiKey: string) {
  return new Resend(apiKey)
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  resend: Resend,
  email: string,
  token: string,
  baseUrl: string,
) {
  const verificationUrl = `${baseUrl}/verify-email/${token}`

  const { data, error } = await resend.emails.send({
    from: 'Ruia∇bla <noreply@shikoch.in>',
    to: [email],
    subject: '验证您的邮箱 - Rui∇abla',
    html: `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #e0e0e0; line-height: 1.7; letter-spacing: 0.02em;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom right, #0a0a0a, #050505); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.02); padding: 48px 40px;">

    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 1.5rem; color: #ffffff; margin-bottom: 16px; letter-spacing: 0.05em;">RUI∇ABLA</div>

    <div style="font-family: 'Courier New', monospace; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: #888888; margin-bottom: 24px;">LIGHT VERIFICATION · EMAIL</div>

    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 2rem; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; margin: 0 0 24px 0;">验证您的邮箱</h1>

    <p style="color: #b0b0b0; margin: 0 0 24px 0; font-size: 1rem;">
      感谢您加入 Rui∇abla。在废墟中寻找光芒的旅程即将开始，请先验证您的邮箱地址：
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.12); color: #ffffff; text-decoration: none; font-family: 'Courier New', monospace; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">
        验证邮箱
      </a>
    </div>

    <div style="height: 1px; background: rgba(255, 255, 255, 0.12); margin: 32px 0;"></div>

    <div style="font-size: 0.875rem; color: #888888; word-break: break-all;">
      如果按钮无法点击，请复制以下链接到浏览器：<br><br>
      <a href="${verificationUrl}" style="color: #ffffff; text-decoration: none; border-bottom: 1px solid transparent;">${verificationUrl}</a>
    </div>

    <div style="font-size: 0.75rem; color: #666666; text-align: center; margin-top: 32px;">
      此链接将在 1 小时后过期<br>
      如果您没有注册 Rui∇abla，请忽略此邮件
    </div>
  </div>
</body>
</html>
    `,
  })

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`)
  }

  return data
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  resend: Resend,
  email: string,
  token: string,
  baseUrl: string,
) {
  const resetUrl = `${baseUrl}/reset-password/${token}`

  const { data, error } = await resend.emails.send({
    from: 'Ruia∇bla <noreply@shikoch.in>',
    to: [email],
    subject: '重置您的密码 - Rui∇abla',
    html: `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #e0e0e0; line-height: 1.7; letter-spacing: 0.02em;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom right, #0a0a0a, #050505); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.02); padding: 48px 40px;">

    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 1.5rem; color: #ffffff; margin-bottom: 16px; letter-spacing: 0.05em;">RUI∇ABLA</div>

    <div style="font-family: 'Courier New', monospace; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; color: #888888; margin-bottom: 24px;">SECURITY ALERT · PASSWORD RESET</div>

    <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 2rem; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; margin: 0 0 24px 0;">重置您的密码</h1>

    <p style="color: #b0b0b0; margin: 0 0 24px 0; font-size: 1rem;">
      我们收到了重置您账户密码的请求。如果这是您的操作，请点击下方按钮设置新密码：
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.12); color: #ffffff; text-decoration: none; font-family: 'Courier New', monospace; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em;">
        重置密码
      </a>
    </div>

    <div style="background: rgba(207, 85, 85, 0.05); border-left: 4px solid #cf5555; padding: 20px; margin: 24px 0;">
      <p style="margin: 0; color: #cf5555; font-size: 0.95rem;">
        ⚠️ 如果您没有请求重置密码，请立即忽略此邮件并考虑更改密码以保护账户安全。
      </p>
    </div>

    <div style="height: 1px; background: rgba(255, 255, 255, 0.12); margin: 32px 0;"></div>

    <div style="font-size: 0.875rem; color: #888888; word-break: break-all;">
      如果按钮无法点击，请复制以下链接到浏览器：<br><br>
      <a href="${resetUrl}" style="color: #ffffff; text-decoration: none; border-bottom: 1px solid transparent;">${resetUrl}</a>
    </div>

    <div style="font-size: 0.75rem; color: #666666; text-align: center; margin-top: 32px;">
      此链接将在 1 小时后过期
    </div>
  </div>
</body>
</html>
    `,
  })

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`)
  }

  return data
}
