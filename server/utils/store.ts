import type {StandardUserInfo} from '../types/qq'
import {createSimpleJwt, verifySimpleJwt} from './jwt'

// 授权码信息
interface AuthCodeData {
    userId: string
    userInfo: StandardUserInfo
    clientId: string
    redirectUri: string
    scope: string
}

// Token 信息
interface TokenData {
    userId: string
    userInfo: StandardUserInfo
    scope: string
}

// 授权码有效期：10 分钟（秒）
const CODE_EXPIRES_IN = 10 * 60
// Token 有效期：1 小时（秒）
const TOKEN_EXPIRES_IN = 60 * 60

/**
 * 生成授权码（JWT 格式，自包含数据）
 */
export async function generateCode(
    data: AuthCodeData,
    secret: string
): Promise<string> {
    return await createSimpleJwt(data, secret, CODE_EXPIRES_IN)
}

/**
 * 生成 access token（JWT 格式，自包含数据）
 */
export async function generateToken(
    data: TokenData,
    secret: string
): Promise<string> {
    return await createSimpleJwt(data, secret, TOKEN_EXPIRES_IN)
}

/**
 * 保存授权码（JWT 方案下不需要实际保存，仅用于日志）
 */
export function saveAuthCode(code: string, data: AuthCodeData): void {
    console.log('[Store] 生成授权码 JWT:', code.substring(0, 20) + '...')
}

/**
 * 验证并获取授权码数据（从 JWT 中解析）
 */
export async function getAuthCode(
    code: string,
    secret: string
): Promise<AuthCodeData | null> {
    console.log('[Store] 验证授权码 JWT:', code.substring(0, 20) + '...')

    const data = await verifySimpleJwt<AuthCodeData>(code, secret)
    if (!data) {
        console.error('[Store] 授权码无效或已过期')
        return null
    }

    console.log('[Store] 授权码验证成功，用户:', data.userId)
    return data
}

/**
 * 保存 access token（JWT 方案下不需要实际保存，仅用于日志）
 */
export function saveAccessToken(token: string, data: TokenData): void {
    console.log('[Store] 生成 access token JWT:', token.substring(0, 20) + '...')
}

/**
 * 验证并获取 token 数据（从 JWT 中解析）
 */
export async function getStoredToken(
    token: string,
    secret: string
): Promise<TokenData | null> {
    console.log('[Store] 验证 access token JWT:', token.substring(0, 20) + '...')

    const data = await verifySimpleJwt<TokenData>(token, secret)
    if (!data) {
        console.error('[Store] Token 无效或已过期')
        return null
    }

    console.log('[Store] Token 验证成功，用户:', data.userId)
    return data
}

export {TOKEN_EXPIRES_IN}
