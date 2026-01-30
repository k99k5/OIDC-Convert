import type {StandardUserInfo} from '../types/qq'

// 授权码信息
interface AuthCodeData {
    userId: string
    userInfo: StandardUserInfo
    clientId: string
    redirectUri: string
    scope: string
    createdAt: number
}

// Token 信息
interface TokenData {
    userId: string
    userInfo: StandardUserInfo
    scope: string
    createdAt: number
    expiresAt: number
}

// 内存存储（生产环境应使用 Redis）
const authCodes = new Map<string, AuthCodeData>()
const accessTokens = new Map<string, TokenData>()

// 授权码有效期：10 分钟
const CODE_EXPIRES_IN = 10 * 60 * 1000
// Token 有效期：1 小时
const TOKEN_EXPIRES_IN = 60 * 60 * 1000

export function generateCode(): string {
    return crypto.randomUUID()
}

export function generateToken(): string {
    return crypto.randomUUID()
}

export function saveAuthCode(
    code: string,
    data: Omit<AuthCodeData, 'createdAt'>
): void {
    authCodes.set(code, {...data, createdAt: Date.now()})
}

export function getAuthCode(code: string): AuthCodeData | null {
    const data = authCodes.get(code)
    if (!data) return null

    // 检查是否过期
    if (Date.now() - data.createdAt > CODE_EXPIRES_IN) {
        authCodes.delete(code)
        return null
    }

    // 使用后删除（一次性）
    authCodes.delete(code)
    return data
}

export function saveAccessToken(
    token: string,
    data: Omit<TokenData, 'createdAt' | 'expiresAt'>
): void {
    const now = Date.now()
    accessTokens.set(token, {
        ...data,
        createdAt: now,
        expiresAt: now + TOKEN_EXPIRES_IN,
    })
}

export function getStoredToken(token: string): TokenData | null {
    const data = accessTokens.get(token)
    if (!data) return null

    if (Date.now() > data.expiresAt) {
        accessTokens.delete(token)
        return null
    }

    return data
}

export {TOKEN_EXPIRES_IN}
